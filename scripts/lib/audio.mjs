// Обработка звука через ffmpeg: шумоподавление, компрессор, обрезка тишины, громкость −14 LUFS.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], {stdio: ['ignore', 'pipe', 'pipe']}).toString();

export const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const CLEAN =
  'highpass=f=70,lowpass=f=14000,' +
  'afftdn=nr=12:nf=-35:tn=1,' + // шумоподавление по спектру, шумовой профиль отслеживается
  'acompressor=threshold=-21dB:ratio=3:attack=8:release=160:makeup=2,' + // лёгкий компрессор
  // обрезка тишины в начале, затем разворот и обрезка в конце
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.12,' +
  'areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.25,areverse';

/** Исходник (любой аудио/видео) → audio/clean.wav (48 кГц, моно, −14 LUFS). */
export function cleanAudio(src, out) {
  const tmp = out.replace(/\.wav$/, '.pre.wav');
  ff(['-i', src, '-vn', '-ac', '1', '-ar', '48000', '-af', CLEAN, tmp]);
  // Двухпроходный loudnorm: замер, затем точная нормализация
  const r = execFileSyncStderr(['-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const m = JSON.parse(r.slice(r.lastIndexOf('{')));
  const ln =
    `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  ff(['-i', tmp, '-af', ln, '-ar', '48000', '-c:a', 'pcm_s16le', out]);
  fs.rmSync(tmp);
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
