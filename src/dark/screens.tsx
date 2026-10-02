// «Экраны» сервиса в стиле stroy-control1.ru на примерных данных.
// У каждого экрана известны координаты блоков (regions) — по ним камера наезжает и подсвечивает.
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';

export type Rect = {x: number; y: number; w: number; h: number};
export type ScreenDef = {w: number; h: number; regions: Record<string, Rect>; Comp: React.FC<ScreenProps>};
export type ScreenProps = {overdueAt?: number; acceptAt?: number; notStartedAt?: number};

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};

const Box: React.FC<{r: Rect; children: React.ReactNode; style?: React.CSSProperties}> = ({r, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      background: C.panel,
      border: `1.5px solid ${C.line}`,
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(90,70,35,0.04), 0 8px 26px rgba(90,70,35,0.05)',
      boxSizing: 'border-box',
      padding: '22px 26px',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

const TopBar: React.FC<{active: string; w: number; user?: [string, string, string]}> = ({active, w, user = ['НМ', 'Никитина Мария', 'ГИП']}) => (
  <div style={{position: 'absolute', left: 40, top: 0, width: w - 80, height: 64, display: 'flex', alignItems: 'center', gap: 26, borderBottom: `1.5px solid ${C.line}`, fontSize: 19}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800}}>
      <div style={{width: 24, height: 24, borderRadius: 7, background: `linear-gradient(135deg, #b08d5a, ${C.accent})`}} />
      Стройконтроль
    </div>
    {['Проекты', 'Задачи', 'Биржа', 'Люди', 'Уведомления'].map((n) => (
      <span key={n} style={{padding: '6px 14px', borderRadius: 10, background: n === active ? C.accentSoft : 'transparent', color: n === active ? C.accent : C.muted}}>
        {n}
        {n === 'Задачи' ? <span style={{marginLeft: 6, background: C.warn, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 15}}>4</span> : null}
      </span>
    ))}
    <div style={{flex: 1}} />
    <div style={{width: 36, height: 36, borderRadius: 99, background: C.accentSoft, color: C.accent, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{user[0]}</div>
    <div style={{lineHeight: 1.2, fontSize: 16}}>
      {user[1]}
      <div style={{color: C.muted, fontSize: 14}}>{user[2]}</div>
    </div>
  </div>
);

// ---------------- Экран проекта ----------------
const PW = 1400;
const PH = 1060;
const GRAPH: Rect = {x: 40, y: 300, w: 1320, h: 340};
const NW = 220;
const NH = 82;
const col = (i: number) => 26 + i * 262;
type St = 'done' | 'work' | 'wait' | 'overdue';
const nodes: {name: string; dates: string; st: St; c: number; y: number}[] = [
  {name: 'Договор и ТЗ', dates: '03.05 – 12.05', st: 'done', c: 0, y: 150},
  {name: 'Обмерные работы', dates: '13.05 – 26.05', st: 'done', c: 1, y: 92},
  {name: 'Исходные данные', dates: '13.05 – 11.06', st: 'done', c: 1, y: 208},
  {name: 'Концепция', dates: '27.05 – 15.06', st: 'done', c: 2, y: 150},
  {name: 'Проектная: АР и КР', dates: '16.06 – 22.07', st: 'work', c: 3, y: 92},
  {name: 'Инженерные разделы', dates: '16.06 – 27.07', st: 'work', c: 3, y: 208},
  {name: 'Сметная документация', dates: '28.07 – 10.08', st: 'wait', c: 4, y: 150},
];
const OVERDUE = 4;
const edges = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6],
];
const nodeRect = (i: number): Rect => ({x: GRAPH.x + col(nodes[i].c), y: GRAPH.y + nodes[i].y, w: NW, h: NH});
const CYCLO: Rect = {x: 40, y: 670, w: 1320, h: 360};
const cycloRows = [
  {n: 'АР', who: 'Бюро', s: 0.02, l: 0.34, p: 100},
  {n: 'КР', who: 'Бюро', s: 0.1, l: 0.4, p: 80},
  {n: 'ОВиК', who: 'АкваПроект', s: 0.3, l: 0.36, p: 60},
  {n: 'ВК', who: 'АкваПроект', s: 0.34, l: 0.34, p: 55},
  {n: 'ЭОМ', who: 'ЭлектроПроект', s: 0.38, l: 0.4, p: 40, late: true},
];

const STC: Record<St, string> = {done: C.done, work: C.accent, wait: C.faint, overdue: C.overdue};
const STL: Record<St, string> = {done: 'Завершён', work: 'В работе', wait: 'Ожидает', overdue: 'Просрочен'};

const ProjectComp: React.FC<ScreenProps> = ({overdueAt = 0, notStartedAt}) => {
  const {t, f, fps} = useT();
  const od = interpolate(t, [overdueAt, overdueAt + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = od > 0 ? 0.5 + 0.5 * Math.sin(f / 4) : 0;
  const bars = spring({frame: f - 4, fps, config: {damping: 20}});
  return (
    <div style={{position: 'relative', width: PW, height: PH, background: C.bg, fontFamily: FONT, color: C.ink}}>
      <TopBar active="Проекты" w={PW} />
      <div style={{position: 'absolute', left: 40, top: 84, fontSize: 16, color: C.muted}}>Проекты / Поликлиника на Лесной</div>
      <div style={{position: 'absolute', left: 40, top: 110, fontSize: 38, fontWeight: 800}}>Поликлиника на Лесной, капремонт</div>
      <div style={{position: 'absolute', left: 40, top: 160, fontSize: 18, color: C.muted}}>ГИП: Никитина Мария · субподрядчиков: 4 · ваша роль: ГИП</div>
      <div style={{position: 'absolute', right: 40, top: 112, display: 'flex', gap: 12, fontSize: 17}}>
        {['Чат проекта', 'Сроки этапов', 'Добавить этап'].map((b) => (
          <span key={b} style={{border: `1.5px solid ${C.line2}`, borderRadius: 12, padding: '10px 18px', background: C.panel}}>{b}</span>
        ))}
      </div>
      <Box r={{x: 40, y: 200, w: 1320, h: 84}} style={{display: 'flex', alignItems: 'center', gap: 0, padding: '0 26px'}}>
        {[
          ['4/7', 'этапов завершено', C.ink],
          ['2', 'в работе', C.ink],
          [od > 0.5 ? '1' : '0', 'просрочено', od > 0.5 ? C.overdue : C.ink],
          ['10.08', 'окончание по плану', C.ink],
        ].map(([v, l, c], i) => (
          <div key={i} style={{paddingRight: 40, marginRight: 40, borderRight: i < 3 ? `1.5px solid ${C.line}` : 'none'}}>
            <div style={{fontSize: 28, fontWeight: 700, color: c}}>{v}</div>
            <div style={{fontSize: 15, color: C.muted}}>{l}</div>
          </div>
        ))}
      </Box>
      <Box r={GRAPH}>
        <div style={{fontSize: 22, fontWeight: 800}}>График этапов</div>
        <div style={{fontSize: 15, color: C.muted, marginTop: 4}}>Стрелки показывают, какие этапы должны завершиться раньше</div>
        <div style={{position: 'absolute', left: 20, right: 20, top: 74, bottom: 18, borderRadius: 14, background: C.soft, backgroundImage: `radial-gradient(${C.line2} 1.4px, transparent 1.4px)`, backgroundSize: '20px 20px'}} />
      </Box>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={PW} height={PH}>
        {edges.map(([a, b], i) => {
          const A = nodeRect(a);
          const B = nodeRect(b);
          const red = a === OVERDUE && od > 0;
          const x1 = A.x + A.w;
          const y1 = A.y + A.h / 2;
          const x2 = B.x;
          const y2 = B.y + B.h / 2;
          return (
            <path key={i} d={`M${x1} ${y1} C${x1 + 24} ${y1}, ${x2 - 24} ${y2}, ${x2} ${y2}`} fill="none" stroke={red ? C.overdue : C.done} strokeOpacity={red ? 0.95 : 0.55} strokeWidth={red ? 3.5 : 2.5} strokeDasharray={red ? '8 6' : undefined} strokeDashoffset={red ? -f : 0} />
          );
        })}
      </svg>
      {nodes.map((n, i) => {
        const r = nodeRect(i);
        const st: St = i === OVERDUE && od > 0.5 ? 'overdue' : n.st;
        const isOd = i === OVERDUE && od > 0;
        const ns = i === 5 && notStartedAt !== undefined && t >= notStartedAt;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: 'border-box',
              background: isOd ? `color-mix(in srgb, ${C.overdue} ${12 * od}%, ${C.panel})` : C.panel,
              border: `1.5px solid ${isOd ? C.overdue : C.line2}`, borderLeft: `7px solid ${STC[st]}`, borderRadius: 12, padding: '12px 14px',
              boxShadow: isOd ? `0 0 0 ${4 + pulse * 7}px rgba(192,86,63,${0.2 * od})` : '0 2px 8px rgba(90,70,35,0.06)',
            }}
          >
            <div style={{fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{n.name}</div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 14, color: C.muted, marginTop: 8}}>
              <span>{n.dates}</span>
              <span style={{color: ns ? C.overdue : STC[st], fontWeight: 700}}>{ns ? 'Не начат' : STL[st]}</span>
            </div>
          </div>
        );
      })}
      {od > 0 ? (
        <div style={{position: 'absolute', left: nodeRect(OVERDUE).x + 10, top: nodeRect(OVERDUE).y - 30, transform: `scale(${od})`, transformOrigin: 'left bottom', background: C.overdue, color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 99, padding: '4px 12px'}}>
          Просрочен на 3 дня
        </div>
      ) : null}
      <Box r={CYCLO}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{fontSize: 22, fontWeight: 800}}>Циклограмма этапа</div>
          <div style={{fontSize: 16, color: C.accent, textDecoration: 'underline'}}>Графики выпуска — субподрядчиков</div>
        </div>
        <div style={{fontSize: 15, color: C.muted, marginTop: 4}}>
          Субподрядчиков: 4 · согласовано: 4 · <span style={{color: C.overdue}}>отстающих работ: 1</span> · из графиков выпуска разделов
        </div>
        <div style={{position: 'relative', marginTop: 16, border: `1.5px solid ${C.line}`, borderRadius: 12, overflow: 'hidden'}}>
          <div style={{display: 'flex', background: C.soft, height: 36, alignItems: 'center', fontSize: 14, color: C.muted}}>
            <div style={{width: 230, paddingLeft: 14}}>Раздел</div>
            {['июнь', 'июль', 'август', 'сентябрь'].map((m) => (
              <div key={m} style={{flex: 1, borderLeft: `1px solid ${C.line2}`, paddingLeft: 8}}>{m}</div>
            ))}
          </div>
          {cycloRows.map((r, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', height: 46, borderTop: `1px solid ${C.line}`}}>
              <div style={{width: 230, paddingLeft: 14, fontSize: 16}}>
                <b>{r.n}</b> <span style={{color: C.muted}}>· {r.who}</span>
              </div>
              <div style={{position: 'relative', flex: 1, height: '100%'}}>
                <div style={{position: 'absolute', left: `${r.s * 100}%`, top: 16, height: 14, width: `${r.l * 100 * bars}%`, borderRadius: 7, background: r.late ? C.overdue : C.accent, opacity: 0.25}} />
                <div style={{position: 'absolute', left: `${r.s * 100}%`, top: 16, height: 14, width: `${r.l * r.p * bars}%`, borderRadius: 7, background: r.late ? C.overdue : r.p === 100 ? C.done : C.accent}} />
              </div>
            </div>
          ))}
          <div style={{position: 'absolute', left: 230 + (1320 - 52 - 230) * 0.6, top: 36, bottom: 0, width: 2.5, background: C.overdue}} />
        </div>
      </Box>
    </div>
  );
};

