import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, Brand} from './Background';
import {
  Chaos,
  Counter,
  CtaKeyword,
  ExecutorCard,
  KineticWord,
  OrderFeed,
  PhoneNotification,
  ScheduleBars,
  Screenshot,
  StageGraph,
  Subtitles,
  TaskCard,
} from './components';
import {C, FONT, VISUAL} from './theme';
import type {Scene, SceneType, Storyboard, Word} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Partial<Record<SceneType, React.FC<any>>> = {
  stageGraph: StageGraph,
  taskCard: TaskCard,
  scheduleBars: ScheduleBars,
  phoneNotification: PhoneNotification,
  orderFeed: OrderFeed,
  executorCard: ExecutorCard,
  chaos: Chaos,
  counter: Counter,
  kineticWord: KineticWord,
  screenshot: Screenshot,
};

/** Сцена: появление пружиной, лёгкий зум и сдвиг камеры, уход в конце. */
const SceneShell: React.FC<{scene: Scene; index: number; dur: number}> = ({scene, index, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 17, stiffness: 120, mass: 0.9}});
  const exit = interpolate(frame, [dur - 6, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p = frame / Math.max(1, dur);
  const dir = index % 2 === 0 ? 1 : -1;
  const zoom = 1 + 0.045 * p;
  const panX = dir * 14 * (p - 0.5);
  const panY = -10 * p;
  const Comp = REGISTRY[scene.type];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: VISUAL.top,
          left: 60,
          width: 870,
          height: VISUAL.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: enter * (1 - exit),
          transform: `translate(${panX + (1 - enter) * dir * 70}px, ${panY + (1 - enter) * 50}px) scale(${zoom * (0.9 + 0.1 * enter) * (1 + exit * 0.04)})`,
        }}
      >
        {Comp ? <Comp dur={dur} variant={index} {...(scene.props ?? {})} /> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Громкость музыки по кадрам: −22 dB под голосом, громче в паузах и на финале. */
const useDucking = (words: Word[], totalFrames: number, fps: number, underDb: number, openDb: number) =>
  useMemo(() => {
    const speaking = new Array(totalFrames).fill(false);
    words.forEach((w, i) => {
      const next = words[i + 1];
      const end = next && next.start - w.end < 0.6 ? next.start : w.end + 0.15;
      for (let f = Math.floor((w.start - 0.12) * fps); f < Math.ceil(end * fps); f++) if (f >= 0 && f < totalFrames) speaking[f] = true;
    });
    const out: number[] = [];
    let db = openDb;
    const att = 1 - Math.exp(-1 / (0.08 * fps));
    const rel = 1 - Math.exp(-1 / (0.45 * fps));
    for (let f = 0; f < totalFrames; f++) {
      const target = speaking[f] ? underDb : openDb;
      db += (target - db) * (target < db ? att : rel);
      const fadeIn = Math.min(1, f / (0.6 * fps));
      const fadeOut = Math.min(1, (totalFrames - f) / (1.2 * fps));
      out.push(Math.pow(10, db / 20) * fadeIn * fadeOut);
    }
    return out;
  }, [words, totalFrames, fps, underDb, openDb]);

export const Reel: React.FC<{sb: Storyboard}> = ({sb}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const music = sb.music;
  const vol = useDucking(sb.words, durationInFrames, fps, music?.underVoiceDb ?? -22, music?.openDb ?? -15);
  return (
    <AbsoluteFill style={{fontFamily: FONT, color: C.ink}}>
      <Background />
      <Brand />
      {sb.scenes.map((s, i) => {
        const from = f(s.from);
        const dur = Math.max(1, f(s.to) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <SceneShell scene={s} index={i} dur={dur} />
          </Sequence>
        );
      })}
      {sb.kinetic.map((k, i) => {
        const dur = f(k.duration ?? 1);
        return (
          <Sequence key={`k${i}`} from={Math.max(0, f(k.at) - 2)} durationInFrames={dur} layout="none">
            <AbsoluteFill style={{top: VISUAL.top, left: 60, width: 870, height: VISUAL.height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <KineticWord dur={dur} text={k.text} overlay />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Subtitles words={sb.words} hideFrom={sb.cta.from} />
      <Sequence from={f(sb.cta.from)} durationInFrames={Math.max(1, durationInFrames - f(sb.cta.from))} layout="none">
        <CtaKeyword keyword={sb.cta.keyword} lead={sb.cta.lead} tail={sb.cta.tail} />
      </Sequence>
      <Audio src={staticFile(sb.voice)} />
      {music ? <Audio src={staticFile(music.src)} volume={(fr) => vol[fr] ?? 0} loop /> : null}
    </AbsoluteFill>
  );
};
