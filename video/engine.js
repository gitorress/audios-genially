// Motor de renderização determinístico do vídeo institucional DM.
// render(t) é uma função pura de t (segundos) sobre o estado do DOM: dado o
// mesmo t, produz sempre o mesmo frame — essencial para a captura frame-a-frame.

(function () {
  const S = window.SCHEDULE;
  const DATA = window.TIMELINE_DATA;
  const ACCENTS = {
    coral: "#FF9A98",
    yellow: "#FFE372",
    mint: "#7DF4ED",
    green: "#68E699",
    lightblue: "#42D6FD",
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // opacidade com fade-in/fade-out dentro de uma janela [start,end]
  function fadeWindow(t, start, end, fadeIn = 0.5, fadeOut = 0.5) {
    if (t <= start || t >= end) return 0;
    const inT = clamp((t - start) / fadeIn, 0, 1);
    const outT = clamp((end - t) / fadeOut, 0, 1);
    return Math.min(easeOutCubic(inT), easeOutCubic(outT));
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------
  // Setup DOM
  // ---------------------------------------------------------------
  const stage = document.getElementById("stage");
  const glowLayer = document.getElementById("bg-glow");
  const personaLayer = document.getElementById("persona-layer");
  const titleLayer = document.getElementById("title-layer");
  const bubbleLayer = document.getElementById("bubble-layer");
  const constellation = document.getElementById("constellation");
  const closingWipe = document.getElementById("closing-wipe");
  const logoWrap = document.getElementById("logo-wrap");
  const closingText = document.getElementById("closing-text");
  const finalFade = document.getElementById("final-fade");

  // blobs de destaque (um por accent, todos empilhados, cross-fade por opacidade)
  const blobEls = {};
  Object.entries(ACCENTS).forEach(([name, color], i) => {
    const el = document.createElement("div");
    el.className = "blob";
    el.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
    el.style.left = i % 2 === 0 ? "62%" : "8%";
    el.style.top = "18%";
    glowLayer.appendChild(el);
    blobEls[name] = el;
  });

  // personas
  const personaEls = {};
  Object.entries(DATA.PERSONAS).forEach(([key, p]) => {
    const wrap = document.createElement("div");
    wrap.className = "persona";
    const img = document.createElement("img");
    img.src = p.file;
    wrap.appendChild(img);
    personaLayer.appendChild(wrap);
    personaEls[key] = wrap;
  });

  // títulos — um elemento por cue (pré-criado, alternando visibilidade)
  const titleEls = S.titles.map((cue) => {
    const el = document.createElement("div");
    const sizeClass = {
      lg: "t-lg", md: "t-md", sm: "t-sm", block: "t-block",
      narration: "t-narration", emotional: "t-emotional",
    }[cue.size] || "t-md";
    el.className = "title-block " + sizeClass;
    if (cue.kind === "transition" && cue.accent) {
      const rule = document.createElement("span");
      rule.className = "accent-rule";
      rule.style.background = ACCENTS[cue.accent] || "#fff";
      el.appendChild(rule);
    }
    const p = document.createElement("p");
    p.textContent = cue.text;
    el.appendChild(p);
    titleLayer.appendChild(el);
    return el;
  });

  // bolhas de comentário
  const bubbleEls = S.bubbleCues.map((cue) => {
    const el = document.createElement("div");
    el.className = "bubble";
    const accent = ACCENTS[cue.accent] || "#42D6FD";
    const quote = document.createElement("div");
    quote.className = "quote-mark";
    quote.style.background = accent;
    quote.textContent = "”";
    el.appendChild(quote);
    const txt = document.createElement("p");
    txt.className = "txt";
    txt.textContent = "“" + cue.text + "”";
    el.appendChild(txt);
    const who = document.createElement("div");
    who.className = "who";
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.background = accent;
    avatar.textContent = cue.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    const nameWrap = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = cue.name;
    const tagEl = document.createElement("div");
    tagEl.className = "tag";
    tagEl.textContent = "Cliente DM";
    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(tagEl);
    who.appendChild(avatar);
    who.appendChild(nameWrap);
    el.appendChild(who);
    bubbleLayer.appendChild(el);
    return el;
  });

  // fragmentos da constelação emocional
  const rngFrag = mulberry32(20250612);
  const fragEls = DATA.ALL_COMMENTS.map((c, i) => {
    const el = document.createElement("div");
    el.className = "frag";
    el.textContent = "“" + c.text.slice(0, 70) + (c.text.length > 70 ? "…" : "") + "”";
    const x = 90 + rngFrag() * 1650;
    const y = 90 + rngFrag() * 780;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.delay = (rngFrag() * 0.8).toFixed(3);
    constellation.appendChild(el);
    return el;
  });

  // linhas de encerramento
  const closingLineEls = S.closing.lines.map((line) => {
    const el = document.createElement("div");
    el.className = "line " + (line.size === "xl" ? "t-close-xl" : "t-close-md");
    const p = document.createElement("p");
    p.textContent = line.text;
    el.appendChild(p);
    closingText.appendChild(el);
    return el;
  });

  // canvas de partículas
  const canvas = document.getElementById("particles");
  canvas.width = 1920; canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  const NUM_PARTICLES = 140;
  const rngP = mulberry32(7);
  const particles = Array.from({ length: NUM_PARTICLES }, () => ({
    x: rngP() * 1920,
    y0: rngP() * 1080,
    speed: 6 + rngP() * 14,
    size: 1 + rngP() * 2.4,
    phase: rngP() * Math.PI * 2,
    sway: 20 + rngP() * 40,
  }));

  // ---------------------------------------------------------------
  // Estado de personas
  // ---------------------------------------------------------------
  const GROUP_SLOTS = [
    { x: 300, scaleMul: 0.82, dim: 0.4, blur: 5 },
    { x: 660, scaleMul: 0.94, dim: 0.68, blur: 2 },
    { x: 990, scaleMul: 1.05, dim: 1.0, blur: 0 },
    { x: 1300, scaleMul: 0.94, dim: 0.68, blur: 2 },
    { x: 1650, scaleMul: 0.82, dim: 0.4, blur: 5 },
  ];
  const personaKeys = Object.keys(DATA.PERSONAS);

  function findBlock(t) {
    return S.blockCues.find((b) => t >= b.start && t < b.end) || null;
  }

  function personaState(key, t) {
    const revealStart = DATA.OPENING.personaReveal.start;
    const openEnd = S.openEnd;
    const emo = S.emotional;
    const wipeStart = S.closing.start;
    const wipeEnd = S.closing.logoInStart;
    const slotIndex = personaKeys.indexOf(key);

    // grupo (abertura)
    if (t >= revealStart && t < openEnd) {
      const op = clamp((t - revealStart) / (openEnd - revealStart), 0, 1);
      return { visible: true, mode: "group", slot: slotIndex, opacityMul: easeOutCubic(op) };
    }
    // grupo (momento emocional)
    if (t >= emo.start && t < emo.end) {
      const fadeT = fadeWindow(t, emo.start, emo.end, 1.2, 0.8);
      return { visible: true, mode: "group", slot: slotIndex, opacityMul: fadeT };
    }
    // wipe de encerramento: grupo esmaecendo
    if (t >= wipeStart && t < wipeEnd) {
      const op = 1 - clamp((t - wipeStart) / (wipeEnd - wipeStart), 0, 1);
      return { visible: op > 0.01, mode: "group", slot: slotIndex, opacityMul: op };
    }
    // blocos: hero em destaque, demais ambientes
    if (t >= openEnd && t < emo.start) {
      const block = findBlock(t);
      if (block) {
        if (block.hero === key) {
          const fadeT = fadeWindow(t, block.start, block.end, 0.9, 0.5);
          return { visible: true, mode: "hero", side: block.heroSide, opacityMul: fadeT };
        }
        return { visible: true, mode: "ambient", slot: slotIndex, opacityMul: 1 };
      }
    }
    return { visible: false };
  }

  function layoutPersona(el, key, t) {
    const st = personaState(key, t);
    if (!st.visible) { el.style.opacity = 0; return; }
    const p = DATA.PERSONAS[key];
    const floatY = Math.sin(t * 0.55 + personaKeys.indexOf(key)) * 8;
    const floatR = Math.sin(t * 0.32 + personaKeys.indexOf(key) * 1.7) * 1.1;

    if (st.mode === "group") {
      const slot = GROUP_SLOTS[st.slot];
      const height = 640 * slot.scaleMul;
      el.style.height = height + "px";
      el.style.left = slot.x + "px";
      el.style.top = (900 - height) + "px";
      el.style.transform = `translate(-50%,0) translateY(${floatY * 0.6}px) rotate(${floatR}deg)`;
      el.style.filter = `drop-shadow(0 40px 60px rgba(0,0,15,0.5)) blur(${slot.blur}px)`;
      el.style.opacity = clamp(slot.dim * st.opacityMul, 0, 1);
      el.style.zIndex = 10 + (2 - Math.abs(2 - st.slot));
    } else if (st.mode === "hero") {
      const height = 900;
      const x = st.side === "right" ? 1360 : 560;
      el.style.height = height + "px";
      el.style.left = x + "px";
      el.style.top = (1000 - height) + "px";
      el.style.transform = `translate(-50%,0) translateY(${floatY}px) rotate(${floatR * 0.6}deg)`;
      el.style.filter = `drop-shadow(0 50px 80px rgba(0,0,15,0.55))`;
      el.style.opacity = st.opacityMul;
      el.style.zIndex = 20;
    } else if (st.mode === "ambient") {
      const slot = GROUP_SLOTS[st.slot];
      const height = 300;
      el.style.height = height + "px";
      el.style.left = slot.x + "px";
      el.style.top = (1040 - height) + "px";
      el.style.transform = `translate(-50%,0) translateY(${floatY * 0.4}px)`;
      el.style.filter = `drop-shadow(0 20px 30px rgba(0,0,15,0.4)) blur(4px)`;
      el.style.opacity = 0.16;
      el.style.zIndex = 5;
    }
  }

  // ---------------------------------------------------------------
  // Bolhas: posição de ancoragem
  // ---------------------------------------------------------------
  const V_ANCHORS = [230, 470, 700];
  function layoutBubble(el, cue, t) {
    const op = fadeWindow(t, cue.start, cue.end, 0.45, 0.4);
    if (op <= 0.001) { el.style.opacity = 0; return; }
    const idx = S.bubbleCues.indexOf(cue);
    const vAnchor = V_ANCHORS[idx % V_ANCHORS.length];
    const x = cue.side === "left" ? 150 : 1210;
    const inT = clamp((t - cue.start) / 0.45, 0, 1);
    const outT = clamp((cue.end - t) / 0.4, 0, 1);
    const settle = Math.min(easeOutCubic(inT), easeOutCubic(outT));
    const slideDir = cue.side === "left" ? -1 : 1;
    const slide = (1 - settle) * 50 * slideDir;
    const floatY = Math.sin(t * 0.7 + idx * 1.3) * 6;
    el.style.left = x + "px";
    el.style.top = vAnchor + "px";
    el.style.opacity = op;
    el.style.transform = `translateX(${slide}px) translateY(${floatY}px) scale(${lerp(0.94, 1, settle)})`;
    el.style.zIndex = 30;
  }

  // ---------------------------------------------------------------
  // Títulos
  // ---------------------------------------------------------------
  function layoutTitle(el, cue, t) {
    const op = fadeWindow(t, cue.start, cue.end, 0.55, 0.5);
    if (op <= 0.001) { el.style.opacity = 0; return; }
    const inT = clamp((t - cue.start) / 0.55, 0, 1);
    const rise = lerp(26, 0, easeOutCubic(inT));
    const blurPx = lerp(8, 0, easeOutCubic(inT));
    el.style.opacity = op;
    el.style.transform = `translate(-50%,-50%) translateY(${rise}px)`;
    el.style.filter = `blur(${Math.max(0, blurPx - (1 - op) * 8)}px)`;
    el.style.zIndex = 40;
  }

  // ---------------------------------------------------------------
  // Constelação emocional
  // ---------------------------------------------------------------
  function layoutConstellation(t) {
    const emo = S.emotional;
    const active = t >= emo.start - 1 && t < emo.end + 1.5;
    if (!active) {
      fragEls.forEach((el) => (el.style.opacity = 0));
      return;
    }
    const localT = t - emo.start;
    fragEls.forEach((el, i) => {
      const delay = parseFloat(el.dataset.delay) + (i % 5) * 0.15;
      const op = fadeWindow(localT, delay, (emo.end - emo.start) + 1.2, 0.9, 0.9) * 0.9;
      el.style.opacity = clamp(op, 0, 1);
      const drift = Math.sin((t + i) * 0.25) * 6;
      el.style.transform = `translateY(${drift}px)`;
      el.style.filter = `blur(${op < 0.5 ? 2 : 0}px)`;
    });
  }

  // ---------------------------------------------------------------
  // Fundo (glow por bloco)
  // ---------------------------------------------------------------
  function layoutGlow(t) {
    Object.entries(blobEls).forEach(([name, el]) => {
      const cue = S.bgCues.find((b) => b.accent === name && t >= b.start - 1 && t < b.end + 1);
      if (!cue) { el.style.opacity = 0; return; }
      el.style.opacity = fadeWindow(t, cue.start - 0.8, cue.end + 0.8, 1.2, 1.2) * 0.16;
    });
  }

  // ---------------------------------------------------------------
  // Encerramento
  // ---------------------------------------------------------------
  function layoutClosing(t) {
    const c = S.closing;
    // wipe
    const wipeOp = clamp((t - c.start) / c.wipeDur, 0, 1);
    closingWipe.style.opacity = easeInOutCubic(wipeOp);

    // logo
    if (t < c.logoInStart) {
      logoWrap.style.opacity = 0;
    } else {
      const logoT = clamp((t - c.logoInStart) / c.logoInDur, 0, 1);
      const eased = easeOutCubic(logoT);
      logoWrap.style.opacity = eased;
      const scale = lerp(0.8, 1, eased);
      const pulse = 1 + Math.sin(t * 1.1) * 0.012;
      logoWrap.style.transform = `translate(-50%,-50%) scale(${scale * pulse})`;
    }

    // linhas
    closingLineEls.forEach((el, i) => {
      const cue = c.lines[i];
      const op = fadeWindow(t, cue.start, cue.end, 0.4, 0.35);
      el.style.opacity = op;
      const inT = clamp((t - cue.start) / 0.4, 0, 1);
      el.style.transform = `translateY(${lerp(16, 0, easeOutCubic(inT))}px)`;
    });

    // fade final
    const foStart = c.fadeOutStart, foEnd = c.fadeOutStart + c.fadeOutDur;
    const foT = clamp((t - foStart) / (foEnd - foStart), 0, 1);
    finalFade.style.opacity = easeInOutCubic(foT);
  }

  // ---------------------------------------------------------------
  // Partículas (canvas)
  // ---------------------------------------------------------------
  function intensityAt(t) {
    if (t < S.openEnd) return 0.55;
    if (t >= S.emotional.start && t < S.emotional.end) return 1.4;
    if (t >= S.closing.start) return 0.7;
    return 0.85;
  }

  function drawParticles(t) {
    ctx.clearRect(0, 0, 1920, 1080);
    const intensity = intensityAt(t);
    const count = Math.round(NUM_PARTICLES * Math.min(1, intensity));
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const travel = (t * p.speed) % (1080 + 200);
      const y = p.y0 - travel + 200;
      const yy = ((y % (1080 + 200)) + (1080 + 200)) % (1080 + 200) - 100;
      const x = p.x + Math.sin(t * 0.3 + p.phase) * p.sway;
      const alpha = 0.10 + 0.28 * (0.5 + 0.5 * Math.sin(t * 0.6 + p.phase)) * Math.min(1, intensity);
      ctx.beginPath();
      ctx.arc(x, yy, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,225,255,${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------
  // Loop principal
  // ---------------------------------------------------------------
  function renderAt(t) {
    personaKeys.forEach((key) => layoutPersona(personaEls[key], key, t));
    titleEls.forEach((el, i) => layoutTitle(el, S.titles[i], t));
    bubbleEls.forEach((el, i) => layoutBubble(el, S.bubbleCues[i], t));
    layoutConstellation(t);
    layoutGlow(t);
    layoutClosing(t);
    drawParticles(t);
  }

  window.renderAt = renderAt;
  window.TOTAL_DURATION = S.totalDuration;

  // ---- modo preview interativo (quando aberto direto no browser) ----
  if (!window.__CAPTURE_MODE__) {
    let startTime = null;
    function raf(ts) {
      if (startTime === null) startTime = ts;
      let t = (ts - startTime) / 1000;
      if (t > S.totalDuration + 1) { startTime = ts; t = 0; }
      renderAt(t);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    renderAt(0);
  }
})();
