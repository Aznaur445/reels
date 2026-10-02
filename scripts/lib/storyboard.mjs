// Черновая раскадровка: смысловые куски речи → визуал и анимация.
import {norm} from './terms.mjs';

export const TOPICS = [
  {
    key: 'chaos',
    re: /чат|переписк|excel|эксел|таблиц|хаос|бардак|почт|мессенджер|ватсап|whatsapp|разбросан|в разных местах/i,
    rotation: [{type: 'chaos', props: {}, min: 2.4}],
    what: 'Вихрь из чатов, таблиц и писем собирается в один экран проекта',
  },
  {
    key: 'reports',
    re: /отч[её]т|уведомлен|напомина|telegram|телеграм|\bmax\b|\bмакс\b|почту приход|каждое утро|присыла/i,
    rotation: [{type: 'phoneNotification', props: {}, min: 2.2}],
    what: 'Телефон: приходит уведомление «Ежедневный отчёт»',
  },
  {
    key: 'market',
    re: /бирж|заказ|отклик|найти проектировщик|найти исполнител|портфолио|рейтинг|отзыв|проверенн/i,
    rotation: [
      {type: 'orderFeed', props: {}, min: 2.4},
      {type: 'executorCard', props: {}, min: 2.2},
    ],
    what: 'Биржа: лента заказов, отклики с ценой и сроком / карточка исполнителя с рейтингом',
  },
  {
    key: 'schedules',
    re: /график|процент|выполнени|циклограм|объ[её]м|выпуск разделов|отста/i,
    rotation: [
      {type: 'scheduleBars', props: {mode: 'bars'}, min: 2},
      {type: 'scheduleBars', props: {mode: 'cyclo'}, min: 2.2},
    ],
    what: 'График субподрядчика: растут полосы и проценты / циклограмма этапа',
  },
  {
    key: 'deadlines',
    re: /срок|просроч|опозд|сорва|срыв|дедлайн|этап|затяну|сдвиг/i,
    rotation: [
      {type: 'stageGraph', props: {}, min: 2.2},
      {type: 'screenshot', props: {src: 'graph.jpg', focus: [0.55, 0.55], zoom: 1.6}, min: 1.5},
    ],
    what: 'Схема этапов проекта: просроченный этап загорается красным',
  },
  {
    key: 'tasks',
    re: /задач|подрядчик|исполнител|провер|приня|принима|замечани|сда[её]т|сдал|верну|контрол/i,
    rotation: [
      {type: 'taskCard', props: {}, min: 2},
      {type: 'screenshot', props: {src: 'review.jpg', focus: [0.25, 0.35], zoom: 1.5}, min: 1.5},
    ],
    what: 'Карточка задачи: «На проверке» → «Принято» с галочкой',
  },
  {
    key: 'roles',
    re: /видит|доступ|руководител|своё|свои|роль|каждый/i,
    rotation: [{type: 'screenshot', props: {src: 'tasks.jpg', focus: [0.35, 0.3], zoom: 1.6}, min: 1.5}],
    what: 'Экран участников: у каждого свой доступ',
  },
];

const GENERIC = [
  {type: 'screenshot', props: {src: 'hero.jpg', focus: [0.5, 0.35], zoom: 1.4}},
  {type: 'screenshot', props: {src: 'stage.jpg', focus: [0.3, 0.3], zoom: 1.5}},
  {type: 'screenshot', props: {src: 'tasks.jpg', focus: [0.3, 0.3], zoom: 1.5}},
];

const KEYWORDS = /^(срок\p{L}*|просроч\p{L}*|контрол\p{L}*|график\p{L}*|задач\p{L}*|отч[её]т\p{L}*|биржа|бирж\p{L}*|excel|хаос|бесплатно|циклограмм\p{L}*|этап\p{L}*|чат\p{L}*|подрядчик\p{L}*|субподрядчик\p{L}*|гип\p{L}*|одном|сразу|видно|telegram|стройконтрол\p{L}*)$/iu;

