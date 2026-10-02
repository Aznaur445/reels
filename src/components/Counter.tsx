import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {SceneProps, useSpring} from './ui';

const fmt = (n: number, decimals: number) =>
  n.toLocaleString('ru-RU', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}).replace(/ /g, ' ');

export const Counter: React.FC<SceneProps & {value: number; prefix?: string; suffix?: string; label?: string; decimals?: number}> = ({
  dur,
  value,
  prefix = '',
  suffix = '',
  label,
  decimals = 0,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [2, Math.min(28, dur * 0.6)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 4),
  });
  const s = useSpring(0, {damping: 12});
  const l = useSpring(10);
  return (
    <div style={{width: 870, textAlign: 'center'}}>
      <div
        style={{
          fontSize: 230,
          fontWeight: 800,
          color: C.accent,
          letterSpacing: -8,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          transform: `scale(${0.6 + 0.4 * s})`,
        }}
      >
        {prefix}
        {fmt(value * p, decimals)}
        <span style={{fontSize: 120, letterSpacing: -2}}>{suffix}</span>
      </div>
      {label ? (
        <div style={{fontSize: 54, fontWeight: 800, color: C.ink, marginTop: 30, opacity: l, transform: `translateY(${(1 - l) * 30}px)`}}>
          {label}
        </div>
      ) : null}
    </div>
  );
};
