// Монтаж речи: слова-паразиты, повторы, оговорки, длинные паузы, хук, укладка в 60 секунд.
import {norm} from './terms.mjs';

const FILLERS = new Set(['э', 'ээ', 'эээ', 'э-э', 'э-э-э', 'эм', 'эмм', 'м', 'мм', 'ммм', 'хм', 'а-а', 'а-а-а', 'ааа', 'типа', 'короче']);
const SOFT_FILLERS = new Set(['ну', 'вот', 'значит', 'собственно']);
const PAIN = /просроч|сорв|срыв|теря|потер|хаос|бардак|не знае|не понима|опазд|забыва|забыл|проблем|excel|эксел|таблиц|чат|переписк|звон|нервы|штраф|деньг|непонятн|где\s|кто\s|почему|зачем|сколько|устал/i;
const BENEFIT = /сразу|видно|видит|одном месте|один экран|автоматическ|каждый|отчёт|отчет|принима|бесплатн|контрол|график|циклограм|напомина|биржа/i;

export function sentences(words) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    const next = words[i + 1];
    if (!next || /[.!?…]$/.test(w.text) || next.start - w.end > 0.9) {
      out.push(cur);
      cur = [];
    }
  });
  return out.map((idx, i) => {
    const text = idx.map((k) => words[k].text).join(' ');
    return {i, words: [idx[0], idx[idx.length - 1]], text, start: words[idx[0]].start, end: words[idx[idx.length - 1]].end, keep: true, score: score(text)};
  });
}

export function score(text) {
  let s = 0;
  if (/\?/.test(text)) s += 3;
  if (PAIN.test(text)) s += 3;
  if (BENEFIT.test(text)) s += 2;
  if (/\d/.test(text)) s += 1;
  const n = text.split(/\s+/).length;
  if (n < 4) s -= 1;
  if (n > 25) s -= 1;
  return s;
}

/** Автоматические кандидаты на вырез. apply=true — уверенные, false — на усмотрение. */
// Фразы, которые Whisper иногда «дописывает» в тишине, хотя их не говорили
const HALLUCINATIONS = /субтитры (создавал|сделал|делал|подготовил)|dimatorzok|редактор субтитров|корректор|продолжение следует|спасибо за просмотр|подписывайтесь на канал/i;

export function autoCuts(words) {
  const cuts = [];
  for (const s of sentences(words)) {
    if (HALLUCINATIONS.test(s.text)) {
      for (let i = s.words[0]; i <= s.words[1]; i++) cuts.push({word: i, text: words[i].text, at: words[i].start, reason: 'этого нет на записи — Whisper дописал сам', apply: true});
    }
  }
  const add = (i, reason, apply = true) => {
    if (cuts.some((c) => c.word === i && c.reason.startsWith('этого нет'))) return;
    if (!cuts.some((c) => c.word === i)) cuts.push({word: i, text: words[i].text, at: words[i].start, reason, apply});
  };
  words.forEach((w, i) => {
    const n = norm(w.text);
    const prev = words[i - 1];
    const next = words[i + 1];
    if (FILLERS.has(n) || /^(э+|м+|а-а+)$/.test(n)) add(i, 'слово-паразит');
    else if (n === 'ну') add(i, 'слово-паразит «ну»');
    else if (n === 'как' && next && norm(next.text) === 'бы') {
      add(i, 'слово-паразит «как бы»');
      add(i + 1, 'слово-паразит «как бы»');
    } else if (SOFT_FILLERS.has(n)) {
      const isolated = (!prev || /[.,!?…]$/.test(prev.text) || w.start - prev.end > 0.3) && (!next || /[,.!?…]$/.test(w.text) || next.start - w.end > 0.3);
      if (isolated) add(i, `слово-паразит «${n}»`, n === 'вот');
    }
    // Повтор слова подряд: «этап этап» → оставляем последнее
    if (next && n.length > 0 && n === norm(next.text) && !FILLERS.has(n)) add(i, 'повтор');
    // Повтор пары слов: «в этом в этом»
    const n2 = words[i + 2];
    const n3 = words[i + 3];
    if (next && n2 && n3 && n === norm(n2.text) && norm(next.text) === norm(n3.text)) {
      add(i, 'повтор');
      add(i + 1, 'повтор');
    }
    // Оборванное слово (оговорка): «стро-», «субпод…»
    if (/[-–…]$/.test(w.text) && n.length > 1 && !/^(э|а|м)/.test(n)) add(i, 'оговорка, оборванное слово');
    // Неуверенное короткое слово — показываю, но не режу сам
    if ((w.prob ?? 1) < 0.25 && n.length <= 3 && !cuts.some((c) => c.word === i)) add(i, 'неразборчиво, проверьте', false);
  });
  return cuts.sort((a, b) => a.word - b.word);
}

const hookScore = (t) => (/\?/.test(t) ? 4 : 0) + (PAIN.test(t) ? 4 : 0) + (BENEFIT.test(t) ? 1 : 0);

