import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, SHADOW} from '../theme';
import {SceneProps} from './ui';

/** Скриншот сервиса (public/screens) с плавным зумом и сдвигом к точке focus (0..1). */
export const Screenshot: React.FC<
  SceneProps & {src: string; focus?: [number, number]; zoom?: number; caption?: string}
> = ({dur, src, focus = [0.5, 0.4], zoom = 1.8}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur], [0, 1], {easing: (t) => t * (2 - t)});
  const z = 1 + (zoom - 1) * (0.55 + 0.45 * p);
  return (
    <div
      style={{
        width: 870,
        height: 860,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: SHADOW,
        border: `1.5px solid ${C.line}`,
        background: C.panel,
      }}
    >
      <Img
        src={staticFile(src.startsWith('screens/') ? src : `screens/${src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          transform: `scale(${z})`,
        }}
      />
    </div>
  );
};
