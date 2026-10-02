import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chaos} from '../components';
import {FONT} from '../theme';
import type {Storyboard, Word} from '../types';
import {Camera} from './Camera';
import {CardStack, CtaDark, HookTitle, NumberBadge, PhoneChat, Pill} from './Overlays';
import {SCREENS} from './screens';
import {SubtitlesDark} from './SubtitlesDark';
import {D} from './theme';

const BgDark: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at ${50 + Math.sin(f / 120) * 6}% 42%, ${D.bg2} 0%, ${D.bg} 70%)`}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 120%, rgba(79,123,234,0.12), transparent 60%)'}} />
    </AbsoluteFill>
  );
};

const ScreenThumb: React.FC<{screen: string}> = ({screen}) => {
  const def = SCREENS[screen];
  const s = 440 / def.w;
  return (
    <div style={{width: def.w, height: def.h, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      <def.Comp />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENES: Record<string, React.FC<any>> = {
  camera: Camera,
  cardStack: CardStack,
  phoneChat: ({dur, screen = 'project', ...p}: {dur: number; screen?: string}) => <PhoneChat dur={dur} Screen={<ScreenThumb screen={screen} />} {...p} />,
  chaos: ({dur}: {dur: number}) => (
    <div style={{position: 'absolute', top: 330, left: 60}}>
      <Chaos dur={dur} />
    </div>
  ),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OVERLAYS: Record<string, React.FC<any>> = {hookTitle: HookTitle, pill: Pill, numberBadge: NumberBadge};

const useDucking = (words: Word[], total: number, fps: number, under: number, open: number) =>
  useMemo(() => {
    const sp = new Array(total).fill(false);
    words.forEach((w, i) => {
      const n = words[i + 1];
      const end = n && n.start - w.end < 0.6 ? n.start : w.end + 0.15;
      for (let f = Math.floor((w.start - 0.12) * fps); f < Math.ceil(end * fps); f++) if (f >= 0 && f < total) sp[f] = true;
    });
    let db = open;
    const a = 1 - Math.exp(-1 / (0.08 * fps));
    const r = 1 - Math.exp(-1 / (0.45 * fps));
    return sp.map((s, f) => {
      const tg = s ? under : open;
      db += (tg - db) * (tg < db ? a : r);
      return Math.pow(10, db / 20) * Math.min(1, f / (0.6 * fps)) * Math.min(1, (total - f) / (1.2 * fps));
    });
  }, [words, total, fps, under, open]);

export const ReelDark: React.FC<{sb: Storyboard}> = ({sb}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const fr = (s: number) => Math.round(s * fps);
  const vol = useDucking(sb.words, durationInFrames, fps, sb.music?.underVoiceDb ?? -22, sb.music?.openDb ?? -15);
  const ctaFrom = fr(sb.cta.from);
  return (
    <AbsoluteFill style={{color: D.white, fontFamily: FONT}}>
      <BgDark />
      {sb.scenes.map((s, i) => {
        const Comp = SCENES[s.type];
        const from = fr(s.from);
        const dur = Math.max(1, fr(s.to) - from);
        return Comp ? (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <Comp dur={dur} {...(s.props ?? {})} />
            </AbsoluteFill>
          </Sequence>
        ) : null;
      })}
      {(sb.overlays ?? []).map((o, i) => {
        const Comp = OVERLAYS[o.type];
        const from = fr(o.from);
        const dur = Math.max(1, fr(o.to) - from);
        return Comp ? (
          <Sequence key={`o${i}`} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill>
              <Comp dur={dur} {...(o.props ?? {})} />
            </AbsoluteFill>
          </Sequence>
        ) : null;
      })}
      <SubtitlesDark words={sb.words} hideFrom={sb.cta.from} accent={sb.accentWords} />
      <Sequence from={ctaFrom} durationInFrames={Math.max(1, durationInFrames - ctaFrom)} layout="none">
        <AbsoluteFill>
          <Camera dur={durationInFrames - ctaFrom} screen="project" shots={[{at: 0, focus: 'all', width: 900}]} dimAll={0.7} cy={830} clip={false} />
          <CtaDark keyword={sb.cta.keyword} lead={sb.cta.lead} pill={sb.cta.tail} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile(sb.voice)} />
      {sb.music ? <Audio src={staticFile(sb.music.src)} volume={(f) => vol[f] ?? 0} loop /> : null}
    </AbsoluteFill>
  );
};
