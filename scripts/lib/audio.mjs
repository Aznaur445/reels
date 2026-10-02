// Обработка звука через ffmpeg: шумоподавление, компрессор, обрезка тишины, громкость −14 LUFS.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], {stdio: ['ignore', 'pipe', 'pipe']}).toString();

export const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const MODEL = fileURLToPath(new URL('../models/sh.rnnn', import.meta.url));

// Студийная обработка голоса:
// RNNoise (нейросетевое шумоподавление) → срез низа → мягкий гейт против эха комнаты в паузах →
// EQ: тепло 120 Гц, минус «коробка» 300–550 Гц, разборчивость 3–5,5 кГц, воздух от 10 кГц →
// де-эссер → два компрессора → лимитер. Громкость потом выводится в −14 LUFS.
export const STUDIO =
  `arnndn=m=${MODEL}:mix=0.9,highpass=f=85:poles=2,` +
  'agate=threshold=0.012:ratio=2:range=0.25:attack=5:release=180,' +
  'equalizer=f=120:t=q:w=1:g=1.5,equalizer=f=300:t=q:w=1.2:g=-4,equalizer=f=550:t=q:w=1.5:g=-2,' +
  'equalizer=f=3200:t=q:w=1:g=4,equalizer=f=5500:t=q:w=1.5:g=2,highshelf=f=10000:g=3,' +
  'deesser=i=0.4:m=0.5:f=0.5,' +
  'acompressor=threshold=-24dB:ratio=3:attack=5:release=80:makeup=3,' +
  'acompressor=threshold=-12dB:ratio=6:attack=1:release=40:makeup=1,' +
  'alimiter=limit=0.89:level=false';

// Бережная обработка (по умолчанию): без шумодава, один мягкий компрессор, лёгкая коррекция тембра.
// Сильная компрессия и шумоподавление вытягивают эхо комнаты и дают «бункер» — их здесь нет.
export const NATURAL =
  'highpass=f=70:poles=2,equalizer=f=280:t=q:w=1.2:g=-2,equalizer=f=4000:t=q:w=1.2:g=2,' +
  'acompressor=threshold=-20dB:ratio=2:attack=15:release=200:makeup=1';

export const PRESETS = {
  natural: NATURAL, // по умолчанию
  denoise: `arnndn=m=${MODEL}:mix=0.4,` + NATURAL, // если на записи заметный шум
  raw: 'highpass=f=50', // только громкость
  studio: STUDIO, // сильная обработка: шумодав + плотная компрессия
};

// Лёгкая обработка (как раньше): спектральное шумоподавление и компрессор
const LIGHT = 'highpass=f=70,lowpass=f=14000,afftdn=nr=12:nf=-35:tn=1,acompressor=threshold=-21dB:ratio=3:attack=8:release=160:makeup=2';

// Обрезка тишины в начале, затем разворот и обрезка в конце
const TRIM =
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.12,' +
  'areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.25,areverse';

/** Где на исходнике начинается и заканчивается речь (тишина по краям, порог −45 дБ). */
export function detectSpeech(src) {
  const r = execFileSyncStderr(['-hide_banner', '-i', src, '-vn', '-ac', '1', '-af', 'highpass=f=80,afftdn=nr=12:nf=-35:tn=1,silencedetect=n=-45dB:d=0.2', '-f', 'null', '-']);
  const total = duration(src);
  const starts = [...r.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...r.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  let start = 0;
  let end = total;
  if (starts.length && starts[0] < 0.05 && ends.length) start = Math.max(0, ends[0] - 0.12);
  const lastStart = starts[starts.length - 1];
  if (lastStart !== undefined && (ends.length < starts.length || ends[ends.length - 1] >= total - 0.05)) end = Math.min(total, lastStart + 0.25);
  return {start: +start.toFixed(4), end: +end.toFixed(4)};
}

/** Обрезка по сохранённым точкам + обработка пресетом + −14 LUFS. Повторный вызов с тем же trim даёт ту же длину. */
export function processVoice(src, out, {preset = 'natural', trim}) {
  const cut = out.replace(/\.wav$/, '.cut.wav');
  ff(['-ss', String(trim.start), '-t', String(trim.end - trim.start), '-i', src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s24le', cut]);
  const r = cleanAudio(cut, out, {preset, trim: false});
  fs.rmSync(cut);
  return r;
}

/** Исходник (любой аудио/видео) → audio/clean.wav (48 кГц, моно, −14 LUFS). preset: natural | denoise | raw | studio | light. */
export function cleanAudio(src, out, {preset = 'natural', trim = true} = {}) {
  const tmp = out.replace(/\.wav$/, '.pre.wav');
  const chain = [preset === 'light' ? LIGHT : PRESETS[preset], trim ? TRIM : null].filter(Boolean).join(',');
  ff(['-i', src, '-vn', '-ac', '1', '-ar', '48000', '-af', chain, tmp]);
  // Двухпроходный loudnorm: замер, затем точная нормализация
  const r = execFileSyncStderr(['-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = JSON.parse(r.slice(r.lastIndexOf('{')));
  const ln =
    `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  ff(['-i', tmp, '-af', ln, '-ar', '48000', '-c:a', 'pcm_s16le', out]);
  fs.rmSync(tmp);
  // loudnorm в линейном режиме может недотянуть из-за пиков — доводим усилением и лимитером
  const got = measureLufs(out);
  if (Math.abs(got + 14) > 0.3) {
    const fix = out.replace(/\.wav$/, '.fix.wav');
    ff(['-i', out, '-af', `volume=${(-14 - got).toFixed(2)}dB,alimiter=limit=0.84:attack=3:release=50:level=false`, '-ar', '48000', '-c:a', 'pcm_s16le', fix]);
    fs.renameSync(fix, out);
  }
  return {inputLufs: Number(m.input_i)};
}

export function measureLufs(file) {
  const r = execFileSyncStderr(['-hide_banner', '-i', file, '-af', 'loudnorm=I=-14:print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(r.slice(r.lastIndexOf('{')));
  return Number(j.input_i);
}

function execFileSyncStderr(args) {
  return spawnSync('ffmpeg', args, {encoding: 'utf8'}).stderr;
}

/**
 * Склейка кусков с микрокроссфейдом (по умолчанию 40 мс), чтобы не было щелчков.
 * segments: [{start, end}] в секундах исходника. Возвращает смещения кусков на новой дорожке.
 */
export function spliceAudio(src, segments, out, crossfade = 0.04, workdir) {
  const parts = [];
  const lines = [];
  segments.forEach((s, i) => {
    lines.push(`[0:a]atrim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},asetpts=PTS-STARTPTS[s${i}];`);
  });
  let last = 's0';
  for (let i = 1; i < segments.length; i++) {
    const o = `x${i}`;
    lines.push(`[${last}][s${i}]acrossfade=d=${crossfade}:c1=tri:c2=tri[${o}];`);
    last = o;
  }
  lines.push(`[${last}]anull[out]`);
  const script = `${workdir}/splice.txt`;
  fs.writeFileSync(script, lines.join('\n'));
  ff(['-i', src, '-filter_complex_script', script, '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s16le', out]);
  let t = 0;
  segments.forEach((s, i) => {
    parts.push({...s, offset: t});
    t += s.end - s.start - (i < segments.length - 1 ? crossfade : 0);
  });
  return parts;
}
