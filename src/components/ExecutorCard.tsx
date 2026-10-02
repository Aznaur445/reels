import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Check, Panel, Pill, Rise, SceneProps, Tap, frac, useSpring} from './ui';

export const ExecutorCard: React.FC<
  SceneProps & {
    name?: string;
    rating?: number;
    sections?: string[];
    projects?: number;
    stage?: string;
    selectAt?: number;
  }
> = ({
  dur,
  name = 'АкваПроект',
  rating = 4.9,
  sections = ['ОВиК', 'ВК'],
  projects = 3,
  stage = 'Инженерные разделы',
  selectAt = 0.55,
}) => {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [10, 36], [0, rating], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const at = Math.round(dur * selectAt);
  const sel = frac(frame, dur, selectAt, selectAt + 0.08);
  const chosen = useSpring(at + 2, {damping: 12});
  return (
    <div style={{position: 'relative', width: 870}}>
      <Panel style={{width: 870, boxSizing: 'border-box'}} pad={40}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 32,
              background: C.accentSoft,
              color: C.accent,
              fontSize: 54,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {name.replace(/[«»"]/g, '').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{fontSize: 44, fontWeight: 800, letterSpacing: -0.5}}>{name}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8}}>
              <Stars value={r} />
              <span style={{fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{r.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <Rise delay={8}>
          <div style={{display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap'}}>
            {sections.map((s) => (
              <Pill key={s} size={26}>
                {s}
              </Pill>
            ))}
            <Pill size={26} color={C.done} bg="#eef5ef">
              ✓ Проверенный опыт
            </Pill>
          </div>
        </Rise>
        <Rise delay={14}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 26}}>
            <Stat label="Портфолио" value={`${projects} объекта`} />
            <Stat label="Отзывы" value="есть в профиле" />
          </div>
        </Rise>
        <div style={{marginTop: 30, height: 110, position: 'relative'}}>
          <Tap at={at} x={395} y={44} />
          {sel < 0.5 ? (
            <div
              style={{
                background: C.accent,
                color: C.accentInk,
                borderRadius: 16,
                padding: '24px 0',
                textAlign: 'center',
                fontSize: 30,
                fontWeight: 800,
                transform: `scale(${interpolate(frame, [at - 3, at, at + 4], [1, 0.95, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
              }}
            >
              Выбрать исполнителя
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                background: '#eef5ef',
                border: `2px solid ${C.done}`,
                borderRadius: 16,
                padding: '18px 22px',
                transform: `scale(${0.9 + 0.1 * chosen})`,
              }}
            >
              <Check progress={chosen} size={64} />
              <div>
                <div style={{fontSize: 27, fontWeight: 800, color: C.done}}>Добавлен в этап «{stage}»</div>
                <div style={{fontSize: 22, color: C.muted, marginTop: 4}}>задача со сроком уже создана</div>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};

const Stars: React.FC<{value: number}> = ({value}) => (
  <div style={{display: 'flex', gap: 4}}>
    {[0, 1, 2, 3, 4].map((i) => {
      const f = Math.max(0, Math.min(1, value - i));
      return (
        <div key={i} style={{position: 'relative', fontSize: 34, color: C.line2, lineHeight: 1}}>
          ★
          <div style={{position: 'absolute', inset: 0, width: `${f * 100}%`, overflow: 'hidden', color: C.warn}}>★</div>
        </div>
      );
    })}
  </div>
);

const Stat: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div style={{background: C.soft, borderRadius: 14, padding: '18px 22px'}}>
    <div style={{fontSize: 21, color: C.muted}}>{label}</div>
    <div style={{fontSize: 27, fontWeight: 700, marginTop: 4}}>{value}</div>
  </div>
);
