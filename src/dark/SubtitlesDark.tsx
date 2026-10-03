import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {groupWords} from '../components/Subtitles';
import type {Word} from '../types';
import {D, HEAD} from './theme';

const DEFAULT_ACCENT = /^(срок|просроч|красн|гип|график|циклограм|excel|telegram|стройконтрол|отч[её]т|этап|чат|почт|одном|бесплатн)/i;

/** Субтитры как в референсе: одна-две строки белым жирным, ключевые слова оранжевые. */
export const SubtitlesDark: React.FC<{words: Word[]; hideFrom?: number; accent?: string[]; y?: number; wordRanges?: [number, number][]}> = ({words, hideFrom = Infinity, accent, y = 1395, wordRanges = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const groups = useMemo(() => groupWords(words, 4), [words]);
  const re = useMemo(() => (accent?.length ? new RegExp(`^(${accent.join('|')})`, 'i') : DEFAULT_ACCENT), [accent]);
  if (t >= hideFrom) return null;
  // В 3D-сценах — по одному слову по центру, как во втором референсе
  if (wordRanges.some(([a, b]) => t >= a && t < b)) {
    const i = words.findIndex((w, k) => t >= w.start - 0.05 && t < (words[k + 1]?.start ?? w.end + 0.4) - 0.05);
    if (i < 0) return null;
    const w = words[i];
    const p = Math.min(1, (t - w.start + 0.05) / 0.1);
    const clean = w.text.replace(/^[«"(]+/, '');
    return (
      <div style={{position: 'absolute', top: 1330, left: 0, width: 1080, textAlign: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: re.test(clean) ? D.accent : D.white, transform: `scale(${0.8 + 0.2 * p})`, textShadow: '0 0 3px #000, 0 0 3px #000, 0 4px 0 #000, 0 6px 24px rgba(0,0,0,0.8)', WebkitTextStroke: '3px #111'}}>
        {w.text.replace(/[,.;:]$/, '')}
      </div>
    );
  }
  const g = groups.find((g, i) => t >= g.start - 0.08 && t < Math.min(g.end + 0.5, (groups[i + 1]?.start ?? Infinity) - 0.08));
  if (!g) return null;
  const pop = Math.min(1, (t - g.start + 0.08) / 0.12);
  return (
    <div style={{position: 'absolute', top: y, left: 60, width: 870, textAlign: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 52, lineHeight: 1.2, color: D.white, textShadow: '0 4px 18px rgba(0,0,0,0.7)', opacity: pop, transform: `translateY(${(1 - pop) * 10}px)`}}>
      {g.words.map((w, i) => {
        const clean = w.text.replace(/^[«"(]+/, '');
        const spoken = t >= w.start - 0.05;
        return (
          <span key={i} style={{color: re.test(clean) ? D.accent : D.white, opacity: spoken ? 1 : 0.55}}>
            {w.text}
            {i < g.words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};
