import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {D, HEAD} from './theme';

const useS = (delay = 0, cfg: {damping?: number; stiffness?: number} = {}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping: 15, stiffness: 150, ...cfg}});
};
const useOut = (dur: number) => {
  const f = useCurrentFrame();
  return interpolate(f, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

/** Заголовок-хук сверху: строки заглавными, акцентная строка оранжевая. */
export const HookTitle: React.FC<{dur: number; lines: string[]; accent?: number; top?: number}> = ({dur, lines, accent = 1, top = 300}) => {
  const out = useOut(dur);
  return (
    <div style={{position: 'absolute', top, left: 40, width: 920, textAlign: 'center', fontFamily: HEAD, opacity: out}}>
      {lines.map((l, i) => (
        <Line key={i} text={l} color={i === accent ? D.accent : D.white} delay={i * 4} />
      ))}
    </div>
  );
};
const Line: React.FC<{text: string; color: string; delay: number}> = ({text, color, delay}) => {
  const s = useS(delay, {damping: 13});
  return (
    <div style={{fontSize: 70, fontWeight: 900, lineHeight: 1.08, color, textTransform: 'uppercase', letterSpacing: -0.5, opacity: s, transform: `translateY(${(1 - s) * 30}px) scale(${0.9 + 0.1 * s})`, textShadow: '0 6px 30px rgba(0,0,0,0.45)'}}>
      {text}
    </div>
  );
};

/** Контурная подпись заглавными: «СИСТЕМА ПИШЕТ САМА». */
export const Pill: React.FC<{dur: number; text: string; y?: number; color?: 'accent' | 'blue'}> = ({dur, text, y = 1230, color = 'blue'}) => {
  const s = useS(0, {damping: 12});
  const out = useOut(dur);
  const c = color === 'accent' ? D.accent : D.blue;
  return (
    <div style={{position: 'absolute', top: y, left: 60, width: 870, display: 'flex', justifyContent: 'center', opacity: out}}>
      <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 38, color: D.white, textTransform: 'uppercase', border: `3px solid ${c}`, background: 'rgba(10,21,48,0.85)', borderRadius: 14, padding: '12px 30px', transform: `scale(${0.6 + 0.4 * s})`, opacity: s, boxShadow: `0 0 30px ${c}55`, textAlign: 'center'}}>
        {text}
      </div>
    </div>
  );
};

const fmt = (v: number, d: number) => v.toLocaleString('ru-RU', {minimumFractionDigits: d, maximumFractionDigits: d}).replace(/ /g, ' ');

/** Плашка с крупной цифрой: тёмный блок в оранжевой рамке, число набирается. */
export const NumberBadge: React.FC<{dur: number; label: string; value: number; suffix?: string; decimals?: number; x?: number; y?: number}> = ({
  dur,
  label,
  value,
  suffix = '',
  decimals = 0,
  x = 70,
  y = 1080,
}) => {
  const f = useCurrentFrame();
  const s = useS(0, {damping: 13});
  const out = useOut(dur);
  const v = value * interpolate(f, [2, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3)});
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: out * s, transform: `translateY(${(1 - s) * 40}px)`, fontFamily: HEAD, background: D.navyBox, border: `3px solid ${D.accent}`, borderRadius: 16, padding: '16px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
      <div style={{fontSize: 22, fontWeight: 700, color: D.muted, textTransform: 'lowercase'}}>{label}</div>
      <div style={{fontSize: 84, fontWeight: 900, color: D.white, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>
        {fmt(v, decimals)}
        {suffix}
      </div>
    </div>
  );
};

