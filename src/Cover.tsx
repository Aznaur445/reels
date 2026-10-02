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

/** Обложка в стиле референса: тёмный фон, заголовок заглавными, экран сервиса. */
export const CoverDark: React.FC<{sb: Storyboard}> = ({sb}) => {
  const parts = sb.cover.title.split(/(\*[^*]+\*)/);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 42%, #16294f 0%, #0a1530 70%)', fontFamily: 'Montserrat, sans-serif'}}>
      <div style={{position: 'absolute', top: 330, left: 60, width: 900, textAlign: 'center', fontSize: 84, fontWeight: 900, lineHeight: 1.08, color: '#fff', textTransform: 'uppercase'}}>
        {parts.map((p, i) => (p.startsWith('*') ? <span key={i} style={{color: '#ff5a2e'}}>{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}
      </div>
      <div style={{position: 'absolute', left: 90, width: 840, top: 980, height: 470, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.6), 0 0 0 5px #ff5a2e'}}>
        <Img src={staticFile(`screens/${sb.cover.screen ?? 'graph.jpg'}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top'}} />
      </div>
    </AbsoluteFill>
  );
};
