import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {Check, Panel, Pill, Rise, SceneProps, Tap, frac, useSpring} from './ui';

export const TaskCard: React.FC<
  SceneProps & {
    title?: string;
    assignee?: string;
    stage?: string;
    deadline?: string;
    reviewer?: string;
    switchAt?: number;
    result?: 'accept' | 'return';
  }
> = ({
  dur,
  title = 'Раздел ЭОМ: рабочая документация',
  assignee = 'ЭлектроПроект',
  stage = 'Инженерные разделы',
  deadline = '27.07',
  reviewer = 'ГИП Никитина Мария',
  switchAt = 0.5,
  result = 'accept',
}) => {
  const frame = useCurrentFrame();
  const at = Math.round(dur * switchAt);
  const sw = frac(frame, dur, switchAt, switchAt + 0.12);
  const done = useSpring(at, {damping: 11, stiffness: 160});
  const accepted = result === 'accept';
  const finalColor = accepted ? C.done : C.overdue;
  return (
    <div style={{position: 'relative', width: 870}}>
      <Panel style={{boxSizing: 'border-box', width: 870}} pad={40}>
        <div style={{fontSize: 22, color: C.muted, marginBottom: 16}}>
          Задачи / Поликлиника на Лесной / {stage}
        </div>
        <div style={{fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5}}>{title}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, height: 54}}>
          {sw < 0.5 ? (
            <Pill size={28} style={{opacity: 1 - sw * 2}}>
              ● На проверке
            </Pill>
          ) : (
            <Pill size={28} color="#fff" bg={finalColor} style={{transform: `scale(${0.7 + 0.3 * done})`}}>
              {accepted ? '✓ Принято' : '↩ Вернули с замечанием'}
            </Pill>
          )}
          <span style={{fontSize: 24, color: C.muted}}>срок {deadline}</span>
        </div>

        <Rise delay={6}>
          <div
            style={{
              marginTop: 30,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
              fontSize: 25,
            }}
          >
            <Field label="Исполнитель" value={assignee} />
            <Field label="Проверяет" value={reviewer} />
          </div>
        </Rise>

        <Rise delay={10}>
          <div
            style={{
              marginTop: 26,
              padding: 26,
              borderRadius: 16,
              border: `2px solid ${sw > 0.5 ? finalColor : C.accent}`,
              background: sw > 0.5 ? (accepted ? '#eef5ef' : '#f9ebe6') : C.accentSoft,
              transition: 'none',
            }}
          >
            {sw < 0.5 ? (
              <>
                <div style={{fontSize: 28, fontWeight: 700}}>Работа сдана на проверку</div>
                <div style={{fontSize: 23, color: C.muted, marginTop: 8}}>Примите работу или верните с замечанием.</div>
                <div style={{display: 'flex', gap: 16, marginTop: 22, position: 'relative'}}>
                  <Tap at={at} x={accepted ? 120 : 420} y={34} />
                  <div
                    style={{
                      background: C.accent,
                      color: C.accentInk,
                      padding: '16px 28px',
                      borderRadius: 14,
                      fontSize: 26,
                      fontWeight: 700,
                      transform: `scale(${accepted ? interpolate(frame, [at - 3, at, at + 4], [1, 0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1})`,
                    }}
                  >
                    Принять работу
                  </div>
                  <div
                    style={{
                      border: `2px solid ${C.line2}`,
                      color: C.overdue,
                      padding: '14px 24px',
                      borderRadius: 14,
                      fontSize: 26,
                      fontWeight: 600,
                    }}
                  >
                    Вернуть на доработку
                  </div>
                </div>
              </>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <Check progress={done} size={84} color={finalColor} />
                <div>
                  <div style={{fontSize: 32, fontWeight: 800, color: finalColor}}>
                    {accepted ? 'Работа принята' : 'Возвращено исполнителю'}
                  </div>
                  <div style={{fontSize: 23, color: C.muted, marginTop: 6}}>
                    {accepted ? `${reviewer} · сегодня` : 'Замечание: дополнить схемы щитов'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Rise>
      </Panel>
    </div>
  );
};

const Field: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div style={{background: C.soft, borderRadius: 14, padding: '16px 20px'}}>
    <div style={{fontSize: 20, color: C.muted}}>{label}</div>
    <div style={{fontWeight: 700, marginTop: 4}}>{value}</div>
  </div>
);
