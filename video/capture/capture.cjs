// Captura o vídeo quadro a quadro (determinístico) via Playwright + Chromium,
// e envia os frames via pipe para o ffmpeg, que codifica direto em H.264 —
// sem gravar milhares de PNGs em disco.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";
const FPS = 30;
const OUT = path.join(ROOT, "dist", "video_only.mp4");

async function main() {
  const schedule = require(path.join(ROOT, "schedule.js"));
  const DURATION = schedule.totalDuration;
  let TOTAL_FRAMES = Math.round(DURATION * FPS);
  if (process.env.DEBUG_MAX_FRAMES) TOTAL_FRAMES = Math.min(TOTAL_FRAMES, parseInt(process.env.DEBUG_MAX_FRAMES, 10));
  console.log(`Duração: ${DURATION.toFixed(2)}s — ${TOTAL_FRAMES} frames @ ${FPS}fps`);

  const fs = require("fs");
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });

  const ff = spawn(FFMPEG, [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "-framerate", String(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "16",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    OUT,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  let ffClosed = false;
  const ffExit = new Promise((resolve) => ff.on("close", (code) => { ffClosed = true; resolve(code); }));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (err) => console.error("PAGEERROR:", err.message));
  await page.addInitScript(() => { window.__CAPTURE_MODE__ = true; });
  await page.goto("file://" + path.join(ROOT, "index.html"));
  await page.waitForFunction(() => typeof window.renderAt === "function");

  const t0 = Date.now();
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / FPS;
    await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (ffClosed) throw new Error("ffmpeg encerrou antes do esperado");
    const canWrite = ff.stdin.write(buf);
    if (!canWrite) {
      await new Promise((resolve) => ff.stdin.once("drain", resolve));
    }
    if (i % 90 === 0 || i === TOTAL_FRAMES - 1) {
      const elapsed = (Date.now() - t0) / 1000;
      const pct = (((i + 1) / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`frame ${i + 1}/${TOTAL_FRAMES} (${pct}%) — t=${t.toFixed(2)}s — ${elapsed.toFixed(0)}s decorridos`);
    }
  }

  ff.stdin.end();
  await browser.close();
  const code = await ffExit;
  if (code !== 0) throw new Error("ffmpeg saiu com código " + code);
  console.log("Vídeo (sem áudio) salvo em", OUT);
}

main().catch((err) => { console.error(err); process.exit(1); });