/** Карточки появляются по одной, текущая — в оранжевой рамке (как «причины риска» в референсе). */
export const CardStack: React.FC<{
  dur: number;
  header?: {value: string; label: string; sub?: string};
  items: {title: string; sub?: string; value: string; pct?: number; late?: boolean}[];
  interval?: number;
  start?: number;
  at?: number[]; // моменты появления карточек (с начала сцены), если не равномерно
  compact?: boolean;
}> = ({header, items, interval = 0.6, start = 0.3, at, compact}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const times = items.map((_, i) => at?.[i] ?? start + i * interval);
  const active = times.reduce((acc, x, i) => (t >= x ? i : acc), -1);
  return (
    <div style={{position: 'absolute', top: compact ? 320 : 360, left: 60, width: 870, fontFamily: FONT}}>
      {header ? (
        <Card delay={0} active={false}>
          <div style={{fontSize: 18, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700}}>{header.label}</div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6}}>
            <span style={{fontSize: 54, fontWeight: 800, color: C.ink}}>{header.value}</span>
            {header.sub ? <span style={{fontSize: 20, background: '#eef5ef', color: C.done, borderRadius: 8, padding: '4px 10px', fontWeight: 700}}>{header.sub}</span> : null}
          </div>
        </Card>
      ) : null}
      <div style={{height: 26}} />
      {items.map((it, i) => (
        <Card key={i} delay={Math.round(times[i] * fps)} active={i === active} compact={compact}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={{fontSize: compact ? 26 : 30, fontWeight: 700, color: C.ink}}>
              {it.title} <span style={{color: C.muted, fontWeight: 500, fontSize: 24}}>{it.sub}</span>
            </span>
            <span style={{fontSize: compact ? 24 : 32, fontWeight: 800, color: it.late ? C.overdue : compact ? C.muted : C.ink}}>{it.value}</span>
          </div>
          {it.pct !== undefined ? <Bar pct={it.pct} late={it.late} delay={Math.round((start + 0.1 + i * interval) * fps)} /> : null}
        </Card>
      ))}
    </div>
  );
};
const Bar: React.FC<{pct: number; late?: boolean; delay: number}> = ({pct, late, delay}) => {
  const s = useS(delay, {damping: 20, stiffness: 80});
  return (
    <div style={{height: 10, background: C.soft, borderRadius: 5, marginTop: 14, overflow: 'hidden'}}>
      <div style={{width: `${pct * s}%`, height: '100%', borderRadius: 5, background: late ? C.overdue : pct >= 80 ? C.done : C.accent}} />
    </div>
  );
};
const Card: React.FC<{delay: number; active: boolean; children: React.ReactNode; compact?: boolean}> = ({delay, active, children, compact}) => {
  const s = useS(delay, {damping: 14});
  return (
    <div
      style={{
        background: C.panel,
        borderRadius: compact ? 14 : 18,
        padding: compact ? '12px 22px' : '22px 28px',
        marginBottom: compact ? 10 : 18,
        opacity: s,
        transform: `translateY(${(1 - s) * 60}px) scale(${active ? 1.03 : 1})`,
        boxShadow: active ? `0 0 0 5px ${D.accent}, 0 24px 50px rgba(0,0,0,0.5)` : '0 14px 34px rgba(0,0,0,0.35)',
        transition: 'none',
      }}
    >
      {children}
    </div>
  );
};

