import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {SceneProps, useSpring} from './ui';

/** Ключевое слово вылетает крупно по центру. Длина — dur кадров. */
export const KineticWord: React.FC<SceneProps & {text: string; color?: string; overlay?: boolean}> = ({
  dur,
  text,
  color = C.ink,
  overlay,
}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0, {damping: 11, stiffness: 170, mass: 0.7});
  const out = interpolate(frame, [dur - 7, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const letters = [...text.toUpperCase()];
  const size = Math.min(170, Math.floor(1500 / Math.max(letters.length, 4)));
  return (
    <div
      style={{
        width: 870,
        textAlign: 'center',
        fontFamily: FONT,
        transform: `scale(${(2.2 - 1.2 * s) * (1 + out * 0.25)}) rotate(${(1 - s) * -6}deg) translateY(${out * -60}px)`,
        filter: `blur(${(1 - s) * 12 + out * 8}px)`,
        opacity: Math.min(1, s * 1.5) * (1 - out),
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontSize: size,
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1.05,
          color,
          padding: overlay ? '16px 36px' : 0,
          background: overlay ? 'rgba(255,252,245,0.94)' : 'transparent',
          borderRadius: 24,
          boxShadow: overlay ? '0 20px 50px rgba(90,70,35,0.25)' : 'none',
        }}
      >
        {letters.map((ch, i) => {
          const d = interpolate(frame, [i * 0.8, i * 0.8 + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <span key={i} style={{display: 'inline-block', opacity: d, transform: `translateY(${(1 - d) * 30}px)`}}>
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </span>
      <div
        style={{
          height: 10,
          width: `${Math.min(100, s * 60)}%`,
          margin: '18px auto 0',
          background: C.accent,
          borderRadius: 5,
          opacity: overlay ? 0 : 1,
        }}
      />
    </div>
  );
};