// ---------- числа ----------
const UNITS = {ноль: 0, один: 1, одна: 1, одну: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14, пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19, двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50, шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90, сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500, шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900};
const MULT = {тысяча: 1000, тысячи: 1000, тысяч: 1000, миллион: 1e6, миллиона: 1e6, миллионов: 1e6};

/** Ищет число, которое произнесено (цифрами или словами). Возвращает {value, from, to}. */
export function findNumber(ws) {
  for (let i = 0; i < ws.length; i++) {
    const t = ws[i].text.replace(/[^\d,.%]/g, '');
    if (/\d/.test(t)) {
      let j = i;
      let v = Number(t.replace(/\s/g, '').replace(',', '.').replace('%', ''));
      // «5 000» могли разбить на два токена
      while (ws[j + 1] && /^\d{3}[.,!?]?$/.test(ws[j + 1].text)) {
        v = v * 1000 + Number(ws[j + 1].text.replace(/\D/g, ''));
        j++;
      }
      if (ws[j + 1] && MULT[norm(ws[j + 1].text)]) {
        v *= MULT[norm(ws[j + 1].text)];
        j++;
      }
      if (!Number.isNaN(v)) return {value: v, from: i, to: j};
    }
    if (UNITS[norm(ws[i].text)] !== undefined || MULT[norm(ws[i].text)]) {
      let total = 0;
      let cur = 0;
      let j = i;
      for (; j < ws.length; j++) {
        const n = norm(ws[j].text);
        if (UNITS[n] !== undefined) cur += UNITS[n];
        else if (MULT[n]) {
          total += (cur || 1) * MULT[n];
          cur = 0;
        } else break;
      }
      const v = total + cur;
      // «один», «одну» сами по себе — не цифра для счётчика
      if (v >= 2 || j - i > 1) return {value: v, from: i, to: j - 1};
    }
  }
  return null;
}

function counterProps(ws, num) {
  const after = ws.slice(num.to + 1, num.to + 5).map((w) => w.text.replace(/[.,!?…]$/, ''));
  const rest = after.join(' ');
  let suffix = '';
  let label = rest;
  if (/^(процент|%)/i.test(rest) || /%/.test(ws[num.to].text)) {
    suffix = '%';
    label = after.slice(1).join(' ');
  } else if (/^руб/i.test(rest)) {
    suffix = ' ₽';
    label = after.slice(1).join(' ');
  }
  return {value: num.value, suffix, label: label.slice(0, 40)};
}

