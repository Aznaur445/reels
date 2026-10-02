import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Background, Brand} from './Background';
import {Chaos, Counter, CtaKeyword, ExecutorCard, KineticWord, OrderFeed, PhoneNotification, ScheduleBars, StageGraph, TaskCard} from './components';
import {C, FONT, VISUAL} from './theme';

// Витрина всех компонентов — удобно смотреть в `npm run studio`.
const items: [React.FC<any>, Record<string, unknown>][] = [
  [StageGraph, {}],
  [TaskCard, {}],
  [ScheduleBars, {mode: 'bars'}],
  [ScheduleBars, {mode: 'cyclo'}],
  [Chaos, {}],
  [PhoneNotification, {}],
  [OrderFeed, {}],
  [ExecutorCard, {}],
  [Counter, {value: 5000, suffix: ' ₽', label: 'в месяц за активный проект'}],
  [KineticWord, {text: 'Сроки'}],
];
export const SHOWCASE_SCENE = 90;

export const Showcase: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT, color: C.ink}}>
    <Background />
    <Brand />
    {items.map(([Comp, props], i) => (
      <Sequence key={i} from={i * SHOWCASE_SCENE} durationInFrames={SHOWCASE_SCENE} layout="none">
        <div style={{position: 'absolute', top: VISUAL.top, left: 60, width: 870, height: VISUAL.height, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Comp dur={SHOWCASE_SCENE} {...props} />
        </div>
      </Sequence>
    ))}
    <Sequence from={items.length * SHOWCASE_SCENE} durationInFrames={150} layout="none">
      <CtaKeyword keyword="ГРАФИК" />
    </Sequence>
  </AbsoluteFill>
);
export const SHOWCASE_FRAMES = items.length * SHOWCASE_SCENE + 150;
