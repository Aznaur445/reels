import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {SceneProps, useSpring} from './ui';

type Note = {app: string; title: string; text: string; color?: string};

const defaults: Note[] = [
  {
    app: 'Telegram',
    title: 'Ежедневный отчёт',
    text: 'Лесная: принято 3 задачи, просрочен 1 этап.',
  },
  {app: 'Telegram', title: 'Напоминание о сроке', text: 'ЭОМ · ЭлектроПроект — сдать на проверку завтра.', color: C.warn},
  {app: 'Почта', title: 'Просрочен этап', text: 'Проектная: АР и КР — срок прошёл 3 дня назад.', color: C.overdue},
];

const Bell: React.FC<{color: string}> = ({color}) => (
  <div
    style={{
      width: 62,
      height: 62,
      borderRadius: 16,
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  </div>
);

const Card: React.FC<{n: Note; delay: number; big?: boolean}> = ({n, delay, big}) => {
  const s = useSpring(delay, {damping: 14, stiffness: 150});
  return (
    <div
      style={{
        background: 'rgba(255,252,245,0.96)',
        borderRadius: 26,
        padding: big ? '24px 24px' : '20px 22px',
        display: 'flex',
        gap: 18,
        boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
        transform: `translateY(${(1 - s) * -160}px) scale(${0.9 + 0.1 * s})`,
        opacity: s,
        marginBottom: 16,
      }}
    >
      <Bell color={n.color ?? C.accent} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 19, color: C.muted}}>
          <span style={{fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>
            {n.app} · Стройконтроль
          </span>
          <span>сейчас</span>
        </div>
        <div style={{fontSize: big ? 30 : 26, fontWeight: 800, marginTop: 4, color: C.ink}}>{n.title}</div>
        <div style={{fontSize: big ? 24 : 21, color: C.ink, marginTop: 4, lineHeight: 1.3}}>{n.text}</div>
      </div>
    </div>
  );
};

export const PhoneNotification: React.FC<SceneProps & {notes?: Note[]; time?: string; date?: string}> = ({
  dur,
  notes = defaults,
  time = '09:00',
  date = 'понедельник',
}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0, {damping: 18});
  const gap = Math.max(10, Math.round((dur - 20) / Math.max(notes.length, 1) / 1.2));
  return (
    <div
      style={{
        width: 560,
        height: 860,
        margin: '0 auto',
        borderRadius: 70,
        background: '#1f1c18',
        padding: 16,
        boxShadow: '0 30px 70px rgba(60,45,20,0.35)',
        transform: `translateY(${(1 - s) * 120}px) rotate(${(1 - s) * -4 + Math.sin(frame / 40) * 0.6}deg)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 56,
          overflow: 'hidden',
          position: 'relative',
          background: `linear-gradient(170deg, #c9b391 0%, #8a6a3f 55%, #4b3a22 100%)`,
          padding: '30px 22px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{width: 150, height: 36, borderRadius: 20, background: '#1f1c18', margin: '0 auto'}} />
        <div style={{textAlign: 'center', color: '#fffaf0', marginTop: 18, marginBottom: 24}}>
          <div style={{fontSize: 28, fontWeight: 600, opacity: 0.9}}>{date}</div>
          <div style={{fontSize: 110, fontWeight: 700, lineHeight: 1, letterSpacing: -3}}>{time}</div>
        </div>
        {notes.map((n, i) => (
          <Card key={i} n={n} delay={10 + i * gap} big={i === 0} />
        ))}
      </div>
    </div>
  );
};
