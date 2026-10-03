import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Calendar3D, City3D, Clock3D, Meeting3D, Office3D, Phone3D, Stages3D, Vacation3D} from './Scenes3D';

const D = 120;
// Витрина 3D-сцен (для проверки), по 4 секунды
export const Gallery3D: React.FC = () => {
  const items: React.ReactNode[] = [
    <Office3D dur={D} me={[{text: 'Как проект?', at: 0.5}]} gip={[{text: 'Всё по плану 👍', at: 1.8}]} />,
    <Calendar3D dur={D} overdueAt={2.2} />,
    <Stages3D dur={D} stages={['Обмеры', 'Исходные данные', 'Концепция', 'АР и КР', 'Инженерные', 'Смета'].map((n, i) => ({name: n, at: i * 0.3}))} overdue={3} overdueAt={2.2} shiftAt={2.6} />,
    <Meeting3D dur={D} bubbles={[{seat: 1, text: 'Всё нормально', at: 0.3}, {seat: 2, text: 'Ждём субподрядчика', at: 1.6}]} />,
    <Clock3D dur={D} />,
    <Vacation3D dur={D} buzzAt={0.8} />,
    <City3D dur={D} total={10} from={3} growAt={1} fireIndex={6} fireAt={2.6} />,
    <Phone3D dur={D} header="Стройконтроль" sub="бот · Telegram" lines={[{title: 'Ежедневный отчёт', text: 'Сдано 4 · на проверке 2 · горит 1', at: 0.5}]} />,
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
export const GALLERY3D_FRAMES = 8 * D;
