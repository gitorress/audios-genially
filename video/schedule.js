// Constrói a timeline absoluta (em segundos) a partir de timeline-data.js
// Roda tanto no browser (script normal) quanto no Node (capture script).

(function (root) {
  const data = typeof module !== "undefined" ? require("./timeline-data.js") : root.TIMELINE_DATA;
  const { PERSONAS, OPENING, BLOCKS, ALL_COMMENTS, EMOTIONAL_LINES, CLOSING_LINES, OPEN_END } = data;

  const titles = []; // {start,end,text,size,kind}
  const personaCues = []; // {persona,start,end,role:'ambient'|'hero'|'group', x, accent}
  const bubbleCues = []; // {start,end,name,text,accent,side}
  const blockCues = []; // {start,end,id,accent,hero}
  const bgCues = []; // {start,end,accent}

  OPENING.titles.forEach((t) => titles.push({ ...t, kind: "opening" }));

  // grupo de personas surge no fim da abertura, todas visíveis juntas
  Object.keys(PERSONAS).forEach((key, i) => {
    personaCues.push({
      persona: key,
      start: OPENING.personaReveal.start,
      end: OPEN_END,
      role: "group",
      slot: i,
    });
  });

  let cursor = OPEN_END;
  const BUBBLE_SIDES = ["left", "right", "left"];

  BLOCKS.forEach((block) => {
    const blockStart = cursor;
    // texto de transição
    const transStart = cursor;
    const transEnd = transStart + block.transitionDur;
    titles.push({ start: transStart, end: transEnd, text: block.transition, size: "block", kind: "transition", accent: block.accent });
    cursor = transEnd;

    // persona hero em destaque durante todo o bloco (start definido depois de saber block end)
    const heroStart = transStart;

    // comentários
    block.comments.forEach((c, i) => {
      const cs = cursor;
      const ce = cs + block.commentDur;
      bubbleCues.push({
        start: cs,
        end: ce,
        name: c.name,
        text: c.text,
        accent: block.accent,
        side: BUBBLE_SIDES[i % BUBBLE_SIDES.length],
        blockId: block.id,
      });
      cursor = ce;
    });

    // narração (pode ter 1 ou 2 linhas)
    block.narration.forEach((n) => {
      const ns = cursor;
      const ne = ns + n.dur;
      titles.push({ start: ns, end: ne, text: n.text, size: "narration", kind: "narration", accent: block.accent });
      cursor = ne;
    });

    const blockEnd = cursor;
    blockCues.push({ start: blockStart, end: blockEnd, id: block.id, accent: block.accent, hero: block.hero, index: blockCues.length, heroSide: blockCues.length % 2 === 0 ? "right" : "left" });
    personaCues.push({ persona: block.hero, start: heroStart, end: blockEnd, role: "hero", accent: block.accent });
    bgCues.push({ start: blockStart, end: blockEnd, accent: block.accent });
  });

  // ---- Momento emocional ----
  const emoStart = cursor;
  let t = emoStart;
  EMOTIONAL_LINES.forEach((l) => {
    titles.push({ start: t, end: t + l.dur, text: l.text, size: "emotional", kind: "emotional" });
    t += l.dur + (l.pause || 0);
  });
  const emoEnd = t;
  Object.keys(PERSONAS).forEach((key, i) => {
    personaCues.push({ persona: key, start: emoStart, end: emoEnd, role: "group", slot: i });
  });
  cursor = emoEnd;

  // ---- Encerramento ----
  const closeStart = cursor;
  const wipeDur = 1.5;
  const logoInStart = closeStart + wipeDur;
  const logoInDur = 1.5;
  const lineDur = 1.8; // duração média por linha de encerramento (ajustada por tamanho)
  let ct = logoInStart + logoInDur - 0.4; // pequena sobreposição com entrada do logo

  const closingCues = CLOSING_LINES.map((l) => {
    const dur = l.size === "xl" ? 1.6 : 2.0;
    const cs = ct;
    const ce = cs + dur;
    ct = ce - 0.15; // leve overlap no crossfade
    return { start: cs, end: ce, text: l.text, size: l.size };
  });
  // a última linha ("FELIZ SEMANA DO CLIENTE") permanece até o fade final
  const lastLineEnd = closingCues[closingCues.length - 1].end;
  const fadeOutStart = lastLineEnd + 1.0;
  const fadeOutDur = 2.2;
  const totalDuration = fadeOutStart + fadeOutDur;

  const schedule = {
    titles,
    personaCues,
    bubbleCues,
    blockCues,
    bgCues,
    emotional: { start: emoStart, end: emoEnd },
    closing: {
      start: closeStart,
      wipeDur,
      logoInStart,
      logoInDur,
      lines: closingCues,
      fadeOutStart,
      fadeOutDur,
      logoHoldFrom: logoInStart, // logo visível desde aqui até o fim (> 5s)
    },
    openEnd: OPEN_END,
    blockStart: OPEN_END,
    blockEnd: emoStart,
    totalDuration,
  };

  if (typeof module !== "undefined") {
    module.exports = schedule;
  } else {
    root.SCHEDULE = schedule;
  }
})(typeof window !== "undefined" ? window : global);
