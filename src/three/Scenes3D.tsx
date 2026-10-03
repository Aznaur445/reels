// 3D-сцены истории (стиль второго референса). Время — секунды от начала сцены.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {Box, Bubble3D, Desk, Fire, Key, Person, Plot, World, pop, roundRect, useCanvasTex, useSec, wrapText} from './kit';

const ACC = '#ff5a2e';
const NAVY = '#2b3f6b';

type B = {text: string; at: number; until?: number};

// ---------- экран телефона (текстура) ----------
type Line = {title: string; text?: string; at: number};
const usePhoneScreen = (header: string, sub: string, lines: Line[], t: number, big?: {n: number; label: string}) => {
  const visible = lines.filter((l) => t >= l.at).length;
  const key = `${header}|${visible}|${big ? big.n : ''}`;
  return useCanvasTex(
    360,
    720,
    (g) => {
      g.fillStyle = '#111c33';
      g.fillRect(0, 0, 360, 720);
      g.fillStyle = '#05080f';
      roundRect(g, 120, 14, 120, 26, 13);
      g.fill();
      g.fillStyle = '#fff';
      g.font = '800 26px Manrope, sans-serif';
      g.fillText(header, 24, 92);
      g.fillStyle = '#9fb0d0';
      g.font = '600 18px Manrope, sans-serif';
      g.fillText(sub, 24, 118);
      if (big) {
        g.textAlign = 'center';
        g.fillStyle = ACC;
        g.font = '900 150px Montserrat, sans-serif';
        g.fillText(String(big.n), 180, 400);
        g.fillStyle = '#fff';
        g.font = '800 30px Manrope, sans-serif';
        g.fillText(big.label, 180, 450);
        g.textAlign = 'left';
      }
      let y = 150;
      lines.slice(0, visible).forEach((l) => {
        g.font = '800 22px Manrope, sans-serif';
        const tl = wrapText(g, l.title, 290);
        g.font = '600 19px Manrope, sans-serif';
        const xl = l.text ? wrapText(g, l.text, 290) : [];
        const h = 26 + tl.length * 28 + xl.length * 25;
        g.fillStyle = '#22355e';
        roundRect(g, 16, y, 328, h, 18);
        g.fill();
        g.fillStyle = '#fff';
        g.font = '800 22px Manrope, sans-serif';
        tl.forEach((s, i) => g.fillText(s, 32, y + 32 + i * 28));
        g.fillStyle = '#d7e1f5';
        g.font = '600 19px Manrope, sans-serif';
        xl.forEach((s, i) => g.fillText(s, 32, y + 32 + tl.length * 28 + i * 25));
        y += h + 12;
      });
    },
    key,
  );
};

const Phone: React.FC<{pos: [number, number, number]; rot?: [number, number, number]; screen: THREE.Texture; buzz?: number; scale?: number}> = ({pos, rot = [-Math.PI / 2, 0, 0], screen, buzz = 0, scale = 1}) => {
  const {f} = useSec();
  const j = buzz ? Math.sin(f * 2.4) * 0.03 * buzz : 0;
  return (
    <group position={[pos[0] + j, pos[1], pos[2]]} rotation={[rot[0], rot[1] + j * 2, rot[2]]} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[0.72, 1.44, 0.06]} />
        <meshStandardMaterial color="#05080f" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.66, 1.36]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------- 1. Кабинет: руководитель, телефон, ГИП ----------
export const Office3D: React.FC<{dur: number; me?: B[]; gip?: B[]; showGip?: boolean; phone?: {header: string; sub?: string; lines: Line[]}; keys?: Key[]}> = ({me = [], gip = [], showGip = true, phone, keys}) => {
  const {t} = useSec();
  const scr = usePhoneScreen(phone?.header ?? 'Сообщения', phone?.sub ?? '', phone?.lines ?? [], t);
  const laptop = useCanvasTex(256, 160, (g) => {
    g.fillStyle = '#f6f1e6';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#8a6a3f';
    g.fillRect(0, 0, 256, 18);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i === 2 ? '#c0563f' : '#c8bba0';
      g.fillRect(16, 32 + i * 20, 120 + ((i * 37) % 90), 9);
    }
  }, 'lap');
  const k: Key[] = keys ?? [
    {t: 0, pos: [-3.2, 3.4, 7.4], look: [0.6, 1.5, 0]},
    {t: 2.5, pos: [0.5, 2.8, 5.8], look: [0.7, 1.6, -0.1]},
    {t: 6, pos: [1.8, 2.6, 5.0], look: [0.7, 1.6, -0.2]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k}>
        <Plot w={9} d={7} />
        <Desk pos={[0, 0, 0]} screen={laptop} />
        <Person pos={[-0.15, 0, -1.05]} color={NAVY} />
        {phone ? <Phone pos={[0.75, 0.83, 0.25]} screen={scr} rot={[-Math.PI / 2, 0, -0.3]} scale={0.55} buzz={phone.lines.some((l) => t >= l.at && t < l.at + 0.6) ? 1 : 0} /> : null}
        {showGip ? <Person pos={[1.55, 0, 0.9]} rot={-1.9} color="#e8e2d4" /> : null}
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} pos={[-0.75, 0.81 + i * 0.03, 0.15]} size={[0.42, 0.025, 0.56]} color="#fbf8f1" rot={[0, i * 0.15, 0]} />
        ))}
        {me.map((b, i) => (
          <Bubble3D key={`m${i}`} {...b} pos={[0.15, 2.65, -1.0]} scale={0.95} color="#4f7bea" ink="#ffffff" />
        ))}
        {gip.map((b, i) => (
          <Bubble3D key={`g${i}`} {...b} pos={[1.55, 2.5, 0.9]} scale={0.95} />
        ))}
      </World>
    </AbsoluteFill>
  );
};

