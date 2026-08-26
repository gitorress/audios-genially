#!/usr/bin/env python3
"""
Gera uma trilha instrumental original (piano + pads + cordas), sem letras,
para o vídeo institucional DM — Semana do Cliente.

Placeholder gerado proceduralmente (sem samples/licenças de terceiros) —
pense nele como uma referência de andamento/emoção; para o evento final,
o ideal é substituir por uma trilha produzida ou uma biblioteca licenciada.
"""
import json
import math
import os
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
SCHEDULE_JSON = os.path.join(HERE, "schedule_export.json")

with open(SCHEDULE_JSON) as f:
    SCHEDULE = json.load(f)

DURATION = SCHEDULE["totalDuration"] + 0.05
N = int(DURATION * SR)

# ---------------------------------------------------------------
# Progressão de acordes — Ré maior, quatro compassos (I - V6 - vi - IV)
# ---------------------------------------------------------------
NOTE = {
    "D3": 146.83, "A3": 220.00, "C#4": 277.18, "D4": 293.66, "E4": 329.63,
    "F#4": 369.99, "G4": 392.00, "A4": 440.00, "B4": 493.88, "C#5": 554.37,
    "D5": 587.33, "E5": 659.25, "F#5": 739.99, "G5": 783.99, "A5": 880.00,
    "B3": 246.94, "G3": 196.00, "F#3": 185.00,
}

CHORDS = [
    {"bass": "D3", "tones": ["D4", "F#4", "A4"]},
    {"bass": "A3", "tones": ["C#4", "E4", "A4"]},
    {"bass": "B3", "tones": ["D4", "F#4", "B4"]},
    {"bass": "G3", "tones": ["D4", "G4", "B4"]},
]
BAR_DUR = 4.0  # segundos por acorde
CYCLE = BAR_DUR * len(CHORDS)