export const PROJECT: ScreenDef = {
  w: PW,
  h: PH,
  Comp: ProjectComp,
  regions: {
    all: {x: 0, y: 0, w: PW, h: PH},
    head: {x: 30, y: 70, w: 1340, h: 220},
    kpi: {x: 40, y: 200, w: 1320, h: 84},
    graph: GRAPH,
    overdue: {...nodeRect(OVERDUE), y: nodeRect(OVERDUE).y - 34, h: NH + 34},
    engNode: nodeRect(5),
    overdueZone: {x: nodeRect(OVERDUE).x - 300, y: GRAPH.y + 60, w: 760, h: 270},
    cyclo: CYCLO,
    cycloLate: {x: CYCLO.x + 26, y: CYCLO.y + 290, w: CYCLO.w - 52, h: 50},
  },
};

// ---------------- Экран задачи ----------------
const TW = 1400;
const TH = 900;
const REVIEW: Rect = {x: 40, y: 220, w: 840, h: 300};
const TaskComp: React.FC<ScreenProps> = ({acceptAt = 1.5}) => {
  const {t, f, fps} = useT();
  const acc = t >= acceptAt;
  const s = spring({frame: f - Math.round(acceptAt * fps), fps, config: {damping: 12}});
  const press = interpolate(t, [acceptAt - 0.12, acceptAt, acceptAt + 0.15], [1, 0.93, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'relative', width: TW, height: TH, background: C.bg, fontFamily: FONT, color: C.ink}}>
      <TopBar active="Задачи" w={TW} />
      <div style={{position: 'absolute', left: 40, top: 84, fontSize: 16, color: C.muted}}>Задачи / Поликлиника на Лесной / Инженерные разделы</div>
      <div style={{position: 'absolute', left: 40, top: 110, fontSize: 38, fontWeight: 800}}>Раздел ЭОМ: рабочая документация</div>
      <div style={{position: 'absolute', left: 40, top: 166, display: 'flex', gap: 12, alignItems: 'center', fontSize: 18, color: C.muted}}>
        <span style={{background: acc ? C.done : C.accentSoft, color: acc ? '#fff' : C.accent, borderRadius: 99, padding: '4px 14px', fontWeight: 700, transform: `scale(${acc ? 0.8 + 0.2 * s : 1})`}}>
          {acc ? '✓ Принято' : 'На проверке'}
        </span>
        исполнитель: ЭлектроПроект · срок 27.07
      </div>
      <Box r={REVIEW} style={{border: `2px solid ${acc ? C.done : '#d9c79f'}`, background: acc ? '#f1f7f1' : C.panel}}>
        {acc ? (
          <div style={{display: 'flex', alignItems: 'center', gap: 24, height: '100%'}}>
            <svg width={110} height={110} viewBox="0 0 44 44">
              <circle cx={22} cy={22} r={21 * Math.min(1, s * 1.5)} fill={C.done} />
              <path d="M12 23 L19 30 L32 15" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34} strokeDashoffset={34 * (1 - Math.min(1, Math.max(0, s * 1.4 - 0.3)))} />
            </svg>
            <div>
              <div style={{fontSize: 34, fontWeight: 800, color: C.done}}>Работа принята</div>
              <div style={{fontSize: 19, color: C.muted, marginTop: 8}}>ГИП Никитина Мария · сегодня, 10:40</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{fontSize: 24, fontWeight: 800}}>Работа сдана на проверку</div>
            <div style={{fontSize: 17, color: C.muted, marginTop: 8}}>Примите работу или верните её исполнителю — тогда напишите, что доделать.</div>
            <div style={{display: 'flex', gap: 18, marginTop: 30}}>
              <div style={{background: C.accent, color: C.accentInk, borderRadius: 14, padding: '18px 30px', fontSize: 22, fontWeight: 700, transform: `scale(${press})`}}>Принять работу</div>
              <div style={{border: `1.5px solid ${C.line2}`, color: C.overdue, borderRadius: 14, padding: '18px 26px', fontSize: 22}}>Вернуть на доработку</div>
            </div>
            <div style={{marginTop: 26, border: `1.5px solid ${C.line2}`, borderRadius: 12, height: 60, padding: '14px 16px', fontSize: 17, color: C.faint}}>Что нужно доделать</div>
          </>
        )}
      </Box>
      <Box r={{x: 40, y: 550, w: 840, h: 300}}>
        <div style={{fontSize: 22, fontWeight: 800}}>Документы</div>
        {['ЭОМ_РД_изм2.pdf · 14 листов', 'Схемы щитов.pdf', 'Расчёт нагрузок.xlsx'].map((d) => (
          <div key={d} style={{display: 'flex', gap: 12, alignItems: 'center', fontSize: 18, padding: '16px 0', borderBottom: `1px solid ${C.line}`}}>
            <span style={{width: 34, height: 40, borderRadius: 6, background: C.accentSoft, display: 'inline-block'}} />
            <span style={{color: C.accent, textDecoration: 'underline'}}>{d}</span>
          </div>
        ))}
      </Box>
      <Box r={{x: 910, y: 220, w: 450, h: 300}}>
        <div style={{fontSize: 22, fontWeight: 800}}>Вопросы по задаче</div>
        <div style={{fontSize: 18, marginTop: 18, lineHeight: 1.35}}>Когда будут данные по мощности?</div>
        <div style={{fontSize: 15, color: C.muted, marginTop: 4}}>Никитина Мария · вчера</div>
        <div style={{marginTop: 14, background: C.soft, borderRadius: 12, padding: '12px 14px', fontSize: 17, lineHeight: 1.35}}>
          Получили от заказчика, схемы щитов сдаём в среду
          <div style={{fontSize: 14, color: C.muted, marginTop: 4}}>ЭлектроПроект · ответ исполнителя</div>
        </div>
      </Box>
      <Box r={{x: 910, y: 550, w: 450, h: 300}}>
        <div style={{fontSize: 22, fontWeight: 800}}>История</div>
        {[
          ['ЭлектроПроект сдал работу на проверку', '09:12'],
          ...(acc ? [['Никитина Мария приняла работу', '10:40']] : []),
        ].map(([a, b]) => (
          <div key={a} style={{fontSize: 17, padding: '14px 0', borderBottom: `1px solid ${C.line}`}}>
            {a}
            <div style={{fontSize: 14, color: C.muted}}>сегодня, {b}</div>
          </div>
        ))}
      </Box>
    </div>
  );
};

