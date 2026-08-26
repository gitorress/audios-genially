// Dados do roteiro / timeline do vídeo institucional DM — Semana do Cliente
// Todos os tempos em segundos, a partir de t = 0.

const PERSONAS = {
  maria:  { file: "assets/personas/maria.png",  name: "Maria",  ratio: 831 / 1806 },
  jonas:  { file: "assets/personas/jonas.png",  name: "Jonas",  ratio: 594 / 1413 },
  ruth:   { file: "assets/personas/ruth.png",   name: "Ruth",   ratio: 768 / 1572 },
  kelly:  { file: "assets/personas/kelly.png",  name: "Kelly",  ratio: 1149 / 1653 },
  miguel: { file: "assets/personas/miguel.png", name: "Miguel", ratio: 843 / 1500 },
};

const OPEN_END = 20.5;

const OPENING = {
  start: 0,
  end: OPEN_END,
  titles: [
    { start: 1.2, end: 5.2, text: "Você sabe o que os clientes da DM pensam sobre nós?", size: "lg" },
    { start: 7.2, end: 11.7, text: "Durante a Semana do Cliente, decidimos ouvir quem\nrealmente faz parte da nossa história.", size: "md" },
    { start: 11.7, end: 13.0, text: "Ouvimos histórias.", size: "sm" },
    { start: 13.0, end: 14.2, text: "Momentos.", size: "sm" },
    { start: 14.2, end: 15.4, text: "Conquistas.", size: "sm" },
    { start: 15.4, end: 18.0, text: "E percebemos algo muito especial.", size: "sm" },
    { start: 18.0, end: 20.5, text: "Por trás de cada comentário existe muito mais do que palavras.", size: "md" },
  ],
  // personas surgem gradualmente ao fundo, ganhando nitidez
  personaReveal: { start: 6.5, end: 20.5 },
};

// ---- Blocos de depoimentos ----
// cada bloco: id, hero (persona em destaque), cor de destaque, texto de transição,
// comentários [{name, text}], narração [{text, dur}]
const BLOCKS = [
  {
    id: "confianca",
    hero: "ruth",
    accent: "coral",
    transition: "Para muitos, foi confiança.",
    comments: [
      { name: "Ana Souza", text: "Vocês me deram um voto de confiança em um dos momentos mais difíceis da minha vida." },
      { name: "Carlos Oliveira", text: "Me deram crédito onde ninguém mais dava." },
      { name: "Juliana Santos", text: "Nunca me deixaram na mão." },
    ],
    narration: [
      { text: "Às vezes, tudo começa quando alguém acredita em você.", dur: 2.6 },
    ],
    commentDur: 2.6,
    transitionDur: 1.8,
  },
  {
    id: "oportunidade",
    hero: "kelly",
    accent: "yellow",
    transition: "Para outros, foi uma oportunidade.",
    comments: [
      { name: "Fernanda Lima", text: "Há um ano tentava ser cliente e não conseguia. Quando recebi a aprovação fiquei muito feliz." },
      { name: "Marcos Pereira", text: "A DM acreditou no meu negócio e me deu oportunidade de crescer." },
      { name: "Patrícia Gomes", text: "Depois que conheci a DM tive muitas oportunidades e facilidades." },
    ],
    narration: [
      { text: "Uma porta que se abre.", dur: 1.6 },
      { text: "Uma chance de seguir em frente.", dur: 1.8 },
    ],
    commentDur: 2.6,
    transitionDur: 1.8,
  },
  {
    id: "apoio",
    hero: "jonas",
    accent: "mint",
    transition: "Uma solução no momento certo.",
    comments: [
      { name: "Roberta Alves", text: "Vocês me apoiaram quando mais precisei." },
      { name: "Eduardo Ramos", text: "No momento que mais precisei de crédito, vocês acreditaram em mim." },
      { name: "Camila Rocha", text: "Pelo atendimento e atenção com as nossas necessidades do dia a dia." },
    ],
    narration: [
      { text: "Porque existem momentos em que apoio faz toda a diferença.", dur: 2.6 },
    ],
    commentDur: 2.6,
    transitionDur: 1.8,
  },
  {
    id: "crescimento",
    hero: "miguel",
    accent: "green",
    transition: "Uma oportunidade para crescer.",
    comments: [
      { name: "Bruno Costa", text: "Depois que comecei a trabalhar com vocês, meu crédito disparou." },
      { name: "Vanessa Dias", text: "Eu iniciei com a DM Armarinhos e com limite baixo. Conforme fui pagando, meu limite foi aumentando." },
      { name: "Rodrigo Nunes", text: "Sinto orgulho de fazer parte dessa financeira e ser cliente." },
    ],
    narration: [
      { text: "Pequenas oportunidades podem transformar grandes histórias.", dur: 2.6 },
    ],
    commentDur: 2.6,
    transitionDur: 1.8,
  },
  {
    id: "facilidade",
    hero: "maria",
    accent: "lightblue",
    transition: "Facilidade para viver melhor.",
    comments: [
      { name: "Bianca Ferreira", text: "Estou adorando ser cliente. Esse cartão dá várias opções de compra e posso fazer Pix e receber Pix." },
      { name: "Diego Martins", text: "Um cartão bom que traz facilidade e opções de crédito." },
      { name: "Larissa Cardoso", text: "O aplicativo oferece muitos benefícios." },
      { name: "Thiago Barbosa", text: "Sempre que posso, indico a DM." },
      { name: "Simone Teixeira", text: "Fui bem atendida, recebi as informações de forma clara e o serviço atendeu às minhas expectativas." },
    ],
    narration: [
      { text: "Quando tudo funciona de forma simples, a experiência se torna memorável.", dur: 2.8 },
    ],
    commentDur: 2.0,
    transitionDur: 1.8,
  },
];

// Todos os comentários (para o efeito de constelação no momento emocional)
const ALL_COMMENTS = BLOCKS.flatMap((b) => b.comments);

const EMOTIONAL_LINES = [
  { text: "Por trás de cada comentário existe uma história.", dur: 2.0, pause: 0.4 },
  { text: "Por trás de cada história existe uma conquista.", dur: 2.0, pause: 0.4 },
  { text: "E por trás de cada conquista...", dur: 1.2, pause: 0.0 },
  { text: "...existem pessoas que trabalham todos os dias para fazer a diferença.", dur: 2.6, pause: 1.4 },
];

const CLOSING_LINES = [
  { text: "VOCÊ SABE O QUE OS CLIENTES DA DM PENSAM SOBRE NÓS.", size: "md" },
  { text: "AGORA VOCÊ SABE.", size: "xl" },
  { text: "CADA COMENTÁRIO QUE VOCÊ VIU AQUI É RESULTADO DO TRABALHO DE ALGUÉM.", size: "md" },
  { text: "O SEU.", size: "xl" },
  { text: "OBRIGADO POR TRANSFORMAR VIDAS ATRAVÉS DA CONFIANÇA.", size: "md" },
  { text: "OBRIGADO POR FAZER PARTE DA HISTÓRIA DA DM.", size: "md" },
  { text: "FELIZ SEMANA DO CLIENTE.", size: "xl" },
];

if (typeof module !== "undefined") {
  module.exports = { PERSONAS, OPENING, BLOCKS, ALL_COMMENTS, EMOTIONAL_LINES, CLOSING_LINES, OPEN_END };
}
