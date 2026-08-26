# DM — Semana do Cliente (vídeo institucional)

Vídeo animado 1920x1080 @ 30fps, ~1min52s, construído como uma página HTML/CSS/JS
com timeline determinística (`schedule.js`), renderizada quadro a quadro via
Playwright/Chromium e codificada em H.264 com ffmpeg.

## Estrutura

- `index.html`, `styles.css`, `engine.js` — a "cena": motor de renderização
  determinístico. `window.renderAt(t)` desenha o frame exato do instante `t`
  (em segundos). Abra `index.html` num browser para pré-visualizar em tempo real.
- `timeline-data.js` — conteúdo do roteiro (textos, comentários, blocos).
- `schedule.js` — calcula os tempos absolutos de cada cena a partir de
  `timeline-data.js` (duração total, blocos, encerramento etc.).
- `assets/personas/*.png` — personas extraídas do PDF "Personas 2025" (Maria,
  Jonas, Ruth, Kelly, Miguel), com fundo transparente, em alta resolução.
- `assets/logo/dm_logo.png` — logo DM extraída do mesmo material, transparente.
- `assets/fonts/` — Poppins e Lora (Google Fonts), hospedadas localmente para
  garantir renderização determinística sem depender de rede durante a captura.
- `audio/generate_music.py` — gera a trilha instrumental (piano + pads +
  cordas) em `audio/music.wav`, sincronizada com a timeline.
- `capture/capture.cjs` — percorre a timeline frame a frame (30fps) e envia
  para o ffmpeg via pipe, gerando `dist/video_only.mp4` (sem áudio).
- `capture/finalize.sh` — junta `dist/video_only.mp4` com `audio/music.wav`
  no MP4 final: `dist/DM_Semana_do_Cliente.mp4`.

## Como reconstruir

```bash
export NODE_PATH=/opt/node22/lib/node_modules   # playwright instalado globalmente
export FFMPEG_BIN=ffmpeg                         # use um ffmpeg completo (libx264+aac)

# 1) trilha sonora
cd audio && node export_schedule.cjs && python3 generate_music.py && cd ..

# 2) captura do vídeo (quadro a quadro)
node capture/capture.cjs

# 3) mixagem final
FFMPEG_BIN=ffmpeg bash capture/finalize.sh
```

O resultado final fica em `dist/DM_Semana_do_Cliente.mp4`.

## Ajustar o roteiro

Editar `timeline-data.js` (textos, nomes fictícios, comentários, narração) e
`schedule.js` (durações/ritmo). `engine.js` não precisa ser tocado para
mudanças de conteúdo — apenas se quiser alterar o estilo visual (cores,
tipografia, movimento, partículas), que fica em `styles.css` e `engine.js`.

## Limitações conhecidas / decisões

- **Sem narração em voz**: este ambiente não tem um mecanismo de
  texto-para-fala disponível. Em vez de gerar uma voz sintética de baixa
  qualidade, todas as falas de narração aparecem como tipografia animada em
  tela (estilo "caption cinematográfico"), que também reforça a leitura em
  ambientes barulhentos de evento corporativo. Se desejarem locução real,
  basta gravar um narrador seguindo o texto de `timeline-data.js` e mixar por
  cima do áudio atual.
- **Trilha sonora gerada proceduralmente**: `audio/generate_music.py` compõe
  uma trilha original (piano + pads + cordas, sem samples de terceiros) para
  já entregar o vídeo com áudio coerente com o tom pedido. Para o evento
  final, o ideal é trocar por uma trilha produzida por um compositor ou uma
  biblioteca de música licenciada — a estrutura de tempos (`schedule.js`)
  facilita alinhar qualquer nova trilha aos mesmos marcos emocionais.
- **Personas**: extraídas em alta resolução do PDF fornecido (fundo removido
  via máscara de transparência do próprio PDF), sem uso de bancos de imagem.