export const TASK: ScreenDef = {
  w: TW,
  h: TH,
  Comp: TaskComp,
  regions: {
    all: {x: 0, y: 0, w: TW, h: TH},
    head: {x: 30, y: 70, w: 1000, h: 140},
    review: REVIEW,
    accept: {x: REVIEW.x + 20, y: REVIEW.y + 100, w: 560, h: 100},
    status: {x: 30, y: 150, w: 640, h: 56},
    meta: {x: 30, y: 100, w: 820, h: 106},
    questions: {x: 910, y: 220, w: 450, h: 300},
  },
};

// ---------------- Проекты бюро (вид руководителя) ----------------
const BW = 1400;
const BH = 1000;
const ROW_Y = 330;
const ROW_H = 96;
const COLS = {name: 66, gip: 520, stage: 760, stages: 1060, due: 1180};
const bureauRows = [
  {n: 'Поликлиника на Лесной, капремонт', g: 'Никитина Мария', st: 'Проектная: АР и КР', p: '4/7', d: '10.08', late: true},
  {n: 'Стоматология на Мира', g: 'Орлов Денис', st: 'Концепция', p: '2/6', d: '15.09'},
  {n: 'Детская поликлиника, реконструкция', g: 'Никитина Мария', st: 'Инженерные разделы', p: '5/8', d: '30.08', late: true},
  {n: 'Лаборатория, перепланировка', g: 'Ким Анна', st: 'Сметная документация', p: '6/7', d: '01.08'},
  {n: 'Медцентр, новый филиал', g: 'Никитина Мария', st: 'Обмерные работы', p: '1/7', d: '20.11'},
  {n: 'Клиника на Садовой, ремонт', g: 'Орлов Денис', st: 'Экспертиза', p: '7/8', d: '05.08'},
];
const rowRect = (i: number): Rect => ({x: 52, y: ROW_Y + i * ROW_H, w: 1296, h: ROW_H});
const BureauComp: React.FC<ScreenProps> = () => {
  const {f, fps} = useT();
  return (
    <div style={{position: 'relative', width: BW, height: BH, background: C.bg, fontFamily: FONT, color: C.ink}}>
      <TopBar active="Проекты" w={BW} user={['РБ', 'Руководитель бюро', 'вся организация']} />
      <div style={{position: 'absolute', left: 40, top: 96, fontSize: 40, fontWeight: 800}}>Проекты бюро</div>
      <div style={{position: 'absolute', left: 40, top: 150, fontSize: 19, color: C.muted}}>
        Проектов: 6 · ГИПов: 3 · <span style={{color: C.overdue}}>просрочено этапов: 2</span>
      </div>
      <div style={{position: 'absolute', right: 40, top: 100, background: C.accent, color: C.accentInk, borderRadius: 12, padding: '12px 22px', fontSize: 18, fontWeight: 700}}>Новый проект</div>
      <Box r={{x: 40, y: 210, w: 1320, h: 720}} style={{padding: 0}}>
        <div />
      </Box>
      <div style={{position: 'absolute', top: 262, left: 0, width: BW, fontSize: 16, color: C.muted}}>
        <span style={{position: 'absolute', left: COLS.name}}>Проект</span>
        <span style={{position: 'absolute', left: COLS.gip}}>ГИП</span>
        <span style={{position: 'absolute', left: COLS.stage}}>Сейчас в работе</span>
        <span style={{position: 'absolute', left: COLS.stages}}>Этапы</span>
        <span style={{position: 'absolute', left: COLS.due}}>Окончание</span>
      </div>
      {bureauRows.map((r, i) => {
        const s = spring({frame: f - 3 - i * 3, fps, config: {damping: 18}});
        const y = ROW_Y + i * ROW_H;
        return (
          <div key={i} style={{position: 'absolute', left: 52, top: y, width: 1296, height: ROW_H, borderTop: `1.5px solid ${C.line}`, background: r.late ? 'rgba(192,86,63,0.07)' : 'transparent', opacity: s}}>
            <div style={{position: 'absolute', left: COLS.name - 52, top: 22, fontSize: 21, fontWeight: 700, color: C.accent, textDecoration: 'underline', width: 440}}>{r.n}</div>
            <div style={{position: 'absolute', left: COLS.name - 52, top: 54, fontSize: 15, color: C.muted}}>{r.late ? '' : 'в срок'}</div>
            <div style={{position: 'absolute', left: COLS.gip - 52, top: 30, fontSize: 19}}>{r.g}</div>
            <div style={{position: 'absolute', left: COLS.stage - 52, top: 22, fontSize: 19}}>{r.st}</div>
            {r.late ? <div style={{position: 'absolute', left: COLS.stage - 52, top: 52, fontSize: 15, color: '#fff', background: C.overdue, borderRadius: 99, padding: '2px 10px'}}>просрочен этап</div> : null}
            <div style={{position: 'absolute', left: COLS.stages - 52, top: 28, fontSize: 22, fontWeight: 700}}>{r.p}</div>
            <div style={{position: 'absolute', left: COLS.due - 52, top: 28, fontSize: 21, color: r.late ? C.overdue : C.ink, fontWeight: r.late ? 700 : 400}}>{r.d}</div>
          </div>
        );
      })}
    </div>
  );
};

export const BUREAU: ScreenDef = {
  w: BW,
  h: BH,
  Comp: BureauComp,
  regions: {
    all: {x: 0, y: 0, w: BW, h: BH},
    table: {x: 40, y: 240, w: 1320, h: 690},
    stageCol: {x: COLS.stage - 14, y: 250, w: 290, h: 6 * ROW_H + 80},
    gipCol: {x: COLS.gip - 14, y: 250, w: 230, h: 6 * ROW_H + 80},
    late1: rowRect(0),
    late2: rowRect(2),
    lateRows: {x: 52, y: ROW_Y, w: 1296, h: ROW_H * 3},
  },
};

export const SCREENS: Record<string, ScreenDef> = {project: PROJECT, task: TASK, bureau: BUREAU};
