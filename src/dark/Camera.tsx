import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {D} from './theme';
import {Rect, SCREENS, ScreenProps} from './screens';

export type Shot = {
  at: number; // секунды от начала сцены
  focus: string; // блок экрана, на который наезжает камера ('all' — весь экран)
  spot?: string; // блок, который приподнимается в оранжевой рамке, остальное затемняется
  zoom?: number; // множитель приближения
  width?: number; // ширина кадра под блок, px
  cy?: number; // центр кадра по вертикали
};

type Cam = {s: number; tx: number; ty: number};

const camFor = (r: Rect, shot: Shot, cx: number, cyDefault: number): Cam => {
  const cy = shot.cy ?? cyDefault;
  const vw = shot.width ?? (shot.focus === 'all' ? 960 : 1000);
  const s = Math.min(vw / r.w, 1050 / r.h) * (shot.zoom ?? 1);
  return {s, tx: cx - (r.x + r.w / 2) * s, ty: cy - (r.y + r.h / 2) * s};
};

/** Экран сервиса с «камерой»: плавные наезды на блоки и подсветка блока как в референсе. */
export const Camera: React.FC<{dur: number; screen: string; shots: Shot[]; screenProps?: ScreenProps; cy?: number; cx?: number; dimAll?: number; clip?: [number, number] | false}> = ({
  screen,
  shots,
  screenProps = {},
  cy = 790,
  cx = 520,
  dimAll = 0,
  clip = [300, 1330],
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const def = SCREENS[screen];
  const Comp = def.Comp;
  const k = Math.max(0, shots.reduce((acc, s, i) => (s.at <= t ? i : acc), 0));
  const cur = shots[k];
  const prev = shots[Math.max(0, k - 1)];
  const c1 = camFor(def.regions[cur.focus], cur, cx, cy);
  const c0 = k === 0 ? c1 : camFor(def.regions[prev.focus], prev, cx, cy);
  const p = interpolate(t, [cur.at, cur.at + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
  const cam = {s: c0.s + (c1.s - c0.s) * p, tx: c0.tx + (c1.tx - c0.tx) * p, ty: c0.ty + (c1.ty - c0.ty) * p};
  // лёгкий постоянный дрейф, чтобы кадр не стоял
  const drift = 1 + 0.02 * Math.sin(t * 0.9);
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});

  const spots: {name: string; q: number}[] = [];
  if (cur.spot) spots.push({name: cur.spot, q: spring({frame: frame - Math.round((cur.at + 0.35) * fps), fps, config: {damping: 14, stiffness: 140}})});
  if (k > 0 && prev.spot && prev.spot !== cur.spot) spots.push({name: prev.spot, q: 1 - interpolate(t, [cur.at, cur.at + 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})});
  const dim = Math.max(dimAll, ...spots.map((s) => s.q * 0.62), 0);

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: enter, clipPath: clip ? `inset(${clip[0]}px 0 ${1920 - clip[1]}px 0)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: def.w,
          height: def.h,
          transformOrigin: '0 0',
          transform: `translate(${cam.tx + (1 - enter) * 40}px, ${cam.ty + (1 - enter) * 60}px) scale(${cam.s * drift})`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.55)'}}>
          <Comp {...screenProps} />
          <div style={{position: 'absolute', inset: 0, background: `rgba(8,15,32,${dim})`}} />
        </div>
        {spots.map(({name, q}) => {
          const r = def.regions[name];
          const pad = 8;
          const s = cam.s;
          return (
            <div
              key={name}
              style={{
                position: 'absolute',
                left: r.x - pad,
                top: r.y - pad,
                width: r.w + pad * 2,
                height: r.h + pad * 2,
                overflow: 'hidden',
                borderRadius: 16,
                opacity: Math.min(1, q * 1.4),
                transform: `scale(${1 + 0.07 * q})`,
                boxShadow: `0 0 0 ${5 / s}px ${D.accent}, 0 ${24 / s}px ${60 / s}px rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{position: 'absolute', left: -(r.x - pad), top: -(r.y - pad)}}>
                <Comp {...screenProps} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
