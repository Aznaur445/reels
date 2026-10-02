// Исправление терминов в расшифровке: ГИП, АР, КР, ОВиК, ВК, ЭОМ, циклограмма, субподрядчик, «Стройконтроль».

const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9-]/g, '');
const split = (text) => {
  const m = text.match(/^([«"(]*)(.*?)([.,!?…:;»")—–-]*)$/s);
  return {pre: m[1], core: m[2], post: m[3]};
};

// Одиночные слова: регулярка по нормализованному виду → функция, возвращающая исправленное ядро
const SINGLE = [
  [/^гип(ы|а|у|ом|ов|ам|ами|ах|е)?$/, (m) => 'ГИП' + (m[1] || '')],
  [/^(ар)$/, () => 'АР'],
  [/^(кр)$/, () => 'КР'],
  [/^(овик|овиг|овк|о-вик)$/, () => 'ОВиК'],
  [/^(вк)$/, () => 'ВК'],
  [/^(эом|эоэм|э-о-м)$/, () => 'ЭОМ'],
  [/^цикл?ограм+(.*)$/, (m) => 'циклограмм' + m[1]],
  [/^строй-?контрол(ь|я|ю|ем|е)$/, (m) => 'Стройконтрол' + m[1]],
  [/^стройконтрол(ь|я|ю|ем|е)$/, (m) => 'Стройконтрол' + m[1]],
  [/^суб-подрядчик(.*)$/, (m) => 'субподрядчик' + m[1]],
  [/^(эксель|excel|ексель)$/, () => 'Excel'],
  [/^(телеграм|телеграмм|telegram)$/, () => 'Telegram'],
];

// Несколько слов подряд, которые Whisper мог разорвать
const MULTI = [
  [[/^строй$/, /^контрол(ь|я|ю|ем|е)$/], (ws) => 'Стройконтрол' + norm(ws[1]).slice(7)],
  [[/^суб$/, /^подрядчик/], (ws) => 'суб' + split(ws[1]).core],
  [[/^о$/, /^вик$/], () => 'ОВиК'],
  [[/^э$/, /^о$/, /^эм$/], () => 'ЭОМ'],
  [[/^цикло$/, /^грам+(.*)$/], (ws) => 'циклограмм' + norm(ws[1]).replace(/^грам+/, '')],
];

export function fixTerms(words) {
  const out = [];
  const log = [];
  for (let i = 0; i < words.length; i++) {
    let merged = false;
    for (const [pats, fn] of MULTI) {
      const ws = words.slice(i, i + pats.length);
      if (ws.length === pats.length && pats.every((p, k) => p.test(norm(ws[k].text)))) {
        const first = split(ws[0].text);
        const last = split(ws[ws.length - 1].text);
        const text = first.pre + fn(ws.map((w) => w.text)) + last.post;
        log.push(`${ws.map((w) => w.text).join(' ')} → ${text}`);
        out.push({...ws[0], text, end: ws[ws.length - 1].end, src: [i, i + pats.length - 1]});
        i += pats.length - 1;
        merged = true;
        break;
      }
    }
    if (merged) continue;
    const w = words[i];
    const {pre, core, post} = split(w.text);
    let text = w.text;
    for (const [re, fn] of SINGLE) {
      const m = norm(core).match(re);
      if (m) {
        text = pre + fn(m) + post;
        break;
      }
    }
    if (text !== w.text) log.push(`${w.text} → ${text}`);
    out.push({...w, text, src: [i, i]});
  }
  return {words: out, log};
}

export {norm, split};
