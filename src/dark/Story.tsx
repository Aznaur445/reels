// Сцены-иллюстрации самой истории (не сервис): переписка, календарь, планёрка, часы, отпуск,
// рост бюро, «пожар», печать «СРЫВ». Все времена — секунды от начала сцены.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {D, HEAD} from './theme';

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};
const useSp = (atSec: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) => {
  const {f, fps} = useT();
  return spring({frame: f - Math.round(atSec * fps), fps, config: {damping: 13, stiffness: 160, ...cfg}});
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- Переписка крупно ----------
type Msg = {from: 'me' | 'them'; text: string; at: number; name?: string; read?: boolean};
const Bubble: React.FC<{m: Msg}> = ({m}) => {
  const s = useSp(m.at);
  const {t} = useT();
  const typing = t >= m.at - 0.6 && t < m.at && m.from === 'them';
  const me = m.from === 'me';
  if (t < m.at - 0.6) return null;
  return (
    <div style={{display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 22}}>
      <div
        style={{
          maxWidth: 680,
          background: me ? D.blue : '#22355e',
          color: '#fff',
          borderRadius: 30,
          borderBottomRightRadius: me ? 8 : 30,
          borderBottomLeftRadius: me ? 30 : 8,
          padding: typing ? '22px 30px' : '20px 30px',
          fontFamily: FONT,
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.2,
          transform: `scale(${typing ? 1 : 0.6 + 0.4 * s})`,
          transformOrigin: me ? 'right bottom' : 'left bottom',
          opacity: typing ? 1 : s,
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}
      >
        {m.name && !typing ? <div style={{fontSize: 24, color: '#b9c8ea', marginBottom: 4}}>{m.name}</div> : null}
        {typing ? <Dots /> : m.text}
        {m.read && !typing ? <span style={{fontSize: 24, color: '#b9c8ea', marginLeft: 14}}>✓✓</span> : null}
      </div>
    </div>
  );
};
const Dots: React.FC = () => {
  const {f} = useT();
  return (
    <div style={{display: 'flex', gap: 10}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: '#fff', opacity: 0.3 + 0.7 * Math.max(0, Math.sin(f / 4 - i))}} />
      ))}
    </div>
  );
};
export const Dialogue: React.FC<{dur: number; messages: Msg[]; title?: string; top?: number}> = ({messages, title, top = 420}) => (
  <div style={{position: 'absolute', left: 60, top, width: 880}}>
    {title ? <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: D.muted, textAlign: 'center', marginBottom: 30, textTransform: 'uppercase'}}>{title}</div> : null}
    {messages.map((m, i) => (
      <Bubble key={i} m={m} />
    ))}
  </div>
);

