"""Тихая подложка для рилсов: тёплые аккорды, мягкий бас, перебор и лёгкий ритм.
Генерируется кодом, поэтому без ограничений по лицензии (CC0).
Запуск: python3 scripts/make_music.py public/music/podlozhka.mp3 [секунды] [seed]
"""
import subprocess, sys, wave
import numpy as np

SR = 48000
BPM = 84
BEAT = 60 / BPM
BAR = BEAT * 4

out = sys.argv[1] if len(sys.argv) > 1 else 'public/music/podlozhka.mp3'
seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 64.0
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 7)

def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)

# Fmaj7 — Am7 — Dm9 — Cmaj7/E (MIDI-ноты)
CHORDS = [
    [53, 57, 60, 64, 69],
    [57, 60, 64, 67, 72],
    [50, 57, 60, 65, 64],
    [52, 55, 59, 64, 67],
]
BASS = [41, 45, 38, 40]

n = int(SR * seconds)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)

def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y

def add(buf_l, buf_r, start, sig, pan=0.0):
    s = int(start * SR)
    if s >= n:
        return
    e = min(n, s + len(sig))
    seg = sig[: e - s]
    buf_l[s:e] += seg * np.sqrt(0.5 * (1 - pan))
    buf_r[s:e] += seg * np.sqrt(0.5 * (1 + pan))

bars = int(np.ceil(seconds / BAR)) + 1
for b in range(bars):
    chord = CHORDS[b % 4]
    start = b * BAR
    # Пэд: несколько гармоник с расстройкой, медленная атака/спад
    length = BAR * 1.15
    tt = np.arange(int(length * SR)) / SR
    env = np.minimum(1, tt / 0.9) * np.minimum(1, np.maximum(0, (length - tt) / 0.9))
    pad = np.zeros_like(tt)
    for note in chord:
        f = hz(note)
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            pad += (np.sin(2 * np.pi * ff * tt) + 0.25 * np.sin(4 * np.pi * ff * tt) + 0.08 * np.sin(6 * np.pi * ff * tt))
    pad *= env * 0.018
    add(L, R, start, pad, pan=-0.25)
    add(L, R, start + 0.013, pad, pan=0.25)
    # Бас
    bt = np.arange(int(BAR * SR)) / SR
    benv = np.minimum(1, bt / 0.05) * np.exp(-bt / 1.6)
    bass = np.sin(2 * np.pi * hz(BASS[b % 4]) * bt) * benv * 0.10
    add(L, R, start, bass)
    # Перебор восьмыми: мягкий «щипок»
    pattern = [0, 2, 3, 4, 2, 3, 1, 3]
    for k, idx in enumerate(pattern):
        if rng.random() < 0.18:
            continue
        f = hz(chord[idx % len(chord)] + 12)
        pt = np.arange(int(BEAT * 1.6 * SR)) / SR
        penv = np.minimum(1, pt / 0.006) * np.exp(-pt / 0.32)
        pl = (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(4 * np.pi * f * pt)) * penv * 0.035
        add(L, R, start + k * BEAT / 2 + rng.normal(0, 0.006), pl, pan=0.35 if k % 2 else -0.35)
    # Ритм: мягкая бочка на 1 и 3, шорох на слабые доли
    for k in range(4):
        bs = start + k * BEAT
        if k in (0, 2):
            kt = np.arange(int(0.35 * SR)) / SR
            freq = 50 + 70 * np.exp(-kt / 0.04)
            kick = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-kt / 0.12) * 0.16
            add(L, R, bs, kick)
        ht = np.arange(int(0.08 * SR)) / SR
        hat = rng.normal(0, 1, len(ht))
        hat = hat - lowpass(hat, 5000)
        hat *= np.exp(-ht / 0.02) * (0.012 if k % 2 else 0.006)
        add(L, R, bs + BEAT / 2, hat, pan=0.2)

mix = np.stack([L, R], axis=1)
# Лёгкий «тёплый» фильтр и плавные края для бесшовного повтора
mix[:, 0] = lowpass(mix[:, 0], 7000)
mix[:, 1] = lowpass(mix[:, 1], 7000)
fade = int(SR * 1.5)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.8

tmp = out + '.tmp.wav'
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
# Нормализуем к −14 LUFS: дальше Remotion опускает её на 20–24 дБ под голосом
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-b:a', '192k', out], check=True)
import os
os.remove(tmp)
print('Готово:', out)
