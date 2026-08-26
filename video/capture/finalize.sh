#!/usr/bin/env bash
# Junta o vídeo (silencioso) renderizado com a trilha sonora gerada,
# produzindo o MP4 final em dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG_BIN="${FFMPEG_BIN:-ffmpeg}"
IN_VIDEO="dist/video_only.mp4"
IN_AUDIO="audio/music.wav"
OUT="dist/DM_Semana_do_Cliente.mp4"

"$FFMPEG_BIN" -y \
  -i "$IN_VIDEO" \
  -i "$IN_AUDIO" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy \
  -c:a aac -b:a 192k \
  -shortest \
  -movflags +faststart \
  "$OUT"

echo "Final: $OUT"
ls -la "$OUT"