/** Телефон с чатом бота Стройконтроля и экран проекта рядом: цифры «перелетают» в отчёт. */
export const PhoneChat: React.FC<{
  dur: number;
  Screen?: React.ReactNode;
  messages?: {title: string; text: string}[];
  header?: {name: string; sub: string; initials?: string};
  interval?: number;
  firstAt?: number;
}> = ({
  Screen,
  header,
  interval = 0.9,
  firstAt = 1.5,
  messages = [
    {title: 'Ежедневный отчёт', text: 'Поликлиника на Лесной: принято 3 задачи, на проверке 2, просрочен 1 этап'},
    {title: 'Напоминание о сроке', text: 'ЭОМ · ЭлектроПроект — сдать на проверку завтра'},
  ],
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const phone = useS(0, {damping: 16});
  const scr = useS(6, {damping: 16});
  const chips = Screen ? ['3 принято', '2 на проверке', '1 просрочен'] : [];
  const px = Screen ? 70 : 300;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {Screen ? (
        <div style={{position: 'absolute', left: 500, top: 520, width: 440, height: 300, borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', opacity: scr, transform: `translateX(${(1 - scr) * 120}px)`}}>
          {Screen}
        </div>
      ) : null}
      {chips.map((c, i) => {
        const st = Math.round((0.8 + i * 0.35) * fps);
        const p = interpolate(f, [st, st + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => t * t * (3 - 2 * t)});
        if (p <= 0 || p >= 1) return null;
        const x = 600 - 360 * p + i * 30;
        const y = 560 + 140 * p - Math.sin(p * Math.PI) * 120 + i * 30;
        return (
          <div key={c} style={{position: 'absolute', left: x, top: y, fontFamily: HEAD, fontWeight: 900, fontSize: 26, color: D.white, background: D.accent, borderRadius: 10, padding: '6px 14px', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', transform: `scale(${1 - 0.3 * p})`}}>
            {c}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: px, top: 330, width: 410, height: 830, borderRadius: 60, background: '#05080f', padding: 12, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', opacity: phone, transform: `translateY(${(1 - phone) * 160}px)`, fontFamily: FONT}}>
        <div style={{width: '100%', height: '100%', borderRadius: 50, background: '#111c33', overflow: 'hidden', position: 'relative'}}>
          <div style={{width: 120, height: 30, borderRadius: 20, background: '#05080f', margin: '14px auto 0'}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
            <div style={{width: 52, height: 52, borderRadius: 99, background: header ? '#3b5b9a' : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20}}>
              {header ? header.initials ?? header.name.slice(0, 2).toUpperCase() : null}
              <svg style={{display: header ? 'none' : 'block'}} width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fffaf0" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4 10-10" />
              </svg>
            </div>
            <div>
              <div style={{color: '#fff', fontWeight: 800, fontSize: 22}}>{header?.name ?? 'Стройконтроль'}</div>
              <div style={{color: D.muted, fontSize: 16}}>{header?.sub ?? 'бот уведомлений · Telegram'}</div>
            </div>
          </div>
          <div style={{padding: 18}}>
            {messages.map((m, i) => (
              <Bubble key={i} delay={Math.round((firstAt + i * interval) * fps)} title={m.title} text={m.text} />
            ))}
          </div>
          <div style={{position: 'absolute', bottom: 20, left: 18, right: 18, display: 'flex', gap: 10, alignItems: 'center'}}>
            <div style={{flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '12px 18px', color: D.muted, fontSize: 18}}>Сообщение</div>
            <div style={{width: 44, height: 44, borderRadius: 99, background: D.blue}} />
          </div>
        </div>
      </div>
    </div>
  );
};
const Bubble: React.FC<{delay: number; title: string; text: string}> = ({delay, title, text}) => {
  const s = useS(delay, {damping: 13});
  return (
    <div style={{background: '#22355e', borderRadius: 18, padding: '14px 18px', marginBottom: 14, opacity: s, transform: `translateY(${(1 - s) * 30}px) scale(${0.9 + 0.1 * s})`, transformOrigin: 'left bottom'}}>
      <div style={{color: '#fff', fontWeight: 800, fontSize: 25}}>{title}</div>
      <div style={{color: '#d7e1f5', fontSize: 22, marginTop: 6, lineHeight: 1.35, whiteSpace: 'pre-line'}}>{text}</div>
    </div>
  );
};

/** Финал: «НАПИШИТЕ В КОММЕНТАРИЯХ» + огромное кодовое слово + подпись. */
export const CtaDark: React.FC<{keyword: string; lead?: string; pill?: string; site?: string}> = ({
  keyword,
  lead = 'Напишите в комментариях',
  pill = 'Пришлю бесплатный доступ',
  site = 'stroy-control1.ru',
}) => {
  const a = useS(0);
  const k = useS(6, {damping: 9, stiffness: 160});
  const p = useS(22, {damping: 12});
  const f = useCurrentFrame();
  const letters = [...keyword.toUpperCase()];
  const size = Math.min(190, Math.floor(1150 / Math.max(letters.length, 4)));
  return (
    <div style={{position: 'absolute', left: 40, width: 920, top: 560, textAlign: 'center', fontFamily: HEAD}}>
      <div style={{fontSize: 50, fontWeight: 900, color: D.white, textTransform: 'uppercase', opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>{lead}</div>
      <div style={{fontSize: size, fontWeight: 900, color: D.accent, lineHeight: 1, marginTop: 40, transform: `scale(${0.3 + 0.7 * k}) translateY(${Math.sin(f / 10) * 5}px)`, opacity: Math.min(1, k * 1.5), textShadow: '0 10px 40px rgba(255,90,46,0.35)', letterSpacing: -4}}>
        {keyword.toUpperCase()}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 40}}>
        <div style={{fontSize: 34, fontWeight: 900, color: D.white, textTransform: 'uppercase', border: `3px solid ${D.accent}`, borderRadius: 14, padding: '12px 28px', opacity: p, transform: `scale(${0.7 + 0.3 * p})`, background: 'rgba(10,21,48,0.85)'}}>
          {pill}
        </div>
      </div>
      <div style={{fontSize: 40, fontWeight: 800, color: D.white, marginTop: 120, opacity: p}}>{site}</div>
    </div>
  );
};