// ---------- куски речи ----------
function chunk(words, from, to) {
  // Делим отрезок речи на куски по 1,5–3 с, режем на запятых и паузах
  const out = [];
  let cur = [];
  for (let i = from; i <= to; i++) {
    cur.push(i);
    const w = words[i];
    const len = w.end - words[cur[0]].start;
    const next = words[i + 1];
    const goodCut = /[,;:—]$/.test(w.text) || (next && next.start - w.end > 0.25);
    if (i === to || (len >= 2.2 && goodCut) || len >= 3) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  // Хвост короче 1,2 с приклеиваем к предыдущему
  for (let k = out.length - 1; k > 0; k--) {
    const c = out[k];
    if (words[c[c.length - 1]].end - words[c[0]].start < 1.2) {
      out[k - 1].push(...c);
      out.splice(k, 1);
    }
  }
  return out;
}

function sentenceRanges(words) {
  const res = [];
  let start = 0;
  words.forEach((w, i) => {
    if (/[.!?…]$/.test(w.text) || i === words.length - 1) {
      res.push([start, i]);
      start = i + 1;
    }
  });
  return res;
}

function detectCta(words) {
  for (let i = 0; i < words.length; i++) {
    if (/^слов/i.test(norm(words[i].text)) && words[i + 1]) {
      const near = words.slice(Math.max(0, i - 6), i + 1).map((w) => norm(w.text)).join(' ');
      if (/коммент|напиш/.test(near)) {
        const kw = words[i + 1].text.replace(/[«»"'.,!?…:;—–-]/g, '').toUpperCase();
        let s = i;
        while (s > 0 && !/[.!?…]$/.test(words[s - 1].text) && words[i].start - words[s - 1].start < 6) s--;
        return {keyword: kw, spoken: true, wordIndex: s};
      }
    }
  }
  return null;
}

export function draftStoryboard({id, title, words, voiceDuration, keyword, limit = 60}) {
  const spoken = detectCta(words);
  const ctaFrom = spoken ? Math.max(0, words[spoken.wordIndex].start - 0.1) : voiceDuration + 0.25;
  const ctaDur = spoken ? Math.max(5.5, voiceDuration - ctaFrom + 2.5) : 6.5;
  const duration = Math.min(limit, +(ctaFrom + ctaDur).toFixed(2));
  const speechEnd = spoken ? spoken.wordIndex - 1 : words.length - 1;

  const scenes = [];
  const kinetic = [];
  const usage = {};
  let lastTopic = null;
  let genericI = 0;
  const ranges = sentenceRanges(words.slice(0, speechEnd + 1));
  for (const [a, b] of ranges) {
    const sentText = words.slice(a, b + 1).map((w) => w.text).join(' ');
    const sentTopic = TOPICS.find((t) => t.re.test(sentText));
    let kineticDone = false;
    for (const c of chunk(words, a, b)) {
      const ws = c.map((i) => words[i]);
      const text = ws.map((w) => w.text).join(' ');
      const from = ws[0].start - (scenes.length ? 0.05 : 0);
      const num = findNumber(ws);
      let scene;
      if (num) {
        scene = {type: 'counter', props: counterProps(ws, num), note: `Счётчик: ${num.value} (вы назвали это число)`};
      } else {
        const topic = TOPICS.find((t) => t.re.test(text)) ?? sentTopic ?? (lastTopic && TOPICS.find((t) => t.key === lastTopic));
        if (topic) {
          const n = usage[topic.key] ?? 0;
          const pick = topic.rotation[n % topic.rotation.length];
          usage[topic.key] = n + 1;
          scene = {type: pick.type, props: {...pick.props}, note: topic.what, topic: topic.key};
          lastTopic = topic.key;
        } else {
          const kw = ws.find((w) => KEYWORDS.test(norm(w.text)));
          if (kw && !kineticDone) {
            scene = {type: 'kineticWord', props: {text: kw.text.replace(/[.,!?…:;«»"]/g, '')}, note: 'Кинетическая типографика: ключевое слово крупно'};
            kineticDone = true;
          } else {
            const g = GENERIC[genericI++ % GENERIC.length];
            scene = {type: g.type, props: {...g.props}, note: 'Экран сервиса с плавным зумом'};
          }
        }
      }
      scenes.push({...scene, from: +Math.max(0, from).toFixed(2), words: text});
      // Ключевое слово поверх визуала — не чаще одного на фразу
      if (!kineticDone && scene.type !== 'kineticWord' && scene.type !== 'counter' && scene.type !== 'chaos') {
        const kw = ws.find((w, k) => k > 0 && KEYWORDS.test(norm(w.text)));
        if (kw && ws[ws.length - 1].end - kw.start > 0.6) {
          kinetic.push({text: kw.text.replace(/[.,!?…:;«»"]/g, ''), at: kw.start, duration: 0.9});
          kineticDone = true;
        }
      }
    }
  }
  // Склеиваем соседние одинаковые сцены, если вместе не длиннее 3,5 с, и проставляем концы
  for (let i = 0; i < scenes.length; i++) scenes[i].to = i + 1 < scenes.length ? scenes[i + 1].from : ctaFrom;
  for (let i = scenes.length - 1; i > 0; i--) {
    const p = scenes[i - 1];
    const s = scenes[i];
    if (p.type === s.type && JSON.stringify(p.props) === JSON.stringify(s.props) && s.to - p.from <= 3.5) {
      p.to = s.to;
      p.words += ' ' + s.words;
      scenes.splice(i, 1);
    }
  }
  if (!scenes.length) scenes.push({type: 'kineticWord', from: 0, to: ctaFrom, props: {text: 'Стройконтроль'}, note: 'Название сервиса'});

  const first = ranges[0] ? words.slice(ranges[0][0], ranges[0][1] + 1).map((w) => w.text).join(' ') : title;
  const kwCover = words.slice(0, ranges[0]?.[1] + 1 || 0).find((w) => KEYWORDS.test(norm(w.text)) || /просроч|срок|сорв/i.test(w.text));
  let coverTitle = first.length > 70 ? first.slice(0, first.lastIndexOf(' ', 68)) + '…' : first;
  if (kwCover) coverTitle = coverTitle.replace(kwCover.text.replace(/[.,!?…]$/, ''), (m) => `*${m}*`);

  return {
    id,
    title,
    fps: 30,
    voice: `videos/${id}/audio/voice.wav`,
    voiceDuration: +voiceDuration.toFixed(3),
    duration,
    music: {src: 'music/podlozhka.mp3', underVoiceDb: -22, openDb: -15},
    words,
    scenes: scenes.map(({words: w, topic, ...s}) => ({...s, note: s.note, text: w})),
    kinetic,
    cta: {
      keyword: spoken?.keyword || keyword || 'ГРАФИК',
      keywordConfirmed: Boolean(spoken?.keyword || keyword),
      spoken: Boolean(spoken),
      from: +ctaFrom.toFixed(2),
      duration: +(duration - ctaFrom).toFixed(2),
      lead: 'Напишите в комментариях слово',
      tail: 'пришлю бесплатный доступ',
    },
    cover: {title: coverTitle, subtitle: 'Стройконтроль — проекты и стройка в одном месте', screen: 'graph.jpg'},
  };
}

const ANIM = {
  stageGraph: 'Этапы появляются по очереди, связи прорисовываются, просроченный этап вспыхивает красным',
  taskCard: 'Нажатие «Принять работу» → статус «Принято», рисуется галочка',
  scheduleBars: 'Полосы растут слева направо, проценты считаются вверх',
  phoneNotification: 'Телефон выезжает снизу, уведомления падают сверху одно за другим',
  orderFeed: 'Заказы выезжают справа, снизу выпадают отклики с ценой и сроком',
  executorCard: 'Рейтинг набирается звёздами, нажатие «Выбрать» → «Добавлен в этап»',
  chaos: 'Иконки кружатся вихрем и затягиваются в центр, из них раскрывается экран проекта',
  counter: 'Число крупно считается от нуля',
  kineticWord: 'Слово вылетает крупно по центру с размытием',
  screenshot: 'Плавный зум и сдвиг по экрану сервиса',
};

const fmt = (t) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};

export function storyboardTable(sb) {
  const rows = sb.scenes.map((s) => {
    const kin = sb.kinetic.filter((k) => k.at >= s.from && k.at < s.to).map((k) => ` + слово «${k.text}» крупно`).join('');
    const what = s.type === 'screenshot' ? `${s.note} (${s.props?.src})` : s.note;
    return `| ${fmt(s.from)}–${fmt(s.to)} | ${s.text ?? ''} | ${what} | ${ANIM[s.type]}${kin} |`;
  });
  rows.push(
    `| ${fmt(sb.cta.from)}–${fmt(sb.duration)} | ${sb.cta.spoken ? '(призыв голосом)' : '(призыв текстом под музыку)'} | Финал: «${sb.cta.lead}» **${sb.cta.keyword}** «— ${sb.cta.tail}», внизу stroy-control1.ru | Буквы кодового слова выпрыгивают по одной, слово печатается в поле комментария |`,
  );
  return ['| Время | Мои слова | Что в кадре | Анимация |', '|---|---|---|---|', ...rows].join('\n');
}
