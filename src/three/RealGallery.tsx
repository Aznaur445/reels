import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Dominoes, EmptyDesk, Meeting12, NightDesk, Queue} from './RealScenes';

const D = 120;
// Витрина реалистичных сцен (для проверки), по 4 секунды
export const RealGallery: React.FC = () => {
  const items: React.ReactNode[] = [
    <Meeting12 dur={D} keys={[{t: 0, pos: [0.4, 2.9, 5.6], look: [0, 1.1, -1.2]}, {t: 4, pos: [0.3, 2.5, 4.4], look: [0, 1.2, -1.5]}]} says={[{who: 'client', text: 'Когда будет рабочка по инженерке?', at: 0.4}, {who: 'me', text: 'Уточню и вернусь', at: 2}]} writeAt={2.8} />,
    <NightDesk dur={D} keys={[{t: 0, pos: [2.0, 1.9, 2.6], look: [0, 1.0, -0.5]}, {t: 4, pos: [1.5, 1.7, 2.0], look: [0, 1.0, -0.5]}]} hi={2} phone={[{title: 'Пропущенный', text: 'Заказчик', at: 1}]} />,
    <EmptyDesk dur={D} keys={[{t: 0, pos: [-1.2, 2.1, 3.6], look: [0.6, 0.9, 0]}, {t: 4, pos: [-0.9, 1.9, 3.0], look: [0.8, 1.0, 0.2]}]} newAt={1.5} papersAt={2.2} />,
    <Queue dur={D} keys={[{t: 0, pos: [3.0, 2.4, 3.5], look: [0, 1, -1.5]}, {t: 4, pos: [2.2, 2.0, 2.5], look: [0, 1, -2]}]} buzzAt={1.5} poseAt={2.5} />,
    <Dominoes dur={D} keys={[{t: 0, pos: [0.9, 1.7, 3.4], look: [0, 0.95, 0]}, {t: 4, pos: [0.6, 1.5, 2.8], look: [0, 0.95, 0]}]} />,
  ];
  return (
    <AbsoluteFill>
      {items.map((it, i) => (
        <Sequence key={i} from={i * D} durationInFrames={D}>
          {it}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
export const REALGALLERY_FRAMES = 5 * D;
