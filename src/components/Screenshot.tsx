import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, SHADOW} from '../theme';
import {SceneProps} from './ui';

/** Скриншот сервиса (public/screens) в окне браузера: плавный зум к точке focus (0..1). */
export const Screenshot: React.FC<SceneProps & {src: string; focus?: [number, number]; zoom?: number}> = ({
  dur,
  src,
  focus = [0.5, 0.4],
  zoom = 1.6,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur], [0, 1], {easing: (t) => t * (2 - t)});
  const z = 1 + (zoom - 1) * p;
  return (
    <div style={{width: 870, borderRadius: 18, overflow: 'hidden', boxShadow: SHADOW, border: `1.5px solid ${C.line2}`, background: C.panel}}>
      <div style={{height: 44, background: C.soft, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px'}}>
        {[C.overdue, C.warn, C.done].map((c) => (
          <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.6}} />
        ))}
        <span style={{marginLeft: 16, fontSize: 20, color: C.muted, background: C.panel, borderRadius: 8, padding: '4px 16px'}}>stroy-control1.ru</span>
      </div>
      <div style={{height: 620, overflow: 'hidden', position: 'relative'}}>
        <Img
          src={staticFile(src.startsWith('screens/') ? src : `screens/${src}`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
            transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
            transform: `scale(${z})`,
          }}
        />
      </div>
    </div>
  );
};
