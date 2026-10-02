import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, SAFE} from './theme';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line2} 2px, transparent 2px)`,
          backgroundSize: '44px 44px',
          backgroundPosition: `${(frame * 0.4) % 44}px ${(frame * 0.25) % 44}px`,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          left: -300 + Math.sin(frame / 90) * 60,
          top: 200 + Math.cos(frame / 110) * 60,
          background: `radial-gradient(circle, ${C.accentSoft} 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          right: -300 + Math.cos(frame / 100) * 50,
          bottom: 100 + Math.sin(frame / 80) * 50,
          background: `radial-gradient(circle, #efe3cc 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Brand: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: SAFE.top + 4,
      left: SAFE.left,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
      fontSize: 28,
      fontWeight: 800,
      color: C.ink,
    }}
  >
    <div style={{width: 34, height: 34, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fffaf0" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4 10-10" />
      </svg>
    </div>
    Стройконтроль
  </div>
);
