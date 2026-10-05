import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {groupWords} from '../components/Subtitles';
import {Camera} from '../dark/Camera';
import {PersonLayer} from '../dark/Person';
import {useDucking} from '../dark/ReelDark';
import {HEAD} from '../dark/theme';
import type {Storyboard, Word} from '../types';

// Стиль «стекло» (референс DeC4jFZTJ9Z): тёмно-синий кинематографичный фон, главы сверху,
// синий глянцевый «блоб», стеклянные карточки, субтитры заглавными с синей плашкой.
export const G = {
  bg: '#060b1d',
  blue: '#3f6bff',
  blueText: '#8ea8ff',
  hl: '#2b4fe6',
  card: 'rgba(12,18,42,0.78)',
  border: 'rgba(150,170,255,0.22)',
  green: '#35c46a',
  orange: '#ff7a3d',
  muted: '#9aa6c8',
  white: '#ffffff',
};
const SANS = 'Manrope, Montserrat, sans-serif';

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {f, fps, t: f / fps};
};
const ease = (t: number, a: number, d = 0.35) => interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

// ── Иконки (простые линии) ───────────────────────────────────────────
const ICONS: Record<string, string> = {
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 3',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M4 21c1-4 4-6 8-6s7 2 8 6',
  doc: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7',
  chart: 'M4 20V4 M4 20h16 M7 15l4-4 3 3 5-6',
  phone: 'M7 3h10v18H7z M11 18h2',
  ruble: 'M8 21V4h6a4 4 0 0 1 0 8H6 M6 16h8',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18v.5',
  stages: 'M4 6h6v4H4z M14 6h6v4h-6z M9 16h6v4H9z M10 8h4 M7 10l4 6 M17 10l-4 6',
  team: 'M9 11a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M17 11a3 3 0 1 0 0-6 M3 20c.5-3.5 3-5 6-5s5.5 1.5 6 5 M15 15c3 0 5 1.5 6 5',
  rocket: 'M12 3c4 2 6 6 5 11l-3 3H10l-3-3C6 9 8 5 12 3z M12 9.5a1.5 1.5 0 1 0 0 .1 M8 17l-3 4 M16 17l3 4',
  check: 'M5 12l5 5L20 7',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0',
};
export const Icon: React.FC<{name: string; size?: number; color?: string; stroke?: number}> = ({name, size = 34, color = G.blueText, stroke = 2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name] ?? ICONS.doc} />
  </svg>
);

