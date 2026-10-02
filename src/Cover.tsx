import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Background, Brand} from './Background';
import {C, FONT, SHADOW} from './theme';
import type {Storyboard} from './types';

/** Обложка 1080×1920: крупный заголовок из главной фразы + экран сервиса. */
export const Cover: React.FC<{sb: Storyboard}> = ({sb}) => {
  const title = sb.cover.title;
  const size = title.length > 60 ? 84 : title.length > 40 ? 98 : 116;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Background />
      <Brand />
      <div style={{position: 'absolute', left: 60, width: 870, top: 360}}>
        <div style={{fontSize: size, fontWeight: 800, lineHeight: 1.04, letterSpacing: -3, color: C.ink}}>
          {title.split(/(\*[^*]+\*)/).map((part, i) =>
            part.startsWith('*') ? (
              <span key={i} style={{color: C.accent}}>
                {part.slice(1, -1)}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>
        {sb.cover.subtitle ? (
          <div style={{fontSize: 46, fontWeight: 600, color: C.muted, marginTop: 34, lineHeight: 1.2}}>{sb.cover.subtitle}</div>
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          width: 870,
          top: 1010,
          height: 500,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: SHADOW,
          border: `2px solid ${C.line}`,
          transform: 'rotate(-2deg)',
        }}
      >
        <Img src={staticFile(`screens/${sb.cover.screen ?? 'graph.jpg'}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top'}} />
      </div>
    </AbsoluteFill>
  );
};
