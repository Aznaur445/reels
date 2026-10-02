import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, SUBS} from '../theme';
import type {Word} from '../types';

type Group = {words: Word[]; start: number; end: number};

/** Делит речь на группы по 2–4 слова: рвём на знаках препинания и паузах. */
export const groupWords = (words: Word[], max = 4): Group[] => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) groups.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
  };
  words.forEach((w, i) => {
    const next = words[i + 1];
    cur.push(w);
    const punct = /[.!?…]$/.test(w.text);
    const soft = /[,:;—–]$/.test(w.text);
    const pause = next ? next.start - w.end > 0.35 : true;
    const chars = cur.reduce((n, x) => n + x.text.length + 1, 0);
    if (!next || punct || pause || cur.length >= max || chars > 22 || (soft && cur.length >= 2)) flush();
  });
  // Одиночное короткое слово приклеиваем к следующей группе, если она рядом.
  for (let i = 0; i < groups.length - 1; i++) {
    const g = groups[i];
    const n = groups[i + 1];
    if (g.words.length === 1 && n.words.length < max && n.start - g.end < 0.3 && !/[.!?…]$/.test(g.words[0].text)) {
      n.words.unshift(...g.words);
      n.start = g.start;
      groups.splice(i, 1);
      i--;
    }
  }
  return groups;
};

export const Subtitles: React.FC<{words: Word[]; hideFrom?: number}> = ({words, hideFrom = Infinity}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const groups = useMemo(() => groupWords(words), [words]);
  if (t >= hideFrom) return null;
  const gi = groups.findIndex((g, i) => {
    const nextStart = groups[i + 1]?.start ?? Infinity;
    return t >= g.start - 0.08 && t < Math.min(g.end + 0.6, nextStart - 0.08);
  });
  if (gi < 0) return null;
  const g = groups[gi];
  const local = t - (g.start - 0.08);
  const pop = Math.min(1, local / 0.16);
  return (
    <div
      style={{
        position: 'absolute',
        top: SUBS.top,
        left: 60,
        width: 870,
        height: SUBS.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: 76,
          lineHeight: 1.12,
          fontWeight: 800,
          letterSpacing: -1,
          transform: `translateY(${(1 - pop) * 18}px) scale(${0.94 + 0.06 * pop})`,
          opacity: pop,
        }}
      >
        {g.words.map((w, i) => {
          const active = t >= w.start - 0.03 && (t < (g.words[i + 1]?.start ?? g.end + 0.6) - 0.03);
          const spoken = t >= w.start - 0.03;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 10px',
                padding: '2px 14px',
                borderRadius: 16,
                color: active ? C.accentInk : C.ink,
                background: active ? C.accent : 'rgba(255,252,245,0.92)',
                boxShadow: active ? '0 8px 24px rgba(138,106,63,0.35)' : '0 4px 14px rgba(90,70,35,0.10)',
                transform: active ? 'scale(1.06)' : 'scale(1)',
                opacity: spoken ? 1 : 0.75,
                marginBottom: 10,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
