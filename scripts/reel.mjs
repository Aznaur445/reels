#!/usr/bin/env node
// Один ролик = одна папка videos/<дата>-<название>/.
//
//   npm run reel -- <путь к аудио/видео> [--name короткое-название] [--keyword ГРАФИК]
//       обработка звука → расшифровка → исправление терминов → черновой монтаж → черновая раскадровка
//   npm run reel -- videos/<id> [--preset natural|denoise|raw|studio]
//       пресет звука: natural (по умолчанию), denoise (+ шумодав), raw (только громкость), studio (плотно)
//   npm run reel -- videos/<id>
//       продолжить: после расшифровки из GitHub Actions или после правки edit.json
//       (монтаж и раскадровка пересобираются; storyboard.json с "locked": true не трогается)
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {detectSpeech, duration, measureLufs, processVoice, spliceAudio} from './lib/audio.mjs';
import {autoCuts, buildSegments, fitToLimit, remapWords, sentences, suggestHook} from './lib/edit.mjs';
import {draftStoryboard, storyboardTable} from './lib/storyboard.mjs';
import {fixTerms} from './lib/terms.mjs';

const LIMIT = 60;
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const input = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!input) {
  console.log('Использование: npm run reel -- <аудио> [--name название] [--keyword СЛОВО]  |  npm run reel -- videos/<id>');
  process.exit(1);
}