def chord_index(t):
    return int((t % CYCLE) // BAR_DUR)


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / max(1e-9, (edge1 - edge0)), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------
# Envelope-mestre por seção (usa os tempos reais do schedule.js)
# ---------------------------------------------------------------
open_end = SCHEDULE["openEnd"]
block_start = SCHEDULE["blockStart"]
block_end = SCHEDULE["blockEnd"]
emo_start = SCHEDULE["emotional"]["start"]
emo_end = SCHEDULE["emotional"]["end"]
close_start = SCHEDULE["closing"]["start"]
fade_start = SCHEDULE["closing"]["fadeOutStart"]
fade_end = fade_start + SCHEDULE["closing"]["fadeOutDur"]

t = np.linspace(0, DURATION, N, endpoint=False)

# Envelope geral (piano+pad) em pontos de controle
control_t = [0, 3, open_end, block_start + 12, block_end - 8, block_end, emo_start + 3,
             emo_end - 2, emo_end, fade_start, fade_end, DURATION]
control_v = [0.0, 0.14, 0.16, 0.30, 0.42, 0.48, 0.62, 0.66, 0.55, 0.42, 0.0, 0.0]
master_env = np.interp(t, control_t, control_v)

# Envelope das cordas (entra suavemente perto do momento emocional)
strings_ct = [0, block_end - 6, block_end, emo_start, emo_start + 4, emo_end + 2, close_start + 6,
              fade_start, fade_end, DURATION]
strings_cv = [0.0, 0.0, 0.05, 0.18, 0.55, 0.62, 0.5, 0.32, 0.0, 0.0]
strings_env = np.interp(t, strings_ct, strings_cv)

print("duration", DURATION, "samples", N)

# ---------------------------------------------------------------
# Pad (acordes sustentados)
# ---------------------------------------------------------------
pad = np.zeros(N)
lfo = 1.0 + 0.02 * np.sin(2 * np.pi * 0.07 * t)
for ci, chord in enumerate(CHORDS):
    mask = ((t % CYCLE) >= ci * BAR_DUR) & ((t % CYCLE) < (ci + 1) * BAR_DUR)
    local_t = t - (t // CYCLE) * CYCLE - ci * BAR_DUR
    fade = smoothstep(0, 1.2, local_t) * (1 - smoothstep(BAR_DUR - 1.0, BAR_DUR, local_t))
    voice = np.zeros(N)
    freqs = [NOTE[chord["bass"]] / 2] + [NOTE[n] for n in chord["tones"]]
    for fi, freq in enumerate(freqs):
        amp = 0.5 if fi == 0 else 0.30
        voice += amp * np.sin(2 * np.pi * freq * t * lfo)
        voice += amp * 0.18 * np.sin(2 * np.pi * freq * 2.003 * t)  # leve 2º harmônico p/ corpo
    pad += voice * mask * fade

pad = pad / np.max(np.abs(pad) + 1e-9)
pad *= master_env

# ---------------------------------------------------------------
# Cordas (mesmos acordes, timbre mais rico + vibrato leve)
# ---------------------------------------------------------------
strings = np.zeros(N)
vibrato = 1.0 + 0.004 * np.sin(2 * np.pi * 4.8 * t)
for ci, chord in enumerate(CHORDS):
    mask = ((t % CYCLE) >= ci * BAR_DUR) & ((t % CYCLE) < (ci + 1) * BAR_DUR)
    local_t = t - (t // CYCLE) * CYCLE - ci * BAR_DUR
    fade = smoothstep(0, 2.0, local_t) * (1 - smoothstep(BAR_DUR - 1.0, BAR_DUR, local_t))
    voice = np.zeros(N)
    freqs = [NOTE[n] for n in chord["tones"]] + [NOTE[chord["bass"]]]
    for freq in freqs:
        harm = (
            np.sin(2 * np.pi * freq * t * vibrato)
            + 0.35 * np.sin(2 * np.pi * freq * 2 * t * vibrato)
            + 0.15 * np.sin(2 * np.pi * freq * 3 * t * vibrato)
        )
        voice += harm / (1 + 0.35 + 0.15)
    strings += voice * mask * fade

strings = strings / np.max(np.abs(strings) + 1e-9)
strings *= strings_env

# ---------------------------------------------------------------
# Piano (arpejo suave, nota a nota)
# ---------------------------------------------------------------
piano = np.zeros(N)


def add_note(buf, onset, freq, dur, vel):
    i0 = int(onset * SR)
    n = int(dur * SR)
    if i0 >= N:
        return
    n = min(n, N - i0)
    if n <= 0:
        return
    tt = np.arange(n) / SR
    env = np.exp(-tt * 2.6) * (1 - np.exp(-tt * 400))  # ataque rápido, decaimento exponencial
    tone = (
        np.sin(2 * np.pi * freq * tt)
        + 0.5 * np.sin(2 * np.pi * freq * 2 * tt)
        + 0.28 * np.sin(2 * np.pi * freq * 3 * tt)
        + 0.12 * np.sin(2 * np.pi * freq * 4 * tt)
    )
    buf[i0:i0 + n] += vel * env * tone / 1.9


rng = np.random.default_rng(42)
note_time = 0.0
pattern_idx = 0
while note_time < DURATION - 0.2:
    # espaçamento entre notas: mais esparso na abertura/encerramento, mais fluido nos blocos
    if note_time < open_end:
        step = 1.0
        vel = 0.5
    elif note_time < block_end:
        step = 0.5
        vel = 0.6
    elif note_time < emo_end:
        step = 0.66
        vel = 0.55
    else:
        step = 0.9
        vel = 0.4

    ci = chord_index(note_time)
    chord = CHORDS[ci]
    tones = [chord["bass"]] + chord["tones"] if pattern_idx % 4 == 0 else chord["tones"]
    freq_name = tones[pattern_idx % len(tones)]
    octave_up = (pattern_idx // len(tones)) % 2 == 1 and note_time > open_end
    freq = NOTE[freq_name] * (2 if octave_up else 1)

    jitter = rng.uniform(-0.01, 0.01)
    add_note(piano, note_time + jitter, freq, dur=step * 2.1, vel=vel * rng.uniform(0.85, 1.0))

    note_time += step
    pattern_idx += 1

piano = piano / (np.max(np.abs(piano)) + 1e-9)
piano *= master_env * 0.9

# ---------------------------------------------------------------
# Mixagem final + reverb simples (soma de ecos exponenciais) + fade global
# ---------------------------------------------------------------
mix = pad * 0.85 + strings * 0.8 + piano * 0.9

# reverb simples (várias reflexões atenuadas)
reverb = np.zeros(N)
for delay_ms, gain in [(41, 0.22), (73, 0.16), (131, 0.11), (197, 0.07)]:
    d = int(SR * delay_ms / 1000)
    if d < N:
        reverb[d:] += mix[:N - d] * gain
mix = mix + reverb

# leve limitador (soft clip) para evitar estouro
mix = np.tanh(mix * 0.9)

# fade-out final coerente com o vídeo
final_fade = 1 - smoothstep(fade_start, DURATION, t)
mix *= final_fade

# estéreo com leve largura (mid/side sutil via micro-delay no canal direito)
delay_samples = int(SR * 0.006)
right = np.zeros(N)
right[delay_samples:] = mix[:N - delay_samples]
left = mix
stereo = np.stack([left, 0.5 * left + 0.5 * right], axis=1)
stereo = stereo / (np.max(np.abs(stereo)) + 1e-9) * 0.92

# ---------------------------------------------------------------
# Exportar WAV 16-bit
# ---------------------------------------------------------------
import wave

out_path = os.path.join(HERE, "music.wav")
pcm = (stereo * 32767).astype(np.int16)
with wave.open(out_path, "w") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(pcm.tobytes())

print("saved", out_path)
