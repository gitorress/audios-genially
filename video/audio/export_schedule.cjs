// Exporta o schedule.js (timeline calculada) para JSON, para uso no gerador de música em Python.
const fs = require("fs");
const path = require("path");
const S = require(path.join(__dirname, "..", "schedule.js"));
fs.writeFileSync(path.join(__dirname, "schedule_export.json"), JSON.stringify(S, null, 2));
console.log("exported schedule_export.json — total duration:", S.totalDuration);
