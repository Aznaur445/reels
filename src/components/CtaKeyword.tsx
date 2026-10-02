import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {useSpring} from './ui';

export const CtaKeyword: React.FC<{
  keyword: string;
  lead?: string;
  tail?: string;
  site?: string;
}> = ({keyword, lead = 'Напишите в комментариях слово', tail = 'пришлю бесплатный доступ', site = 'stroy-control1.ru'}) => {
  const frame = useCurrentFrame();
  const a = useSpring(0);
  const letters = [...keyword.toUpperCase()];
  const size = Math.min(250, Math.floor(1450 / Math.max(letters.length, 4)));
  const typed = Math.floor(interpolate(frame, [40, 40 + letters.length * 3], [0, letters.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const b = useSpring(40 + letters.length * 3 + 4);
  const c = useSpring(30);
  const s = useSpring(50);
  const bob = Math.sin(frame / 9) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        width: 870,
        top: 290,
        height: 1220,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: C.ink,
      }}
    >
      <div style={{fontSize: 58, fontWeight: 800, textAlign: 'center', lineHeight: 1.15, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, marginTop: 40}}>
        {lead}
      </div>
      <div style={{marginTop: 50, display: 'flex', transform: `translateY(${bob}px)`}}>
        {letters.map((ch, i) => (
          <Letter key={i} ch={ch} delay={6 + i * 3} size={size} />
        ))}
      </div>
      <div style={{fontSize: 52, fontWeight: 700, color: C.muted, marginTop: 30, textAlign: 'center', opacity: c, transform: `translateY(${(1 - c) * 30}px)`}}>
        — {tail}
      </div>

      <div
        style={{
          marginTop: 60,
          width: 760,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: C.panel,
          border: `2px solid ${C.line2}`,
          borderRadius: 60,
          padding: '18px 22px 18px 34px',
          boxShadow: '0 12px 30px rgba(90,70,35,0.12)',
          opacity: s,
          transform: `translateY(${(1 - s) * 40}px)`,
        }}
      >
        <span style={{flex: 1, fontSize: 40, fontWeight: 700, color: typed ? C.ink : C.faint}}>
          {typed ? letters.slice(0, typed).join('') : 'Добавьте комментарий…'}
          <span style={{opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: C.accent}}>|</span>
        </span>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 99,
            background: typed === letters.length ? C.accent : C.line2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${1 + 0.15 * b * (1 - b)})`,
          }}
        >
          <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      <div style={{flex: 1}} />
      <div
        style={{
          fontSize: 46,
          fontWeight: 800,
          color: C.accentInk,
          background: C.accent,
          padding: '20px 44px',
          borderRadius: 999,
          opacity: s,
          marginBottom: 20,
        }}
      >
        {site}
      </div>
    </div>
  );
};

const Letter: React.FC<{ch: string; delay: number; size: number}> = ({ch, delay, size}) => {
  const s = useSpring(delay, {damping: 9, stiffness: 200, mass: 0.6});
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: -4,
        color: C.accent,
        transform: `translateY(${(1 - s) * 120}px) scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * 20}deg)`,
        opacity: Math.min(1, s * 2),
        textShadow: '0 10px 30px rgba(138,106,63,0.25)',
      }}
    >
      {ch}
    </span>
  );
};
