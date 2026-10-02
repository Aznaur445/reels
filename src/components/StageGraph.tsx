import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Panel, Pill, SceneProps, Title, frac, useSpring} from './ui';

type Status = 'done' | 'work' | 'overdue' | 'wait';
type Node = {name: string; dates: string; status: Status; x: number; y: number; w: number};

const STATUS: Record<Status, {c: string; label: string}> = {
  done: {c: C.done, label: 'Завершён'},
  work: {c: C.accent, label: 'В работе'},
  overdue: {c: C.overdue, label: 'Просрочен'},
  wait: {c: C.faint, label: 'Ожидает'},
};

const NH = 108;
const ROW = 140;
const CW = 380;
const SW = 380;

const defaultNodes: Node[] = [
  {name: 'Договор и ТЗ', dates: '03.05 – 12.05', status: 'done', x: 209, y: 0, w: CW},
  {name: 'Обмерные работы', dates: '13.05 – 26.05', status: 'done', x: 0, y: ROW, w: SW},
  {name: 'Исходные данные и ТУ', dates: '13.05 – 11.06', status: 'done', x: 418, y: ROW, w: SW},
  {name: 'Концепция', dates: '27.05 – 15.06', status: 'done', x: 209, y: ROW * 2, w: CW},
  {name: 'Проектная: АР и КР', dates: '16.06 – 22.07', status: 'work', x: 0, y: ROW * 3, w: SW},
  {name: 'Инженерные разделы', dates: '16.06 – 27.07', status: 'work', x: 418, y: ROW * 3, w: SW},
  {name: 'Сметная документация', dates: '28.07 – 10.08', status: 'wait', x: 209, y: ROW * 4, w: CW},
];
const edges: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
];

const StageNode: React.FC<{n: Node; i: number; overdue: number}> = ({n, i, overdue}) => {
  const s = useSpring(2 + i * 2);
  const frame = useCurrentFrame();
  const st = overdue > 0 ? STATUS.overdue : STATUS[n.status];
  const pulse = overdue > 0 ? 0.5 + 0.5 * Math.sin(frame / 4) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: n.x,
        top: n.y,
        width: n.w,
        height: NH,
        background: overdue > 0 ? `color-mix(in srgb, ${C.overdue} ${10 * overdue}%, ${C.panel})` : C.panel,
        border: `2px solid ${overdue > 0 ? C.overdue : C.line2}`,
        borderLeft: `9px solid ${st.c}`,
        borderRadius: 16,
        padding: '13px 20px',
        boxSizing: 'border-box',
        opacity: s,
        transform: `scale(${(0.85 + 0.15 * s) * (1 + overdue * 0.06)})`,
        boxShadow:
          overdue > 0
            ? `0 0 0 ${6 + pulse * 10}px rgba(192,86,63,${0.18 * overdue}), 0 12px 30px rgba(192,86,63,0.25)`
            : '0 4px 14px rgba(90,70,35,0.08)',
        zIndex: overdue > 0 ? 2 : 1,
      }}
    >
      <div style={{fontSize: 27, fontWeight: 700, whiteSpace: 'nowrap'}}>{n.name}</div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 22, color: C.muted}}>
        <span>{n.dates}</span>
        <span style={{color: st.c, fontWeight: 700}}>{st.label}</span>
      </div>
    </div>
  );
};

export const StageGraph: React.FC<
  SceneProps & {project?: string; overdueIndex?: number; overdueAt?: number; overdueText?: string}
> = ({dur, project = 'Поликлиника на Лесной, капремонт', overdueIndex = 4, overdueAt = 0.35, overdueText = 'Просрочен на 3 дня'}) => {
  const frame = useCurrentFrame();
  const over = frac(frame, dur, overdueAt, overdueAt + 0.08);
  const badge = useSpring(Math.round(dur * overdueAt) + 4, {damping: 10, stiffness: 180});
  const nodes = defaultNodes;
  const od = nodes[overdueIndex];
  return (
    <Panel style={{width: 870, boxSizing: 'border-box'}}>
      <Title sub={project}>График этапов</Title>
      <div
        style={{
          position: 'relative',
          height: ROW * 4 + NH,
          background: C.soft,
          borderRadius: 16,
          margin: -6,
          padding: 6,
          backgroundImage: `radial-gradient(${C.line2} 1.5px, transparent 1.5px)`,
          backgroundSize: '22px 22px',
        }}
      >
        <svg style={{position: 'absolute', inset: 6, overflow: 'visible'}} width={798} height={ROW * 4 + NH}>
          {edges.map(([a, b], i) => {
            const A = nodes[a];
            const B = nodes[b];
            const x1 = A.x + A.w / 2;
            const y1 = A.y + NH;
            const x2 = B.x + B.w / 2;
            const y2 = B.y;
            const p = interpolate(frame, [4 + i * 2, 16 + i * 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const red = a === overdueIndex && over > 0;
            return (
              <path
                key={i}
                d={`M${x1} ${y1} C${x1} ${y1 + 30}, ${x2} ${y2 - 30}, ${x2} ${y2}`}
                fill="none"
                stroke={red ? C.overdue : C.done}
                strokeOpacity={red ? 0.9 : 0.55}
                strokeWidth={red ? 4 : 3}
                pathLength={1}
                strokeDasharray={red ? '0.06 0.04' : '1 1'}
                strokeDashoffset={red ? -frame / 40 : 1 - p}
              />
            );
          })}
        </svg>
        {nodes.map((n, i) => (
          <StageNode key={i} n={n} i={i} overdue={i === overdueIndex ? over : 0} />
        ))}
        <div
          style={{
            position: 'absolute',
            left: od.x + 18,
            top: od.y - 34,
            transform: `scale(${badge})`,
            transformOrigin: 'left bottom',
            zIndex: 3,
          }}
        >
          <Pill color="#fff" bg={C.overdue} size={24}>
            ⚠ {overdueText}
          </Pill>
        </div>
      </div>
      <div style={{display: 'flex', gap: 26, marginTop: 24, fontSize: 21, color: C.muted}}>
        {(['done', 'work', 'overdue', 'wait'] as Status[]).map((k) => (
          <span key={k} style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{width: 18, height: 6, borderRadius: 3, background: STATUS[k].c}} />
            {STATUS[k].label}
          </span>
        ))}
      </div>
    </Panel>
  );
};