export function suggestHook(sents) {
  if (!sents.length) return null;
  const first = sents[0];
  if (/\?/.test(first.text) || PAIN.test(first.text)) return {sentence: 0, apply: false, reason: 'начало уже цепляет — оставляю как есть'};
  // Короткое пустое вступление («Вот смотрите», «Привет») перед сильной фразой — проще убрать его
  const second = sents[1];
  if (second && first.text.split(/\s+/).length <= 4 && hookScore(second.text) >= 4) {
    return {sentence: 1, dropIntro: true, apply: false, reason: `вступление «${first.text}» слабое, а следующая фраза цепляет — предлагаю начать сразу с неё`};
  }
  const pool = sents.slice(1, Math.max(2, Math.ceil(sents.length * 0.7))).filter((x) => hookScore(x.text) >= 4);
  if (!pool.length) return {sentence: 0, apply: false, reason: 'сильнее первой фразы ничего нет'};
  pool.sort((x, y) => hookScore(y.text) - hookScore(x.text) || x.i - y.i);
  return {sentence: pool[0].i, apply: false, reason: 'первые 2 секунды слабые — предлагаю начать с этой фразы (вопрос/боль)'};
}

/**
 * Куски исходника, которые остаются, с учётом вырезов, пауз и хука.
 * Паузы длиннее maxPause сжимаются до pauseTo.
 */
export function buildSegments(words, edit) {
  const cut = new Set(edit.cuts.filter((c) => c.apply).map((c) => c.word));
  const maxPause = edit.maxPause ?? 0.4;
  const pauseTo = edit.pauseTo ?? 0.2;
  const intro = edit.hook?.apply && edit.hook.dropIntro;
  const order = edit.sentences.filter((s) => s.keep && !(intro && s.i < edit.hook.sentence)).map((s) => s.i);
  if (edit.hook?.apply && !intro && order.includes(edit.hook.sentence)) {
    order.splice(order.indexOf(edit.hook.sentence), 1);
    order.unshift(edit.hook.sentence);
  }
  const segs = [];
  for (const si of order) {
    const s = edit.sentences[si];
    let seg = null;
    for (let i = s.words[0]; i <= s.words[1]; i++) {
      if (cut.has(i)) {
        if (seg) {
          seg.end = Math.min(seg.end + 0.04, words[i].start + 0.01);
          segs.push(seg);
          seg = null;
        }
        continue;
      }
      const w = words[i];
      const prev = words[i - 1];
      if (!seg) {
        const floor = prev ? prev.end : 0;
        seg = {start: Math.max(floor - 0.01, w.start - 0.05, 0), end: w.end, words: [i], sentence: si};
        if (i === s.words[0]) seg.start = Math.max(prev ? prev.end - 0.01 : 0, w.start - 0.1);
        continue;
      }
      const gap = w.start - prev.end;
      if (gap > maxPause) {
        seg.end = prev.end + pauseTo / 2;
        segs.push(seg);
        seg = {start: w.start - pauseTo / 2, end: w.end, words: [i], sentence: si};
      } else {
        seg.end = w.end;
        seg.words.push(i);
      }
    }
    if (seg) {
      const next = words[s.words[1] + 1];
      seg.end = Math.min(seg.end + 0.12, next ? next.start : seg.end + 0.25);
      segs.push(seg);
    }
  }
  // Паузы между фразами: не больше pauseTo (кроссфейд «съедает» ещё 40 мс)
  return segs.filter((s) => s.end - s.start > 0.08);
}

/** Пересчёт таймингов слов на смонтированную дорожку. */
export function remapWords(words, parts) {
  const out = [];
  for (const p of parts) {
    for (const i of p.words) {
      const w = words[i];
      const start = p.offset + Math.max(0, w.start - p.start);
      const end = p.offset + Math.min(p.end, w.end) - p.start;
      out.push({text: w.text, start: +start.toFixed(3), end: +Math.max(start + 0.05, end).toFixed(3)});
    }
  }
  // Пунктуация и заглавная буква после вырезов/перестановки хука
  for (let i = 0; i < out.length; i++) {
    if (i === 0 || /[.!?…]$/.test(out[i - 1].text)) out[i].text = out[i].text.replace(/^([«"(]*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());
  }
  return out;
}

/** Если речь + финал длиннее лимита — предлагаем убрать самые слабые фразы. */
export function fitToLimit(edit, words, limit, ctaSec) {
  const kept = edit.sentences.filter((s) => s.keep);
  const len = (s) => s.end - s.start;
  let total = kept.reduce((n, s) => n + len(s), 0) * 0.92 + ctaSec; // ~8% уходит на паузы и паразиты
  const dropped = [];
  const candidates = kept.filter((s) => s.i !== 0 && s.i !== edit.hook?.sentence && !/коммент/i.test(s.text)).sort((a, b) => a.score - b.score || len(b) - len(a));
  for (const s of candidates) {
    if (total <= limit) break;
    s.keep = false;
    s.dropReason = 'чтобы уложиться в 60 секунд (слабее остальных)';
    dropped.push(s.i);
    total -= len(s) * 0.92;
  }
  return dropped;
}
