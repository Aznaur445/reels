import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Panel, Pill, SceneProps, frac, useSpring} from './ui';

type Kind = 'chat' | 'sheet' | 'mail' | 'doc';
const items: {k: Kind; label: string; badge?: string}[] = [
  {k: 'chat', label: 'Чат ГИПа', badge: '38'},
  {k: 'sheet', label: 'график_v7.xlsx'},
  {k: 'mail', label: 'Re: Re: сроки', badge: '5'},
  {k: 'chat', label: 'Подрядчики', badge: '112'},
  {k: 'doc', label: 'замечания.docx'},
  {k: 'sheet', label: 'объёмы_итог.xlsx'},
  {k: 'chat', label: 'Объект Лесная', badge: '27'},
  {k: 'mail', label: 'Fwd: ЭОМ'},
  {k: 'doc', label: 'ТЗ_новое.pdf'},
  {k: 'sheet', label: 'КОПИЯ финал.xlsx'},
];

const Icon: React.FC<{k: Kind}> = ({k}) => {
  const stroke = C.ink;
  if (k === 'chat')
    return (
      <svg width={64} height={64} viewBox="0 0 24 24" fill={C.accentSoft} stroke={stroke} strokeWidth={1.6}>
        <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
        <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" />
      </svg>
    );
  if (k === 'sheet')
    return (
      <svg width={64} height={64} viewBox="0 0 24 24" fill="#e7f0e8" stroke={stroke} strokeWidth={1.6}>
        <rect x={4} y={3} width={16} height={18} rx={2} />
        <path d="M4 9h16M4 15h16M10 3v18" />
      </svg>
    );
  if (k === 'mail')
    return (
      <svg width={64} height={64} viewBox="0 0 24 24" fill="#f3e6df" stroke={stroke} strokeWidth={1.6}>
        <rect x={3} y={5} width={18} height={14} rx={2} />
        <path d="M3.5 6l8.5 7 8.5-7" fill="none" />
      </svg>
    );
  return (
    <svg width={64} height={64} viewBox="0 0 24 24" fill="#fff" stroke={stroke} strokeWidth={1.6}>
      <path d="M6 3h8l4 4v14H6z" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 12h6M9 15h6" />
    </svg>
  );
};

const Dashboard: React.FC<{s: number}> = ({s}) => {
  const rows = [
    {n: 'Договор и ТЗ', p: 100, c: C.done},
    {n: 'Концепция', p: 100, c: C.done},
    {n: 'Проектная: АР и КР', p: 64, c: C.overdue},
    {n: 'Инженерные разделы', p: 48, c: C.accent},
    {n: 'Сметная документация', p: 0, c: C.faint},
  ];
  return (
    <Panel style={{width: 800, boxSizing: 'border-box', transform: `scale(${0.6 + 0.4 * s})`, opacity: s}}>
      <div style={{fontSize: 22, color: C.muted}}>Стройконтроль · проект</div>
      <div style={{fontSize: 38, fontWeight: 800, marginTop: 4}}>Поликлиника на Лесной</div>
      <div style={{display: 'flex', gap: 12, marginTop: 18}}>
        <Pill size={22}>Этапы</Pill>
        <Pill size={22} color={C.muted} bg={C.soft}>
          Задачи 12
        </Pill>
        <Pill size={22} color={C.muted} bg={C.soft}>
          Чат
        </Pill>
        <Pill size={22} color={C.muted} bg={C.soft}>
          Документы
        </Pill>
      </div>
      <div style={{marginTop: 24}}>
        {rows.map((r, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderTop: `1px solid ${C.line}`}}>
            <span style={{flex: 1, fontSize: 26, fontWeight: 600}}>{r.n}</span>
            <div style={{width: 220, height: 14, background: C.soft, borderRadius: 7, overflow: 'hidden'}}>
              <div style={{width: `${r.p * Math.min(1, s * 1.2)}%`, height: '100%', background: r.c}} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export const Chaos: React.FC<SceneProps & {collapseAt?: number}> = ({dur, collapseAt = 0.5}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const collapse = frac(frame, dur, collapseAt, collapseAt + 0.2);
  const ease = collapse * collapse;
  const dash = useSpring(Math.round(dur * (collapseAt + 0.14)), {damping: 15});
  const intro = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'relative', width: 870, height: 860}}>
      {items.map((it, i) => {
        const base = (i / items.length) * Math.PI * 2;
        const ang = base + t * (0.7 + ease * 6) + Math.sin(t * 1.3 + i) * 0.15;
        const rad = (230 + (i % 3) * 85 + Math.sin(t * 2 + i * 1.7) * 18) * (1 - ease) * intro;
        const x = 435 + Math.cos(ang) * rad;
        const y = 430 + Math.sin(ang) * rad * 1.05;
        const sc = (1 - ease * 0.9) * (0.9 + 0.1 * Math.sin(t * 3 + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${sc}) rotate(${Math.sin(t * 2 + i) * 12 + ease * 180}deg)`,
              opacity: 1 - collapse,
              background: C.panel,
              borderRadius: 18,
              padding: '12px 16px',
              boxShadow: '0 8px 20px rgba(90,70,35,0.16)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <Icon k={it.k} />
            <span style={{fontSize: 22, fontWeight: 600, color: C.ink}}>{it.label}</span>
            {it.badge ? (
              <span
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  background: C.overdue,
                  color: '#fff',
                  borderRadius: 99,
                  padding: '3px 10px',
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {it.badge}
              </span>
            ) : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {dash > 0.001 ? <Dashboard s={dash} /> : null}
      </div>
    </div>
  );
};
