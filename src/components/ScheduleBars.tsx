import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Panel, Pill, SceneProps, Title, useSpring} from './ui';

type Row = {name: string; who?: string; pct: number; start?: number; len?: number; late?: boolean};

const barsDefault: Row[] = [
  {name: 'Электроснабжение', pct: 85},
  {name: 'Электроосвещение', pct: 70},
  {name: 'Слаботочные системы', pct: 45},
  {name: 'Пожарная сигнализация', pct: 30},
];

const cycloDefault: Row[] = [
  {name: 'АР', who: 'Бюро', pct: 100, start: 0, len: 0.34},
  {name: 'КР', who: 'Бюро', pct: 80, start: 0.1, len: 0.4},
  {name: 'ОВиК', who: 'АкваПроект', pct: 60, start: 0.3, len: 0.36},
  {name: 'ВК', who: 'АкваПроект', pct: 55, start: 0.34, len: 0.34},
  {name: 'ЭОМ', who: 'ЭлектроПроект', pct: 40, start: 0.38, len: 0.4, late: true},
  {name: 'Смета', who: 'Бюро', pct: 0, start: 0.76, len: 0.22},
];

const Bars: React.FC<{rows: Row[]}> = ({rows}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
      {rows.map((r, i) => {
        const p = interpolate(frame, [8 + i * 5, 38 + i * 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const pct = Math.round(r.pct * p);
        const color = r.pct >= 80 ? C.done : r.pct >= 50 ? C.accent : C.warn;
        return (
          <div key={i}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 700}}>
              <span>{r.name}</span>
              <span style={{color, fontVariantNumeric: 'tabular-nums'}}>{pct}%</span>
            </div>
            <div style={{height: 34, background: C.soft, borderRadius: 12, marginTop: 12, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${r.pct * p}%`, background: color, borderRadius: 12}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Cyclo: React.FC<{rows: Row[]}> = ({rows}) => {
  const frame = useCurrentFrame();
  const months = ['июн', 'июл', 'авг', 'сен'];
  const LW = 250;
  const GW = 798 - LW;
  const today = 0.62;
  const todayP = interpolate(frame, [30, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${C.line}`}}>
      <div style={{display: 'flex', background: C.soft, height: 56, alignItems: 'center', fontSize: 22, color: C.muted}}>
        <div style={{width: LW, paddingLeft: 18}}>Раздел</div>
        {months.map((m) => (
          <div key={m} style={{width: GW / months.length, borderLeft: `1px solid ${C.line2}`, paddingLeft: 10}}>
            {m}
          </div>
        ))}
      </div>
      {rows.map((r, i) => {
        const p = interpolate(frame, [6 + i * 4, 30 + i * 4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const color = r.late ? C.overdue : r.pct >= 100 ? C.done : r.pct > 0 ? C.accent : C.line2;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', height: 92, borderTop: `1px solid ${C.line}`}}>
            <div style={{width: LW, paddingLeft: 18, boxSizing: 'border-box'}}>
              <div style={{fontSize: 28, fontWeight: 700}}>{r.name}</div>
              <div style={{fontSize: 19, color: C.muted}}>{r.who}</div>
            </div>
            <div style={{position: 'relative', width: GW, height: '100%'}}>
              <div
                style={{
                  position: 'absolute',
                  left: GW * (r.start ?? 0),
                  top: 32,
                  height: 28,
                  width: GW * (r.len ?? 0.3) * p,
                  background: color,
                  opacity: r.pct > 0 ? 0.28 : 0.6,
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: GW * (r.start ?? 0),
                  top: 32,
                  height: 28,
                  width: GW * (r.len ?? 0.3) * p * (r.pct / 100),
                  background: color,
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: LW + GW * today,
          top: 56,
          bottom: 0,
          width: 3,
          background: C.overdue,
          opacity: todayP,
        }}
      />
      <div style={{position: 'absolute', left: LW + GW * today - 50, top: 14, opacity: todayP}}>
        <Pill size={18} color="#fff" bg={C.overdue}>
          сегодня
        </Pill>
      </div>
    </div>
  );
};

export const ScheduleBars: React.FC<
  SceneProps & {mode?: 'bars' | 'cyclo'; title?: string; sub?: string; rows?: Row[]}
> = ({mode = 'bars', title, sub, rows}) => {
  const s = useSpring(40);
  return (
    <Panel style={{width: 870, boxSizing: 'border-box'}}>
      {mode === 'bars' ? (
        <>
          <Title sub={sub ?? 'ЭлектроПроект · раздел ЭОМ'}>{title ?? 'График выпуска разделов'}</Title>
          <Bars rows={rows ?? barsDefault} />
        </>
      ) : (
        <>
          <Title sub={sub ?? 'Поликлиника на Лесной · из графиков субподрядчиков'}>{title ?? 'Циклограмма этапа'}</Title>
          <Cyclo rows={rows ?? cycloDefault} />
          <div style={{marginTop: 22, opacity: s, transform: `translateY(${(1 - s) * 20}px)`}}>
            <Pill size={24} color={C.overdue} bg="#f9ebe6">
              Отстаёт: ЭОМ · ЭлектроПроект
            </Pill>
          </div>
        </>
      )}
    </Panel>
  );
};
