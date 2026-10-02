import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, RADIUS, SHADOW} from '../theme';

export type SceneProps = {dur: number; variant?: number};

export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
}> = ({children, style, pad = 36}) => (
  <div
    style={{
      background: C.panel,
      borderRadius: RADIUS,
      boxShadow: SHADOW,
      border: `1.5px solid ${C.line}`,
      padding: pad,
      fontFamily: FONT,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  bg?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, color = C.accent, bg = C.accentSoft, size = 26, style}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: `${size * 0.32}px ${size * 0.7}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontSize: size,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

export const Title: React.FC<{children: React.ReactNode; sub?: React.ReactNode}> = ({children, sub}) => (
  <div style={{marginBottom: 28}}>
    <div style={{fontSize: 40, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15}}>{children}</div>
    {sub ? <div style={{fontSize: 26, color: C.muted, marginTop: 8, fontWeight: 500}}>{sub}</div> : null}
  </div>
);

/** Пружина от кадра `delay` (в кадрах) внутри сцены. */
export const useSpring = (delay = 0, config: {damping?: number; mass?: number; stiffness?: number} = {}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping: 16, mass: 0.8, stiffness: 140, ...config}});
};

/** Плавное появление снизу. */
export const Rise: React.FC<{delay?: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties}> = ({
  delay = 0,
  children,
  dist = 40,
  style,
}) => {
  const s = useSpring(delay);
  return (
    <div style={{opacity: s, transform: `translateY(${(1 - s) * dist}px) scale(${0.96 + s * 0.04})`, ...style}}>
      {children}
    </div>
  );
};

export const Check: React.FC<{progress: number; size?: number; color?: string; stroke?: string}> = ({
  progress,
  size = 44,
  color = C.done,
  stroke = '#fff',
}) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <circle cx={22} cy={22} r={21 * Math.min(1, progress * 1.6)} fill={color} />
    <path
      d="M12 23 L19 30 L32 15"
      fill="none"
      stroke={stroke}
      strokeWidth={4.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={34}
      strokeDashoffset={34 * (1 - interpolate(progress, [0.35, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
    />
  </svg>
);

/** Курсор-палец, который «нажимает» в момент `at` (кадр). */
export const Tap: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [at - 14, at - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const press = interpolate(frame, [at - 3, at, at + 5], [1, 0.82, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ring = interpolate(frame, [at, at + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade = interpolate(frame, [at + 14, at + 24], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: appear * fade, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: -40,
          top: -40,
          width: 80,
          height: 80,
          borderRadius: 99,
          border: `4px solid ${C.accent}`,
          opacity: ring > 0 ? 1 - ring : 0,
          transform: `scale(${0.5 + ring})`,
        }}
      />
      <div
        style={{
          width: 52,
          height: 52,
          marginLeft: -26,
          marginTop: -26,
          borderRadius: 99,
          background: 'rgba(45,42,36,0.28)',
          border: '3px solid rgba(255,255,255,0.9)',
          transform: `scale(${press})`,
        }}
      />
    </div>
  );
};

export const frac = (frame: number, dur: number, a: number, b: number) =>
  interpolate(frame, [dur * a, dur * b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
