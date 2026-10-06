import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {groupWords} from '../components/Subtitles';
import {useDucking} from '../dark/ReelDark';
import {HEAD} from '../dark/theme';
import type {Storyboard, Word} from '../types';

// Стиль «экран» (референс DeG5FVTB8Wj): видео с телефона во весь кадр, лёгкие наезды на склейках,
// крупные субтитры, подписи к деталям и плашка с кодовым словом в конце.
const BLUE = '#3f5bd8';
const ease = (t: number, a: number, d = 0.25) => interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

type Src = Storyboard & {video?: string; rawAudio?: boolean; zooms?: {at: number; s: number; x?: number; y?: number}[]};

const Footage: React.FC<{sb: Src}> = ({sb}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const z = [...(sb.zooms ?? [])].reverse().find((q) => t >= q.at) ?? {s: 1, x: 50, y: 40, at: 0};
  const prev = (sb.zooms ?? []).filter((q) => q.at <= t);
  const before = prev.length > 1 ? prev[prev.length - 2] : {s: 1, x: 50, y: 40, at: 0};
  const k = ease(t, z.at, 0.45);
  const s = before.s + (z.s - before.s) * k;
  const x = (before.x ?? 50) + ((z.x ?? 50) - (before.x ?? 50)) * k;
  const y = (before.y ?? 40) + ((z.y ?? 40) - (before.y ?? 40)) * k;
  const segs = sb.segments ?? [];
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: sb.rawAudio ? undefined : `scale(${s * (1 + 0.012 * Math.sin(t / 3))})`, transformOrigin: `${x}% ${y}%`}}>
        {segs.map((g, i) => {
          const from = Math.round(g.at * fps);
          const dur = Math.max(1, Math.round(g.dur * fps) + (i < segs.length - 1 ? 1 : sb.rawAudio ? 0 : Math.round(6 * fps)));
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <OffthreadVideo src={staticFile(sb.video!)} startFrom={Math.round(g.src * fps)} muted={!sb.rawAudio} style={{position: 'absolute', left: 0, top: -2, width: 1080, height: 1925, objectFit: 'cover'}} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {sb.rawAudio ? null : <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 18%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />}
    </AbsoluteFill>
  );
};

/** Подпись к детали: тёмная плашка сверху, как в референсе. */
const Label: React.FC<{dur: number; text: string; y?: number; accent?: boolean}> = ({dur, text, y = 300, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const e = ease(t, 0, 0.25) * (1 - ease(t, dur / fps - 0.2, 0.2));
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: e, transform: `translateY(${(1 - e) * -20}px) scale(${0.92 + 0.08 * e})`}}>
      <div style={{maxWidth: 900, textAlign: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 50, lineHeight: 1.15, color: '#fff', background: accent ? BLUE : 'rgba(10,10,14,0.88)', padding: '18px 30px', borderRadius: 22, boxShadow: '0 12px 40px rgba(0,0,0,0.45)'}}>{text}</div>
    </div>
  );
};

/** Субтитры: 2–3 слова, заглавные, белые с обводкой; ключевое слово — в синей плашке. */
const Subs: React.FC<{words: Word[]; accent?: string[]; y?: number; hideFrom?: number}> = ({words, accent, y = 1240, hideFrom = 1e9}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const groups = useMemo(() => groupWords(words, 3), [words]);
  const re = useMemo(() => new RegExp(`^(${(accent?.length ? accent : ['стройконтрол', 'квартал', 'офис']).join('|')})`, 'i'), [accent]);
  if (t >= hideFrom) return null;
  const g = groups.find((g, i) => t >= g.start - 0.08 && t < Math.min(g.end + 0.5, (groups[i + 1]?.start ?? Infinity) - 0.08));
  if (!g) return null;
  const pop = ease(t, g.start - 0.08, 0.12);
  return (
    <div style={{position: 'absolute', top: y, left: 60, width: 960, textAlign: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 68, lineHeight: 1.15, textTransform: 'uppercase', color: '#fff', transform: `scale(${0.9 + 0.1 * pop})`, opacity: pop}}>
      {g.words.map((w, i) => {
        const clean = w.text.replace(/^[«"(]+/, '');
        const hl = re.test(clean);
        const on = t >= w.start - 0.05;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                padding: hl ? '0 14px' : undefined,
                borderRadius: 12,
                background: hl && on ? BLUE : undefined,
                color: on ? '#fff' : 'rgba(255,255,255,0.6)',
                WebkitTextStroke: hl && on ? undefined : '3px #000',
                paintOrder: 'stroke fill',
                textShadow: '0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              {w.text}
            </span>
            {i < g.words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ReelScreen: React.FC<{sb: Storyboard}> = ({sb: base}) => {
  const sb = base as Src;
  const {fps, durationInFrames} = useVideoConfig();
  const fr = (s: number) => Math.round(s * fps);
  const vol = useDucking(sb.words, durationInFrames, fps, sb.music?.underVoiceDb ?? -24, sb.music?.openDb ?? -16);
  const ctaFrom = fr(sb.cta.from);
  return (
    <AbsoluteFill>
      <Footage sb={sb} />
      {(sb.overlays ?? []).map((o, i) => {
        const from = fr(o.from);
        const dur = Math.max(1, fr(o.to) - from);
        return o.type === 'label' ? (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <Label dur={dur} {...(o.props as {text: string})} />
            </AbsoluteFill>
          </Sequence>
        ) : null;
      })}
      <Subs words={sb.words} accent={sb.accentWords} />
      {sb.cta.keyword ? <Sequence from={ctaFrom} durationInFrames={Math.max(1, durationInFrames - ctaFrom)} layout="none">
        <AbsoluteFill>
          <Label dur={durationInFrames - ctaFrom + 60} text={`Пиши в комментах «${sb.cta.keyword}»`} y={250} accent />
        </AbsoluteFill>
      </Sequence> : null}
      {sb.rawAudio ? null : <Audio src={staticFile(sb.voice)} />}
      {sb.music ? <Audio src={staticFile(sb.music.src)} volume={(f) => vol[f] ?? 0} loop /> : null}
    </AbsoluteFill>
  );
};