// ---------- Календарь недели со сроком ----------
export const Calendar: React.FC<{dur: number; days?: string[]; deadline?: number; stepAt?: number[]; label?: string; overdueAt?: number; top?: number}> = ({
  days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
  deadline = 4,
  stepAt = [0.2, 0.5, 0.8, 1.1, 1.4],
  label = 'срок сдачи',
  overdueAt,
  top = 420,
}) => {
  const {t, f} = useT();
  const cur = stepAt.reduce((a, x, i) => (t >= x ? i : a), -1);
  const od = overdueAt !== undefined && t >= overdueAt;
  return (
    <div style={{position: 'absolute', left: 60, top, width: 880, fontFamily: HEAD}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22}}>
        {days.map((d, i) => {
          const isDl = i === deadline;
          const active = i <= cur;
          const pulse = isDl && od ? 0.5 + 0.5 * Math.sin(f / 3) : 0;
          return (
            <div
              key={d}
              style={{
                height: 190,
                borderRadius: 26,
                background: isDl && od ? D.accent : active ? '#22355e' : 'rgba(255,255,255,0.06)',
                border: `4px solid ${isDl ? D.accent : active ? D.blue : 'rgba(255,255,255,0.12)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transform: `scale(${i === cur ? 1.08 : 1})`,
                boxShadow: isDl ? `0 0 ${30 + pulse * 40}px rgba(255,90,46,${0.4 + pulse * 0.4})` : 'none',
              }}
            >
              <div style={{fontSize: 64, fontWeight: 900}}>{d}</div>
              {isDl ? <div style={{fontSize: 24, fontWeight: 800, color: od ? '#fff' : D.accent, textTransform: 'uppercase'}}>{label}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Печать (удар) ----------
export const Stamp: React.FC<{dur: number; text: string; y?: number; rotate?: number}> = ({text, y = 760, rotate = -10}) => {
  const {f, fps} = useT();
  const s = spring({frame: f, fps, config: {damping: 9, stiffness: 260, mass: 0.6}});
  const shake = f < 8 ? Math.sin(f * 3) * (8 - f) * 1.5 : 0;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: y, display: 'flex', justifyContent: 'center', transform: `translateX(${shake}px)`}}>
      <div
        style={{
          fontFamily: HEAD,
          fontWeight: 900,
          fontSize: 150,
          color: D.accent,
          border: `12px solid ${D.accent}`,
          borderRadius: 26,
          padding: '6px 44px',
          textTransform: 'uppercase',
          transform: `rotate(${rotate}deg) scale(${3 - 2 * s})`,
          opacity: Math.min(1, s * 2),
          background: 'rgba(10,21,48,0.75)',
          letterSpacing: 4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- Часы: время утекает ----------
export const Clock: React.FC<{dur: number; label?: string; speed?: number; big?: string; top?: number; size?: number}> = ({label, speed = 1, big, top = 380, size = 560}) => {
  const {t} = useT();
  const s = useSp(0);
  const minuteDeg = t * 360 * speed;
  const hourDeg = minuteDeg / 12;
  const lab = useSp(0.4);
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: HEAD}}>
      <svg width={size} height={size} viewBox="-100 -100 200 200" style={{transform: `scale(${0.6 + 0.4 * s})`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))'}}>
        <circle r={92} fill="#f6f1e6" stroke={D.accent} strokeWidth={6} />
        {Array.from({length: 12}).map((_, i) => (
          <line key={i} x1={0} y1={-80} x2={0} y2={i % 3 === 0 ? -66 : -72} stroke="#2d2a24" strokeWidth={i % 3 === 0 ? 4 : 2} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={6} x2={0} y2={-46} stroke="#2d2a24" strokeWidth={7} strokeLinecap="round" transform={`rotate(${hourDeg})`} />
        <line x1={0} y1={8} x2={0} y2={-70} stroke={D.accent} strokeWidth={4} strokeLinecap="round" transform={`rotate(${minuteDeg})`} />
        <circle r={6} fill="#2d2a24" />
      </svg>
      {big ? <div style={{fontSize: 130, fontWeight: 900, color: '#fff', marginTop: 10, opacity: lab, transform: `scale(${0.7 + 0.3 * lab})`}}>{big}</div> : null}
      {label ? <div style={{fontSize: 44, fontWeight: 800, color: D.muted, textTransform: 'uppercase', opacity: lab}}>{label}</div> : null}
    </div>
  );
};

// ---------- Планёрка: стол и реплики по кругу ----------
const SEATS = [
  {x: 540, y: 330},
  {x: 860, y: 520},
  {x: 800, y: 830},
  {x: 280, y: 830},
  {x: 220, y: 520},
];
export const Meeting: React.FC<{dur: number; bubbles: {seat: number; text: string; at: number}[]; clock?: boolean}> = ({bubbles, clock = true}) => {
  const {t} = useT();
  const s = useSp(0);
  return (
    <div style={{position: 'absolute', left: 0, top: 280, width: 1080, height: 1000, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 290, top: 450, width: 500, height: 300, borderRadius: 150, background: '#5b4630', boxShadow: 'inset 0 -12px 0 rgba(0,0,0,0.25), 0 30px 60px rgba(0,0,0,0.5)', transform: `scale(${0.8 + 0.2 * s})`}}>
        <div style={{position: 'absolute', left: 150, top: 90, width: 200, height: 130, background: '#f6f1e6', borderRadius: 10, transform: 'rotate(-6deg)', padding: 14, boxSizing: 'border-box'}}>
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} style={{height: 6, background: '#c8bba0', borderRadius: 3, marginBottom: 14, width: `${Math.min(100, Math.max(0, (t - 0.5 - i * 0.6) * 60))}%`}} />
          ))}
        </div>
      </div>
      {SEATS.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x - 60, top: p.y + 120, width: 120, height: 120, borderRadius: 60, background: i === 0 ? D.accent : '#3b5b9a', border: '5px solid #0a1530', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 36}}>
          {i === 0 ? 'ВЫ' : `ГИП`}
        </div>
      ))}
      {bubbles.map((b, i) => {
        const p = SEATS[b.seat];
        const on = t >= b.at && (bubbles[i + 1] ? t < bubbles[i + 1].at + 0.2 : true);
        if (!on) return null;
        return <SpeechBubble key={i} x={p.x} y={p.y + 40} text={b.text} at={b.at} />;
      })}
      {clock ? <MiniClock /> : null}
    </div>
  );
};
const SpeechBubble: React.FC<{x: number; y: number; text: string; at: number}> = ({x, y, text, at}) => {
  const s = useSp(at, {damping: 11});
  return (
    <div style={{position: 'absolute', left: Math.max(70, Math.min(x - 230, 1010 - 460)), top: y - 120, width: 460, display: 'flex', justifyContent: 'center', transform: `scale(${0.5 + 0.5 * s})`, opacity: s}}>
      <div style={{background: '#fff', color: C.ink, borderRadius: 26, padding: '16px 24px', fontSize: 34, fontWeight: 700, textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.45)'}}>{text}</div>
    </div>
  );
};
const MiniClock: React.FC = () => {
  const {t} = useT();
  return (
    <svg width={150} height={150} viewBox="-100 -100 200 200" style={{position: 'absolute', right: 70, top: 0}}>
      <circle r={90} fill="#f6f1e6" stroke={D.accent} strokeWidth={8} />
      <line x1={0} y1={0} x2={0} y2={-45} stroke="#2d2a24" strokeWidth={9} strokeLinecap="round" transform={`rotate(${t * 60})`} />
      <line x1={0} y1={0} x2={0} y2={-70} stroke={D.accent} strokeWidth={6} strokeLinecap="round" transform={`rotate(${t * 720})`} />
    </svg>
  );
};

// ---------- Отпуск: море, солнце и телефон, который не замолкает ----------
export const Vacation: React.FC<{dur: number; buzzAt?: number; count?: number; text?: string; top?: number; height?: number}> = ({buzzAt = 1.0, count = 17, text = 'пропущенных', top = 330, height = 900}) => {
  const {t, f} = useT();
  const s = useSp(0);
  const ph = useSp(buzzAt, {damping: 10});
  const n = Math.max(0, Math.min(count, Math.floor((t - buzzAt) * 12)));
  const buzz = t >= buzzAt ? Math.sin(f * 2.2) * 6 : 0;
  return (
    <div style={{position: 'absolute', left: 60, top, width: 880, height, borderRadius: 40, overflow: 'hidden', transform: `scale(${0.92 + 0.08 * s})`, boxShadow: '0 40px 90px rgba(0,0,0,0.5)'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #ffb46b 0%, #ffd9a0 38%, #7fc4d8 39%, #2f7fa6 100%)'}} />
      <div style={{position: 'absolute', left: 520, top: 120 + Math.sin(t) * 6, width: 200, height: 200, borderRadius: 100, background: '#fff3c4', boxShadow: '0 0 80px #ffe08a'}} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', left: -100 + ((f * (1 + i * 0.3) + i * 200) % 1100), top: 380 + i * 90, width: 260, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.45)'}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, background: '#f2d59b'}} />
      <div style={{position: 'absolute', left: 250, bottom: 70, width: 380, height: 700, borderRadius: 50, background: '#05080f', padding: 12, transform: `translateY(${(1 - ph) * 700}px) rotate(${buzz * 0.4}deg) translateX(${buzz}px)`}}>
        <div style={{width: '100%', height: '100%', borderRadius: 40, background: '#111c33', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, color: '#fff'}}>
          <div style={{fontSize: 34, fontWeight: 800, color: D.muted}}>Работа</div>
          <div style={{fontSize: 170, fontWeight: 900, color: D.accent, lineHeight: 1}}>{n}</div>
          <div style={{fontSize: 34, fontWeight: 800}}>{text}</div>
        </div>
      </div>
    </div>
  );
};

// ---------- Рост бюро: карточки проектов множатся ----------
export const Growth: React.FC<{dur: number; from?: number; to?: number; growAt?: number; label?: string; labelFrom?: string}> = ({from = 3, to = 10, growAt = 1.0, label = 'проектов', labelFrom}) => {
  const {t} = useT();
  const n = t < growAt ? from : Math.min(to, from + Math.floor((t - growAt) * 8));
  const big = useSp(growAt, {damping: 9});
  return (
    <div style={{position: 'absolute', left: 60, top: 360, width: 880, fontFamily: HEAD}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, height: 360}}>
        {Array.from({length: to}).map((_, i) => (
          <Tile key={i} show={i < n} i={i} />
        ))}
      </div>
      <div style={{textAlign: 'center', marginTop: 40, color: '#fff'}}>
        <div style={{fontSize: 220, fontWeight: 900, lineHeight: 1, color: n > from ? D.accent : '#fff', transform: `scale(${n > from ? 0.85 + 0.15 * big : 1})`}}>{n}</div>
        <div style={{fontSize: 48, fontWeight: 800, textTransform: 'uppercase'}}>{n === from && labelFrom ? labelFrom : label}</div>
      </div>
    </div>
  );
};
const Tile: React.FC<{show: boolean; i: number}> = ({show, i}) => {
  const {f, fps} = useT();
  const s = show ? spring({frame: f - i * 2, fps, config: {damping: 12}}) : 0;
  return (
    <div style={{background: '#fffcf5', borderRadius: 16, padding: 14, opacity: show ? 1 : 0.08, transform: `scale(${show ? 0.7 + 0.3 * Math.min(1, s + 0.3) : 0.9})`, boxShadow: show ? '0 12px 30px rgba(0,0,0,0.4)' : 'none'}}>
      <div style={{height: 10, width: '70%', background: '#2d2a24', borderRadius: 5, marginBottom: 12}} />
      {[60, 85, 40].map((w, k) => (
        <div key={k} style={{height: 8, width: `${w}%`, background: k === 2 && i % 3 === 1 ? C.overdue : '#c8bba0', borderRadius: 4, marginBottom: 10}} />
      ))}
    </div>
  );
};

// ---------- «Какой горит?» сетка проектов, один в огне ----------
export const FireGrid: React.FC<{dur: number; count?: number; fire?: number; revealAt?: number; names?: string[]}> = ({
  count = 8,
  fire = 5,
  revealAt = 1.2,
  names = ['Поликлиника на Лесной', 'Стоматология на Мира', 'Детская поликлиника', 'Лаборатория', 'Медцентр', 'Клиника на Садовой', 'Офис бюро', 'Аптека'],
}) => {
  const {t, f} = useT();
  const on = t >= revealAt;
  return (
    <div style={{position: 'absolute', left: 60, top: 360, width: 880, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontFamily: FONT}}>
      {Array.from({length: count}).map((_, i) => {
        const burn = on && i === fire;
        const shakeQ = !on ? Math.sin(f / 2 + i) * 3 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              height: 150,
              borderRadius: 20,
              background: burn ? '#fff1ea' : '#fffcf5',
              border: `4px solid ${burn ? D.accent : 'transparent'}`,
              padding: '18px 22px',
              boxSizing: 'border-box',
              transform: `translateY(${shakeQ}px) scale(${burn ? 1.06 : on ? 0.96 : 1})`,
              opacity: on && !burn ? 0.35 : 1,
              boxShadow: burn ? `0 0 ${50 + Math.sin(f / 3) * 20}px rgba(255,90,46,0.7)` : '0 12px 30px rgba(0,0,0,0.4)',
              zIndex: burn ? 2 : 1,
            }}
          >
            <div style={{fontSize: 28, fontWeight: 800, color: C.ink}}>{names[i % names.length]}</div>
            <div style={{fontSize: 22, color: burn ? D.accent : C.muted, fontWeight: 700, marginTop: 8}}>{burn ? 'Просрочен этап' : '?'}</div>
            {burn ? <Flames /> : null}
          </div>
        );
      })}
    </div>
  );
};
const Flames: React.FC = () => {
  const {f} = useT();
  return (
    <svg width={120} height={140} viewBox="0 0 60 70" style={{position: 'absolute', right: 10, top: -60}}>
      {[0, 1, 2].map((i) => {
        const h = 40 + Math.sin(f / 3 + i * 2) * 8;
        return <path key={i} d={`M${18 + i * 10} 68 C ${8 + i * 10} 50, ${22 + i * 10} ${68 - h}, ${20 + i * 10} ${68 - h - 10} C ${32 + i * 10} ${68 - h}, ${36 + i * 10} 50, ${26 + i * 10} 68 Z`} fill={i === 1 ? '#ffb02e' : D.accent} opacity={0.9} />;
      })}
    </svg>
  );
};

// ---------- Обратный отсчёт ----------
export const Countdown: React.FC<{dur: number; from?: number; step?: number; label?: string}> = ({from = 3, step = 0.6, label}) => {
  const {t, f, fps} = useT();
  const k = Math.min(from - 1, Math.floor(t / step));
  const n = from - k;
  const local = f - Math.round(k * step * fps);
  const s = spring({frame: local, fps, config: {damping: 10, stiffness: 220}});
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: 420, textAlign: 'center', fontFamily: HEAD, color: '#fff'}}>
      <div style={{fontSize: 420, fontWeight: 900, lineHeight: 1, color: n === 1 ? D.accent : '#fff', transform: `scale(${1.6 - 0.6 * s})`, opacity: s}}>{n}</div>
      {label ? <div style={{fontSize: 52, fontWeight: 800, textTransform: 'uppercase', color: D.muted}}>{label}</div> : null}
    </div>
  );
};

// ---------- Крупное слово/фраза (кинетика в тёмном стиле) ----------
export const BigText: React.FC<{dur: number; lines: string[]; accent?: number; y?: number}> = ({dur, lines, accent = -1, y = 560}) => {
  const {f} = useT();
  const out = interpolate(f, [dur - 5, dur], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 40, width: 1000, top: y, textAlign: 'center', fontFamily: HEAD, opacity: out}}>
      {lines.map((l, i) => (
        <BigLine key={i} text={l} delay={i * 0.12} accent={i === accent} size={Math.min(108, Math.floor(1000 / (Math.max(...lines.map((x) => x.length)) * 0.78)))} />
      ))}
    </div>
  );
};
const BigLine: React.FC<{text: string; delay: number; accent: boolean; size: number}> = ({text, delay, accent, size}) => {
  const s = useSp(delay, {damping: 11, stiffness: 200});
  return (
    <div style={{fontSize: size, fontWeight: 900, lineHeight: 1.05, textTransform: 'uppercase', color: accent ? D.accent : '#fff', transform: `translateY(${(1 - s) * 80}px) scale(${1.3 - 0.3 * s})`, opacity: s, filter: `blur(${(1 - s) * 10}px)`}}>
      {text}
    </div>
  );
};