const TRANSLIT = {а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'};
const slug = (s) =>
  [...s.toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'reel';

let dir;
let id;
const isDir = fs.existsSync(input) && fs.statSync(input).isDirectory();
if (isDir) {
  dir = path.resolve(input);
  id = path.basename(dir);
} else {
  if (!fs.existsSync(input)) throw new Error(`Нет файла ${input}`);
  const date = opt('--date') ?? new Date().toISOString().slice(0, 10);
  id = `${date}-${slug(opt('--name') ?? path.parse(input).name)}`;
  dir = path.resolve('videos', id);
  fs.mkdirSync(path.join(dir, 'source'), {recursive: true});
  const dst = path.join(dir, 'source', path.basename(input));
  if (path.resolve(input) !== dst) fs.copyFileSync(input, dst);
}
const P = (...p) => path.join(dir, ...p);
fs.mkdirSync(P('audio'), {recursive: true});
fs.mkdirSync(P('tmp'), {recursive: true});
const meta = fs.existsSync(P('meta.json')) ? JSON.parse(fs.readFileSync(P('meta.json'), 'utf8')) : {};
if (opt('--keyword')) meta.keyword = opt('--keyword').toUpperCase();
if (opt('--name')) meta.title = opt('--name');
meta.title ??= id;
fs.writeFileSync(P('meta.json'), JSON.stringify(meta, null, 2));

console.log(`\n▶ Ролик ${id}  (${path.relative(process.cwd(), dir)})`);

// 1. Звук
const source = fs.readdirSync(P('source')).filter((f) => !f.startsWith('.')).map((f) => P('source', f))[0];
if (!source) throw new Error('В папке source/ нет исходника');
const preset = opt('--preset') ?? meta.preset ?? 'natural';
const reprocess = args.includes('--reprocess') || (opt('--preset') && opt('--preset') !== meta.preset);
if (!fs.existsSync(P('audio', 'clean.wav')) || args.includes('--reclean') || reprocess) {
  if (!meta.trim || args.includes('--reclean')) {
    if (fs.existsSync(P('transcript.raw.json')) && !args.includes('--reclean')) throw new Error('Нет meta.trim: укажите точки обрезки в meta.json, иначе тайминги расшифровки собьются');
    meta.trim = detectSpeech(source);
  }
  meta.preset = preset;
  fs.writeFileSync(P('meta.json'), JSON.stringify(meta, null, 2));
  console.log(`1. Обработка звука (${preset}): обрезка тишины ${meta.trim.start}–${meta.trim.end} с, −14 LUFS…`);
  const r = processVoice(source, P('audio', 'clean.wav'), {preset, trim: meta.trim});
  console.log(`   исходник ${r.inputLufs.toFixed(1)} LUFS → audio/clean.wav ${measureLufs(P('audio', 'clean.wav')).toFixed(1)} LUFS, ${duration(P('audio', 'clean.wav')).toFixed(2)} с`);
} else console.log('1. Звук уже обработан: audio/clean.wav');

// 2. Расшифровка
if (!fs.existsSync(P('transcript.raw.json')) || args.includes('--retranscribe')) {
  console.log('2. Расшифровка Whisper (ru, тайминг каждого слова)…');
  const r = spawnSync('python3', ['scripts/transcribe.py', P('audio', 'clean.wav'), P('transcript.raw.json')], {stdio: 'inherit'});
  if (r.status !== 0) {
    console.log(`
   Локальный Whisper и API сейчас недоступны.
   Вариант 1 (без ключей): закоммитьте и запушьте папку — GitHub Actions «Расшифровка» сделает
   transcript.raw.json моделью large-v3 и закоммитит его обратно. Потом: npm run reel -- videos/${id}
       git add videos/${id} && git commit -m "Ролик ${id}: звук" && git push
   Вариант 2: положите OPENAI_API_KEY в .env и запустите ещё раз.`);
    process.exit(0);
  }
} else console.log('2. Расшифровка уже есть: transcript.raw.json');

// 3. Термины
const raw = JSON.parse(fs.readFileSync(P('transcript.raw.json'), 'utf8'));
const {words, log: termLog} = fixTerms(raw.words);
// Ручные исправления расшифровки: meta.json → "replace": {"последнем": "последним"}
for (const w of words) {
  for (const [from, to] of Object.entries(meta.replace ?? {})) {
    const re = new RegExp(`^([«"(]*)${from}([.,!?…:;»")]*)$`, 'i');
    if (re.test(w.text)) {
      termLog.push(`${w.text} → ${to}`);
      w.text = w.text.replace(re, `$1${to}$2`);
    }
  }
}
// Исправления по фразам: meta.json → "replacePhrases": {"все бюро": "всё бюро"} (по словам, пунктуация сохраняется)
for (const [from, to] of Object.entries(meta.replacePhrases ?? {})) {
  const a = from.split(' ');
  const b = to.split(' ');
  for (let i = 0; i + a.length <= words.length; i++) {
    if (a.every((x, k) => words[i + k].text.replace(/[.,!?…:;—–\s]+$/, '').toLowerCase() === x.toLowerCase())) {
      a.forEach((_, k) => (words[i + k].text = words[i + k].text.replace(/^[^.,!?…:;—–\s]+/, b[k] ?? '')));
      termLog.push(`${from} → ${to}`);
    }
  }
}
// «_» в замене — убрать слово только из субтитров (звук не трогаем)
for (let i = words.length - 1; i >= 0; i--) if (/^_[.,!?…:;]*$/.test(words[i].text)) words.splice(i, 1);
// Тире и другие знаки, распознанные отдельным «словом», приклеиваем к предыдущему слову
for (let i = words.length - 1; i > 0; i--) {
  if (/^[–—-]+$/.test(words[i].text)) {
    words[i - 1] = {...words[i - 1], text: `${words[i - 1].text} —`, end: words[i].end};
    words.splice(i, 1);
  }
}
fs.writeFileSync(P('transcript.json'), JSON.stringify({engine: raw.engine, words}, null, 1));
console.log(`3. Термины исправлены: ${termLog.length ? termLog.join('; ') : 'нечего исправлять'}`);

// 4. Монтаж
let edit;
const savedEdit = fs.existsSync(P('edit.json')) ? JSON.parse(fs.readFileSync(P('edit.json'), 'utf8')) : null;
if (savedEdit && savedEdit.wordCount !== undefined && savedEdit.wordCount !== words.length) console.log('   расшифровка изменилась — монтаж пересобран заново');
if (savedEdit && !args.includes('--reedit') && (savedEdit.wordCount ?? words.length) === words.length) {
  edit = savedEdit;
  console.log('4. Монтаж по edit.json (ваши правки сохранены)');
} else {
  const sents = sentences(words);
  edit = {
    note: 'apply: true — вырезать; keep: false — убрать фразу; hook.apply: true — поставить фразу в начало',
    maxPause: 0.4,
    pauseTo: 0.2,
    crossfade: 0.04,
    wordCount: words.length,
    cuts: autoCuts(words),
    sentences: sents,
    hook: suggestHook(sents),
  };
  edit.dropped = fitToLimit(edit, words, LIMIT, 6.5);
  fs.writeFileSync(P('edit.json'), JSON.stringify(edit, null, 1));
  console.log('4. Черновой монтаж: edit.json');
}
const segs = buildSegments(words, edit);
const parts = spliceAudio(P('audio', 'clean.wav'), segs, P('audio', 'voice.wav'), edit.crossfade ?? 0.04, P('tmp'));
const voiceDuration = duration(P('audio', 'voice.wav'));
const edited = remapWords(words, parts);
console.log(`   речь: ${duration(P('audio', 'clean.wav')).toFixed(1)} с → после монтажа ${voiceDuration.toFixed(1)} с, склеек: ${segs.length - 1}`);

// 5. Раскадровка
let sb;
const sbPath = P('storyboard.json');
const old = fs.existsSync(sbPath) ? JSON.parse(fs.readFileSync(sbPath, 'utf8')) : null;
if (old?.locked) {
  sb = {...old, words: edited, voiceDuration: +voiceDuration.toFixed(3)};
  console.log('5. storyboard.json заблокирован ("locked": true) — обновлены только слова и длина речи');
} else {
  sb = draftStoryboard({id, title: meta.title, words: edited, voiceDuration, keyword: meta.keyword, limit: LIMIT});
  console.log('5. Черновая раскадровка: storyboard.json');
}
fs.writeFileSync(sbPath, JSON.stringify(sb, null, 1));

// 6. Отчёт для согласования
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const hook = edit.hook;
const cutLines = edit.cuts.map((c) => `- ${c.apply ? '✂️' : '❔'} ${fmt(c.at)} «${c.text}» — ${c.reason}${c.apply ? '' : ' (не вырезано, решите сами)'}`);
const dropLines = edit.sentences.filter((s) => !s.keep || (hook?.apply && hook.dropIntro && s.i < hook.sentence)).map((s) => `- ✂️ фраза ${fmt(s.start)}: «${s.text}» — ${s.dropReason ?? (s.keep ? 'слабое вступление, начинаем с хука' : 'убрано вручную')}`);
const pauses = segs.length - 1;
const hookLine =
  hook && hook.sentence !== 0
    ? `**Хук:** ${hook.reason}: «${edit.sentences[hook.sentence].text}» — ${hook.apply ? (hook.dropIntro ? 'вступление убрано' : 'переставлено в начало') : 'пока НЕ применено, скажите «ставь хук»'}`
    : `**Хук:** ${hook?.reason ?? '—'}`;
const report = `# ${meta.title}

Расшифровка: ${raw.engine}. Речь после монтажа: ${voiceDuration.toFixed(1)} с, ролик целиком: ${sb.duration.toFixed(1)} с.

## Итоговый текст
${sb.words.map((w) => w.text).join(' ')}

## Что вырезано
${[...cutLines, ...dropLines].join('\n') || '- ничего'}
- паузы длиннее ${edit.maxPause} с сжаты до ${edit.pauseTo} с, всего склеек: ${pauses} (кроссфейд ${Math.round((edit.crossfade ?? 0.04) * 1000)} мс)
${termLog.length ? `\n**Исправлены термины:** ${termLog.join('; ')}\n` : ''}
${hookLine}

**Кодовое слово:** ${sb.cta.keyword}${sb.cta.spoken ? ' (вы произнесли его на записи)' : sb.cta.keywordConfirmed ? '' : ' — ⚠️ на записи не прозвучало, подтвердите слово'}${sb.cta.spoken ? '' : '. Призыв голосом не прозвучал — ставлю текстом на экране под музыку.'}

## Раскадровка
${storyboardTable(sb)}
`;
fs.writeFileSync(P('storyboard.md'), report);
fs.rmSync(P('tmp'), {recursive: true, force: true});
console.log(`\n${report}\n→ Отчёт: ${path.relative(process.cwd(), P('storyboard.md'))}`);
console.log(`→ Рендер: npm run render -- ${id}   (или npx remotion render ${id} out/${id}.mp4)`);
void execFileSync;