// ---------- 2. Календарь: дни переворачиваются, срок горит ----------
export const Calendar3D: React.FC<{dur: number; days?: string[]; deadline?: number; stepAt?: number[]; overdueAt?: number; label?: string; fire?: boolean}> = ({
  days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
  deadline = 4,
  stepAt = [0.2, 0.5, 0.8, 1.1, 1.4],
  overdueAt,
  label = 'СРОК',
  fire = true,
}) => {
  const {t} = useSec();
  const od = overdueAt !== undefined && t >= overdueAt;
  const k: Key[] = [
    {t: 0, pos: [-4.5, 2.2, 6.5], look: [0, 1.6, 0]},
    {t: 2.2, pos: [0.5, 1.9, 5.2], look: [0.4, 1.7, 0]},
    {t: 5, pos: [1.4, 1.8, 4.2], look: [0.6, 1.7, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k} shake={od ? 0.01 : 0}>
        <Plot w={10} d={6} />
        {days.map((d, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = -2.25 + col * 1.5;
          const y = 2.6 - row * 1.5;
          const flipped = stepAt[i] !== undefined && t >= stepAt[i];
          const isDl = i === deadline;
          const s = flipped || isDl ? Math.max(0.001, pop(t, isDl ? 0 : stepAt[i], 0.3)) : 1;
          return <DayTile key={d} x={x} y={y} text={d} sub={isDl ? label : ''} state={isDl ? (od ? 'fire' : 'dl') : flipped ? 'past' : 'future'} s={s} />;
        })}
        {od && fire ? <Fire pos={[-2.25 + (deadline % 4) * 1.5, 2.0 + (deadline < 4 ? 1.5 : 0) - 0.9, 0.5]} size={0.55} from={overdueAt} /> : null}
        <Person pos={[-3.4, 0, 1.6]} rot={0.6} color={NAVY} />
      </World>
    </AbsoluteFill>
  );
};
const DayTile: React.FC<{x: number; y: number; text: string; sub: string; state: 'past' | 'future' | 'dl' | 'fire'; s: number}> = ({x, y, text, sub, state, s}) => {
  const {t} = useSec();
  const bg = state === 'fire' ? ACC : state === 'past' ? '#2b3f6b' : state === 'dl' ? '#fff3ea' : '#f6f1e6';
  const fg = state === 'past' || state === 'fire' ? '#ffffff' : state === 'dl' ? ACC : '#2d2a24';
  const tex = useCanvasTex(256, 256, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.font = '900 104px Montserrat, sans-serif';
    g.fillText(text, 128, sub ? 140 : 162);
    if (sub) {
      g.font = '900 34px Montserrat, sans-serif';
      g.fillText(sub, 128, 205);
    }
    if (state === 'past') {
      g.strokeStyle = ACC;
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(40, 40);
      g.lineTo(216, 216);
      g.stroke();
    }
  }, `${text}${sub}${state}`);
  const glow = state === 'fire' ? 0.5 + 0.5 * Math.sin(t * 10) : 0;
  return (
    <group position={[x, y, 0]} rotation={[state === 'past' ? 0 : 0, 0, 0]} scale={s}>
      <mesh castShadow>
        <boxGeometry args={[1.3, 1.3, 0.18]} />
        <meshStandardMaterial color={bg} emissive={state === 'fire' ? ACC : '#000'} emissiveIntensity={glow * 0.6} />
      </mesh>
      <mesh position={[0, 0, 0.095]}>
        <planeGeometry args={[1.26, 1.26]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------- 3. Проект-«башня»: этапы ложатся этажами, просрочка сдвигает всё выше ----------
export const Stages3D: React.FC<{dur: number; stages: {name: string; at: number}[]; overdue?: number; overdueAt?: number; shiftAt?: number; links?: boolean}> = ({
  stages,
  overdue = -1,
  overdueAt = 99,
  shiftAt = 99,
}) => {
  const {t} = useSec();
  const n = stages.length;
  const topY = 0.4 + n * 0.62;
  const k: Key[] = [
    {t: 0, pos: [-5, 1.5, 7], look: [0, 1.2, 0]},
    {t: stages[n - 1].at + 0.6, pos: [3.5, topY * 0.8 + 1, 7.5], look: [0, topY * 0.5, 0]},
    {t: stages[n - 1].at + 4, pos: [5.5, topY * 0.7, 5], look: [0, topY * 0.5, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k} shake={t > overdueAt && t < overdueAt + 0.5 ? 0.03 : 0}>
        <Plot w={8} d={8} />
        {stages.map((st, i) => {
          if (t < st.at) return null;
          const fall = Math.min(1, (t - st.at) / 0.35);
          const y0 = 0.4 + i * 0.62;
          const y = y0 + (1 - fall) * (1 - fall) * 4;
          const red = i === overdue && t >= overdueAt;
          const shifted = overdue >= 0 && i > overdue && t >= shiftAt;
          const sp = shifted ? Math.min(1, (t - shiftAt - (i - overdue) * 0.12) / 0.4) : 0;
          return <Floor key={i} y={y} name={st.name} red={red} dx={Math.max(0, sp) * 0.9} tilt={Math.max(0, sp) * 0.08} />;
        })}
      </World>
    </AbsoluteFill>
  );
};
const Floor: React.FC<{y: number; name: string; red: boolean; dx: number; tilt: number}> = ({y, name, red, dx, tilt}) => {
  const bg = red ? '#ff5a2e' : '#f6f1e6';
  const tex = useCanvasTex(1024, 160, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 160);
    g.fillStyle = red ? '#ffffff' : '#2d2a24';
    g.font = '900 78px Montserrat, sans-serif';
    g.textAlign = 'center';
    g.fillText(name.toUpperCase(), 512, 108);
  }, name + red);
  return (
    <group position={[dx, y, 0]} rotation={[0, 0, -tilt]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.56, 1.8]} />
        <meshStandardMaterial color={bg} emissive={red ? '#ff5a2e' : '#000'} emissiveIntensity={red ? 0.35 : 0} />
      </mesh>
      <mesh position={[0, 0, 0.905]}>
        <planeGeometry args={[3.56, 0.52]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------- 4. Планёрка: круглый стол, ГИПы по очереди ----------
export const Meeting3D: React.FC<{dur: number; bubbles: {seat: number; text: string; at: number}[]}> = ({bubbles}) => {
  const {t} = useSec();
  const seats = [0, 1, 2, 3, 4].map((i) => {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 5;
    return [Math.cos(a) * 2.1, Math.sin(a) * 2.1, a] as const;
  });
  const k: Key[] = [
    {t: 0, pos: [0, 8, 7.5], look: [0, 1.0, 0]},
    {t: 3, pos: [3.2, 6, 6.5], look: [0, 1.2, 0]},
    {t: 6, pos: [5.5, 5, 3.5], look: [0, 1.2, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k}>
        <Plot w={10} d={9} />
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.1, 48]} />
          <meshStandardMaterial color="#8a6a3f" />
        </mesh>
        <mesh castShadow position={[0, 0.37, 0]}>
          <cylinderGeometry args={[0.15, 0.3, 0.74, 16]} />
          <meshStandardMaterial color="#5b4630" />
        </mesh>
        <Box pos={[0.2, 0.82, 0.6]} size={[0.5, 0.03, 0.7]} color="#fbf8f1" rot={[0, 0.3, 0]} />
        {seats.map(([x, z, a], i) => (
          <Person key={i} pos={[x, 0, z]} rot={-a - Math.PI / 2 + Math.PI} color={i === 0 ? NAVY : '#e8e2d4'} bob={bubbles.some((b) => b.seat === i && t >= b.at && t < b.at + 1) ? 1 : 0} />
        ))}
        {bubbles.map((b, i) => {
          const [x, z] = seats[b.seat];
          const next = bubbles[i + 1]?.at ?? 999;
          return <Bubble3D key={i} text={b.text} at={b.at} until={next + 0.1} pos={[x * 0.6, 2.6, z * 0.6]} scale={0.95} />;
        })}
        <ClockMesh pos={[0, 2.8, -3.6]} speed={4} size={0.9} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- часы ----------
const ClockMesh: React.FC<{pos: [number, number, number]; speed?: number; size?: number}> = ({pos, speed = 1, size = 1}) => {
  const {t} = useSec();
  const face = useCanvasTex(512, 512, (g) => {
    g.fillStyle = '#f6f1e6';
    g.beginPath();
    g.arc(256, 256, 250, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = ACC;
    g.lineWidth = 22;
    g.stroke();
    g.strokeStyle = '#2d2a24';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.lineWidth = i % 3 ? 6 : 12;
      g.beginPath();
      g.moveTo(256 + Math.sin(a) * 200, 256 - Math.cos(a) * 200);
      g.lineTo(256 + Math.sin(a) * 230, 256 - Math.cos(a) * 230);
      g.stroke();
    }
  }, 'clock');
  const m = -t * Math.PI * 2 * speed;
  return (
    <group position={pos} scale={size}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.12, 48]} />
        <meshStandardMaterial color="#2d2a24" />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <circleGeometry args={[0.98, 48]} />
        <meshBasicMaterial map={face} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.09]} rotation={[0, 0, m / 12]}>
        <boxGeometry args={[0.08, 0.55, 0.02]} />
        <meshBasicMaterial color="#2d2a24" />
      </mesh>
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, m]}>
        <boxGeometry args={[0.05, 0.8, 0.02]} />
        <meshBasicMaterial color={ACC} />
      </mesh>
    </group>
  );
};
export const Clock3D: React.FC<{dur: number; speed?: number}> = ({speed = 2}) => {
  const k: Key[] = [
    {t: 0, pos: [-3.5, 1.8, 8.5], look: [0, 1.6, 0]},
    {t: 3.5, pos: [0.8, 2.0, 7.0], look: [0, 1.8, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k}>
        <Plot w={8} d={6} />
        <ClockMesh pos={[0, 2.1, 0]} speed={speed} size={1.6} />
        <Box pos={[0, 0.25, 0]} size={[0.4, 0.5, 0.4]} color="#5b4630" />
        <Person pos={[-1.9, 0, 1]} rot={0.7} color={NAVY} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- 5. Отпуск: остров, пальма, телефон с пропущенными ----------
export const Vacation3D: React.FC<{dur: number; buzzAt?: number; count?: number; label?: string}> = ({buzzAt = 1, count = 23, label = 'пропущенных'}) => {
  const {t} = useSec();
  const n = Math.max(0, Math.min(count, Math.floor((t - buzzAt) * 10)));
  const scr = usePhoneScreen('Работа', 'звонки и сообщения', [], t, t >= buzzAt ? {n, label} : undefined);
  const k: Key[] = [
    {t: 0, pos: [6, 6, 9], look: [0, 0.4, 0]},
    {t: buzzAt + 0.3, pos: [2.2, 2.6, 3.4], look: [0.6, 0.7, 0.4]},
    {t: buzzAt + 3, pos: [1.2, 2.2, 1.9], look: [0.75, 0.7, 0.45]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k} ground="none">
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color={`hsl(${198 + Math.sin(t) * 3}, 70%, 48%)`} roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh receiveShadow castShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[4, 4.4, 0.3, 48]} />
          <meshStandardMaterial color="#f2d59b" roughness={1} />
        </mesh>
        <Palm pos={[-2, 0.2, -1.5]} />
        <group position={[0.6, 0.2, 0.3]}>
          <Box pos={[0, 0.3, 0]} size={[0.9, 0.08, 2.0]} color="#ffffff" />
          <Box pos={[0, 0.55, -0.85]} size={[0.9, 0.5, 0.08]} color="#ffffff" rot={[-0.5, 0, 0]} />
          <Box pos={[0, 0.33, 0]} size={[0.92, 0.04, 2.02]} color={ACC} />
        </group>
        <Phone pos={[0.75, 0.62, 0.45]} screen={scr} scale={0.6} buzz={t >= buzzAt ? 1 : 0} />
        <mesh position={[3, 0.25, 1.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
          <meshStandardMaterial color="#f6f1e6" />
        </mesh>
        <mesh position={[3, 1.3, 1.5]} castShadow>
          <coneGeometry args={[1.2, 0.5, 16, 1, true]} />
          <meshStandardMaterial color={ACC} side={THREE.DoubleSide} />
        </mesh>
      </World>
    </AbsoluteFill>
  );
};
const Palm: React.FC<{pos: [number, number, number]}> = ({pos}) => {
  const {t} = useSec();
  return (
    <group position={pos}>
      {Array.from({length: 7}).map((_, i) => (
        <mesh key={i} castShadow position={[i * 0.06, 0.25 + i * 0.42, 0]} rotation={[0, 0, -0.08]}>
          <cylinderGeometry args={[0.14 - i * 0.01, 0.16 - i * 0.01, 0.44, 10]} />
          <meshStandardMaterial color="#8a6a3f" />
        </mesh>
      ))}
      {Array.from({length: 7}).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={`l${i}`} castShadow position={[0.42 + Math.cos(a) * 0.7, 3.0 + Math.sin(t * 1.5 + i) * 0.04, Math.sin(a) * 0.7]} rotation={[Math.sin(a) * 0.6, -a, Math.cos(a) * 0.6 - 0.2]}>
            <boxGeometry args={[1.6, 0.04, 0.35]} />
            <meshStandardMaterial color="#3f9a4a" />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------- 6. Город проектов: рост, «?» над каждым, один горит ----------
export const City3D: React.FC<{dur: number; total?: number; from?: number; growAt?: number; fireIndex?: number; fireAt?: number; question?: boolean; keys?: Key[]}> = ({
  total = 10,
  from = 10,
  growAt = 99,
  fireIndex = -1,
  fireAt = 99,
  question = false,
  keys,
}) => {
  const {t} = useSec();
  const cols = 5;
  const pts = Array.from({length: total}).map((_, i) => [(i % cols) * 1.6 - 3.2, Math.floor(i / cols) * 2.0 - 1.0, 1.0 + ((i * 37) % 5) * 0.35] as const);
  const k: Key[] = keys ?? [
    {t: 0, pos: [-6, 5, 8], look: [0, 0.8, 0]},
    {t: 3, pos: [2, 6.5, 7], look: [0, 0.6, 0]},
    {t: 6, pos: [5, 4, 5], look: [0, 1, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k}>
        <Plot w={10} d={6} />
        {pts.map(([x, z, h], i) => {
          const appearAt = i < from ? -1 : growAt + (i - from) * 0.15;
          const s = appearAt < 0 ? 1 : pop(t, appearAt, 0.3);
          if (s <= 0) return null;
          const burning = i === fireIndex && t >= fireAt;
          return (
            <group key={i} position={[x, 0, z]} scale={[1, Math.max(0.001, s), 1]}>
              <Box pos={[0, h / 2, 0]} size={[1.0, h, 1.0]} color={burning ? '#ff5a2e' : '#f6f1e6'} emissive={burning ? '#ff5a2e' : undefined} ei={burning ? 0.4 : 0} />
              <Box pos={[0, h + 0.05, 0]} size={[1.08, 0.1, 1.08]} color="#8a6a3f" />
              {Array.from({length: Math.floor(h / 0.45)}).map((_, w) => (
                <Box key={w} pos={[0, 0.35 + w * 0.45, 0.51]} size={[0.7, 0.18, 0.02]} color="#6fa8e6" />
              ))}
              {burning ? <Fire pos={[0, h + 0.1, 0]} size={1.1} from={fireAt} /> : null}
              {question && !(fireAt <= t) ? <Bubble3D text="?" at={0.1 + i * 0.05} pos={[0, h + 0.9, 0]} scale={0.55} /> : null}
            </group>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};

// ---------- 7. Телефон на столе крупно (сверху) ----------
export const Phone3D: React.FC<{dur: number; header: string; sub?: string; lines: Line[]}> = ({header, sub = '', lines}) => {
  const {t} = useSec();
  const scr = usePhoneScreen(header, sub, lines, t);
  const k: Key[] = [
    {t: 0, pos: [0.8, 3.6, 2.2], look: [0, 0.8, 0]},
    {t: 4, pos: [0.25, 2.3, 0.9], look: [0, 0.8, 0]},
  ];
  return (
    <AbsoluteFill>
      <World keys={k}>
        <Box pos={[0, 0.4, 0]} size={[4, 0.8, 3]} color="#8a6a3f" />
        <Phone pos={[0, 0.84, 0]} screen={scr} rot={[-Math.PI / 2, 0, 0.12]} scale={1} buzz={lines.some((l) => t >= l.at && t < l.at + 0.5) ? 1 : 0} />
        <Box pos={[-1.2, 0.83, 0.4]} size={[0.6, 0.04, 0.8]} color="#fbf8f1" rot={[0, 0.3, 0]} />
        <mesh castShadow position={[1.3, 0.98, -0.6]}>
          <cylinderGeometry args={[0.2, 0.17, 0.32, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </World>
    </AbsoluteFill>
  );
};