// ── Фон: размытая сцена с синей тонировкой, медленный наезд ───────────
const GlassBg: React.FC<{bgs: {src: string; from: number}[]}> = ({bgs}) => {
  const {t} = useT();
  return (
    <AbsoluteFill style={{background: G.bg}}>
      {bgs.map((b, i) => {
        const next = bgs[i + 1]?.from ?? 1e9;
        const o = Math.min(ease(t, b.from - 0.3, 0.6), 1 - ease(t, next - 0.3, 0.6));
        if (o <= 0) return null;
        const k = (t - b.from) / 12;
        return (
          <AbsoluteFill key={i} style={{opacity: o}}>
            <Img src={staticFile(b.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.12 + k * 0.08})`, filter: 'blur(7px) brightness(0.42) saturate(0.55) contrast(1.1)'}} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,40,140,0.35), rgba(6,11,29,0.25) 40%, rgba(6,11,29,0.85) 100%)', mixBlendMode: 'normal'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(2,4,14,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

// ── Главы сверху ──────────────────────────────────────────────────────
const Chapters: React.FC<{chapters: {title: string; from: number}[]; end: number}> = ({chapters, end}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top: 150, left: 60, width: 900, display: 'flex', gap: 14, fontFamily: HEAD}}>
      {chapters.map((c, i) => {
        const to = chapters[i + 1]?.from ?? end;
        const p = Math.max(0, Math.min(1, (t - c.from) / (to - c.from)));
        const active = t >= c.from && t < to;
        return (
          <div key={i} style={{flex: 1}}>
            <div style={{fontSize: 21, fontWeight: 800, letterSpacing: 1.5, color: active ? G.white : 'rgba(255,255,255,0.45)', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{c.title}</div>
            <div style={{height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', marginTop: 10, overflow: 'hidden'}}>
              <div style={{width: `${p * 100}%`, height: '100%', background: G.blue, boxShadow: `0 0 12px ${G.blue}`}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Глянцевый синий «блоб» ────────────────────────────────────────────
const Blob: React.FC = () => {
  const {t} = useT();
  const r = (a: number) => 50 + Math.sin(t * 1.3 + a) * 8;
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        top: 222,
        width: 104,
        height: 100,
        borderRadius: `${r(0)}% ${r(1)}% ${r(2)}% ${r(3)}% / ${r(4)}% ${r(5)}% ${r(6)}% ${r(7)}%`,
        background: 'radial-gradient(circle at 34% 28%, #e4ecff 0%, #8eaaff 14%, #3f6bff 42%, #1f3fd0 70%, #142a96 100%)',
        boxShadow: '0 14px 40px rgba(63,107,255,0.55), inset -10px -12px 22px rgba(5,10,60,0.55), inset 6px 8px 14px rgba(255,255,255,0.25)',
        transform: `translateY(${Math.sin(t * 1.6) * 6}px) rotate(${Math.sin(t * 0.7) * 10}deg)`,
      }}
    />
  );
};

// ── Слова с выделением: «*синий текст*», «[плашка]» ───────────────────
const Rich: React.FC<{text: string; t: number; at: number; stagger?: number; box?: string}> = ({text, t, at, stagger = 0.06, box = G.hl}) => {
  const parts = text.split(/(\*[^*]+\*|\[[^\]]+\])/).filter(Boolean);
  let k = 0;
  return (
    <>
      {parts.map((p, i) => {
        const blue = p.startsWith('*');
        const boxed = p.startsWith('[');
        const s = blue || boxed ? p.slice(1, -1) : p;
        return s.split(/(\s+)/).map((w, j) => {
          if (/^\s+$/.test(w)) return <span key={`${i}-${j}`}>{w}</span>;
          const e = ease(t, at + k++ * stagger, 0.3);
          return (
            <span
              key={`${i}-${j}`}
              style={{
                display: 'inline-block',
                opacity: e,
                filter: `blur(${(1 - e) * 10}px)`,
                transform: `translateY(${(1 - e) * 12}px)`,
                color: blue ? G.blueText : undefined,
                background: boxed ? box : undefined,
                padding: boxed ? '0 12px' : undefined,
                borderRadius: boxed ? 10 : undefined,
              }}
            >
              {w}
            </span>
          );
        });
      })}
    </>
  );
};

// ── Заголовок сцены ───────────────────────────────────────────────────
export const GHead: React.FC<{dur: number; title: string; sub?: string; size?: number}> = ({title, sub, size = 80}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top: 350, left: 60, width: 900, fontFamily: HEAD, color: G.white, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
      <div style={{fontSize: size, fontWeight: 900, lineHeight: 1.04, textTransform: 'uppercase', letterSpacing: -1}}>
        <Rich text={title} t={t} at={0.05} />
      </div>
      {sub ? (
        <div style={{fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginTop: 8, color: 'rgba(255,255,255,0.88)'}}>
          <Rich text={sub} t={t} at={0.35} />
        </div>
      ) : null}
    </div>
  );
};

const Card: React.FC<{top: number; children: React.ReactNode; style?: React.CSSProperties}> = ({top, children, style}) => {
  const {t} = useT();
  const e = ease(t, 0, 0.45);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 60,
        width: 960,
        background: G.card,
        border: `2px solid ${G.border}`,
        borderRadius: 30,
        boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        fontFamily: SANS,
        color: G.white,
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px) scale(${0.96 + 0.04 * e})`,
        filter: `blur(${(1 - e) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── Карточка с прогресс-баром ─────────────────────────────────────────
export const GProgress: React.FC<{dur: number; icon?: string; title: string; label: string; from?: number; to?: number; color?: string; top?: number; steps?: {at: number; title: string}[]; chips?: string[]; chipsAt?: number[]}> = ({
  dur,
  chips,
  chipsAt,
  icon = 'calendar',
  title,
  label,
  from = 0,
  to = 34,
  color = G.orange,
  top = 600,
  steps = [],
}) => {
  const {t} = useT();
  const cur = [...steps].reverse().find((s) => t >= s.at)?.title ?? title;
  const p = from + (to - from) * ease(t, 0.3, 2.2);
  return (
    <>
    {chips ? <GChips dur={dur} items={chips} at={chipsAt} top={top + 230} /> : null}
    <Card top={top} style={{padding: '30px 34px', display: 'flex', gap: 26, alignItems: 'center'}}>
      <div style={{width: 84, height: 84, borderRadius: 20, background: 'rgba(63,107,255,0.16)', border: `2px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
        <Icon name={icon} size={46} />
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 44, fontWeight: 800}}>{cur}</div>
        <div style={{height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.12)', marginTop: 14, overflow: 'hidden'}}>
          <div style={{width: `${p}%`, height: '100%', background: color, borderRadius: 6, boxShadow: `0 0 16px ${color}`}} />
        </div>
        <div style={{fontSize: 28, color: G.muted, marginTop: 10}}>
          {label} {Math.round(p)}%
        </div>
      </div>
    </Card>
    </>
  );
};

// ── Синие «чипы»-вопросы / сообщения ──────────────────────────────────
export const GChips: React.FC<{dur: number; items: string[]; at?: number[]; top?: number; color?: string; strike?: boolean}> = ({items, at = [], top = 640, color = G.hl, strike}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top, left: 60, width: 960, fontFamily: HEAD}}>
      {items.map((s, i) => {
        const e = ease(t, at[i] ?? 0.2 + i * 0.5, 0.3);
        return (
          <div key={i} style={{marginBottom: 18, opacity: e, transform: `translateX(${(1 - e) * -40}px) scale(${0.9 + 0.1 * e})`, transformOrigin: 'left center', filter: `blur(${(1 - e) * 6}px)`}}>
            <span style={{display: 'inline-block', background: color, color: G.white, fontWeight: 800, fontSize: 40, padding: '14px 26px', borderRadius: 18, boxShadow: '0 10px 30px rgba(43,79,230,0.45)', opacity: strike ? 0.55 : 1, textDecoration: strike && t > (at[i] ?? 0) + 0.5 ? 'line-through' : undefined}}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Чек-лист с галочками ──────────────────────────────────────────────
type Row = {icon?: string; key: string; rest?: string; color?: string; bad?: boolean};
export const GCheck: React.FC<{dur: number; title?: string; items: Row[]; at?: number[]; top?: number}> = ({title, items, at = [], top = 560}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top, left: 0, width: 1080}}>
      {title ? (
        <div style={{position: 'absolute', top: 0, left: 60, width: 960, fontFamily: HEAD, fontSize: 60, fontWeight: 900, color: G.white, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
          <Rich text={title} t={t} at={0.05} />
        </div>
      ) : null}
      <Card top={title ? 100 : 0} style={{padding: '14px 30px'}}>
        {items.map((r, i) => {
          const a = at[i] ?? 0.4 + i * 0.6;
          const on = ease(t, a, 0.3);
          const ck = ease(t, a + 0.25, 0.25);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 0', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : undefined, opacity: 0.25 + 0.75 * on, filter: `blur(${(1 - on) * 5}px)`}}>
              <div style={{width: 60, height: 60, borderRadius: 14, background: 'rgba(63,107,255,0.14)', border: `1.5px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                <Icon name={r.icon ?? 'doc'} size={32} />
              </div>
              <div style={{flex: 1, fontSize: 40, fontWeight: 600}}>
                <span style={{color: r.color ?? G.blueText, fontWeight: 800}}>{r.key}</span>
                {r.rest ? <span> {r.rest}</span> : null}
              </div>
              <div style={{width: 46, height: 46, borderRadius: 23, background: r.bad ? '#e0463a' : G.green, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ck})`, boxShadow: `0 0 18px ${r.bad ? '#e0463a' : G.green}`}}>
                <Icon name={r.bad ? 'alert' : 'check'} size={28} color="#fff" stroke={3} />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ── Крупная цифра ─────────────────────────────────────────────────────
export const GStat: React.FC<{dur: number; value: string; text: string; sub?: string; icons?: string[]; top?: number; color?: string}> = ({value, text, sub, icons = [], top = 620, color = G.orange}) => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top, left: 60, width: 960, fontFamily: HEAD, color: G.white}}>
      <div style={{fontSize: 92, fontWeight: 900, letterSpacing: -1, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
        <span style={{color, display: 'inline-block', transform: `scale(${0.6 + 0.4 * ease(t, 0, 0.3)})`, transformOrigin: 'left bottom'}}>{value}</span> <Rich text={text} t={t} at={0.15} />
      </div>
      {icons.length ? (
        <Card top={140} style={{padding: '20px 26px', display: 'flex', gap: 14, flexWrap: 'wrap'}}>
          {icons.map((ic, i) => (
            <div key={i} style={{width: 72, height: 72, borderRadius: 16, background: 'rgba(63,107,255,0.14)', border: `1.5px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ease(t, 0.3 + i * 0.08, 0.2)}}>
              <Icon name={ic} size={38} />
            </div>
          ))}
        </Card>
      ) : null}
      {sub ? <div style={{position: 'absolute', top: icons.length ? 290 : 130, fontSize: 46, fontWeight: 800}}><Rich text={sub} t={t} at={0.5} /></div> : null}
    </div>
  );
};

// ── Растущий график ───────────────────────────────────────────────────
export const GChart: React.FC<{dur: number; label?: string; top?: number; down?: boolean}> = ({label, top = 640, down}) => {
  const {t} = useT();
  const p = ease(t, 0.2, 1.8);
  const pts = down ? [[0, 60], [120, 90], [240, 85], [360, 150], [480, 170], [600, 240], [720, 300], [840, 330]] : [[0, 330], [120, 300], [240, 310], [360, 240], [480, 220], [600, 150], [720, 110], [840, 30]];
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  const col = down ? '#ff5a4a' : G.blue;
  return (
    <div style={{position: 'absolute', top, left: 110, width: 860, height: 380}}>
      <svg width={860} height={380} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id="gch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={col} stopOpacity="0.35" />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L840,380 L0,380 Z`} fill="url(#gch)" opacity={p} />
        <path d={d} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - p)} style={{filter: `drop-shadow(0 0 14px ${col})`}} />
      </svg>
      {label ? (
        <div style={{position: 'absolute', left: 0, top: 400, fontFamily: HEAD, fontSize: 34, fontWeight: 800, color: G.white, background: 'rgba(12,18,42,0.8)', border: `1.5px solid ${G.border}`, borderRadius: 16, padding: '10px 20px', opacity: ease(t, 1.2, 0.3)}}>{label}</div>
      ) : null}
    </div>
  );
};

// ── Экран сервиса в стеклянной рамке ──────────────────────────────────
export const GScreen: React.FC<{dur: number; screen: string; shots: {at: number; focus: string; spot?: string | string[]; width?: number}[]; top?: number; bottom?: number}> = ({dur, screen, shots, top = 560, bottom = 1100}) => {
  const {t} = useT();
  const e = ease(t, 0, 0.45);
  return (
    <AbsoluteFill style={{opacity: e, transform: `translateY(${(1 - e) * 40}px)`, filter: `blur(${(1 - e) * 8}px)`}}>
      <div style={{position: 'absolute', top: top - 4, left: 56, width: 968, height: bottom - top + 8, borderRadius: 30, border: `2px solid ${G.border}`, boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(63,107,255,0.25)'}} />
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(${top}px 60px ${1920 - bottom}px 60px round 28px)`}}>
        <Camera dur={dur} screen={screen} shots={shots} clip={false} cy={(top + bottom) / 2} />
      </div>
    </AbsoluteFill>
  );
};

// ── Финальная карточка продукта с кнопкой и курсором ──────────────────
export const GFinal: React.FC<{dur: number; kicker?: string; title: string; card?: string; cardSub?: string; button?: string; link?: string; keyword?: string}> = ({
  kicker = 'Сервис',
  title,
  card = 'Стройконтроль',
  cardSub = 'Сроки · задачи · субподрядчики',
  button = 'Открыть демо',
  link = 'stroy-control1.ru',
  keyword,
}) => {
  const {t} = useT();
  const cur = ease(t, 0.9, 0.7);
  const click = t > 1.7 && t < 1.95;
  const done = t >= 1.8;
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: HEAD, color: G.white}}>
      <div style={{position: 'absolute', top: 350, left: 60, width: 960}}>
        <div style={{fontSize: 40, fontWeight: 800, textTransform: 'uppercase', opacity: ease(t, 0, 0.3)}}>{kicker}</div>
        <div style={{fontSize: 92, fontWeight: 900, lineHeight: 1.02, textTransform: 'uppercase', letterSpacing: -1}}>
          <Rich text={title} t={t} at={0.1} />
        </div>
      </div>
      <Card top={640} style={{padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 70, height: 70, borderRadius: 18, background: G.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: HEAD, fontWeight: 900, fontSize: 30}}>СК</div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 38, fontWeight: 800}}>{card}</div>
          <div style={{fontSize: 26, color: G.muted, marginTop: 4}}>{cardSub}</div>
        </div>
        <div style={{fontSize: 30, fontWeight: 800, padding: '16px 24px', borderRadius: 16, background: done ? G.white : G.blue, color: done ? G.bg : G.white, transform: `scale(${click ? 0.94 : 1})`, whiteSpace: 'nowrap'}}>
          {done ? (keyword ? 'Слово: ' + keyword + ' ✓' : 'Демо открыто ✓') : button + ' →'}
        </div>
      </Card>
      <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: 1000 - 160 * cur, top: 1000 - 250 * cur, opacity: cur, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'}}>
        <path d="M4 2l15 9-7 1.5L8.5 20z" fill="#fff" stroke="#111" strokeWidth={1.2} />
      </svg>
      <div style={{position: 'absolute', top: 830, left: 60, width: 960, display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 800, opacity: ease(t, 2.0, 0.3)}}>
        <Icon name="rocket" size={38} />
        {keyword ? <span>Напишите в комментариях <span style={{background: G.hl, padding: '0 12px', borderRadius: 10}}>{keyword}</span></span> : <span>{link}</span>}
      </div>
    </div>
  );
};

// ── Субтитры: заглавные, 2–3 слова, ключевое слово в синей плашке ─────
const GlassSubs: React.FC<{words: Word[]; hideFrom: number; accent?: string[]; yRanges: [number, number, number][]; y0: number}> = ({words, hideFrom, accent, yRanges, y0}) => {
  const {t} = useT();
  const groups = useMemo(() => groupWords(words, 3), [words]);
  const re = useMemo(() => new RegExp(`^(${(accent?.length ? accent : ['срок', 'гип', 'стройконтрол', 'контрол']).join('|')})`, 'i'), [accent]);
  if (t >= hideFrom) return null;
  const g = groups.find((g, i) => t >= g.start - 0.08 && t < Math.min(g.end + 0.5, (groups[i + 1]?.start ?? Infinity) - 0.08));
  if (!g) return null;
  const y = yRanges.find(([a, b]) => t >= a && t < b)?.[2] ?? y0;
  return (
    <div style={{position: 'absolute', top: y, left: 70, width: 940, textAlign: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 56, lineHeight: 1.18, color: G.white, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.8)'}}>
      {g.words.map((w, i) => {
        const e = ease(t, w.start - 0.1, 0.18);
        const clean = w.text.replace(/^[«"(]+/, '');
        const hl = re.test(clean);
        return (
          <React.Fragment key={i}>
            <span style={{display: 'inline-block', opacity: 0.35 + 0.65 * e, filter: `blur(${(1 - e) * 6}px)`, background: hl && e > 0.5 ? G.hl : undefined, padding: hl ? '0 12px' : undefined, borderRadius: 10, boxShadow: hl && e > 0.5 ? '0 8px 26px rgba(43,79,230,0.5)' : undefined}}>{w.text}</span>
            {i < g.words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENES: Record<string, React.FC<any>> = {talk: () => null, gProgress: GProgress, gChips: GChips, gCheck: GCheck, gStat: GStat, gChart: GChart, gScreen: GScreen, gFinal: GFinal};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OVERLAYS: Record<string, React.FC<any>> = {gHead: GHead};

export const ReelGlass: React.FC<{sb: Storyboard}> = ({sb}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const fr = (s: number) => Math.round(s * fps);
  const vol = useDucking(sb.words, durationInFrames, fps, sb.music?.underVoiceDb ?? -22, sb.music?.openDb ?? -15);
  const ctaFrom = fr(sb.cta.from);
  const split = sb.scenes.filter((x) => x.type !== 'talk').map((x) => [x.from, x.to, 1180] as [number, number, number]);
  return (
    <AbsoluteFill style={{color: G.white, fontFamily: SANS}}>
      <GlassBg bgs={sb.bgs ?? [{src: 'bg/scene1.jpg', from: 0}]} />
      <PersonLayer sb={sb} layer="front" />
      {sb.scenes.map((s, i) => {
        const Comp = SCENES[s.type];
        const from = fr(s.from);
        const dur = Math.max(1, fr(s.to) - from);
        return Comp ? (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <Comp dur={dur} {...(s.props ?? {})} />
            </AbsoluteFill>
          </Sequence>
        ) : null;
      })}
      {(sb.overlays ?? []).map((o, i) => {
        const Comp = OVERLAYS[o.type];
        const from = fr(o.from);
        const dur = Math.max(1, fr(o.to) - from);
        return Comp ? (
          <Sequence key={`o${i}`} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <Comp dur={dur} {...(o.props ?? {})} />
            </AbsoluteFill>
          </Sequence>
        ) : null;
      })}
      <Sequence from={ctaFrom} durationInFrames={Math.max(1, durationInFrames - ctaFrom)} layout="none">
        <AbsoluteFill>
          <GFinal dur={durationInFrames - ctaFrom} title="*Стройконтроль*" {...((sb.cta as unknown as {final?: object}).final ?? {})} keyword={sb.cta.spoken ? sb.cta.keyword : undefined} />
        </AbsoluteFill>
      </Sequence>
      {sb.chapters ? <Chapters chapters={sb.chapters} end={sb.duration} /> : null}
      <Blob />
      <GlassSubs words={sb.words} hideFrom={sb.cta.spoken ? 1e9 : sb.cta.from} accent={sb.accentWords} yRanges={[...split, [sb.cta.from, 1e9, 1180]]} y0={1450} />
      <Audio src={staticFile(sb.voice)} />
      {sb.music ? <Audio src={staticFile(sb.music.src)} volume={(f) => vol[f] ?? 0} loop /> : null}
    </AbsoluteFill>
  );
};
