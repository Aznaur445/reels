// Реалистичные сцены историй. Время — секунды от начала сцены.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {roundRect, useCanvasTex} from './kit';
import {Chair, Desk, Human, Key, M, Phone, Plant, RealWorld, Room, Say, Shelf, mat, useScreen, useSec} from './real';

type SayT = {who: string; text: string; at: number; until?: number};
type V3 = [number, number, number];

const LOOKS = {
  me: {top: '#1f2f52', pants: '#1c1f26', tie: '#8a2f2a', jacket: true, hair: '#2a1d16'},
  client: {top: '#2b2b2e', pants: '#202125', tie: '#3b4a6b', jacket: true, hair: '#6b6b6b', skin: '#d9a888'},
  a: {top: '#e9e6e0', pants: '#2f3440', hair: '#3b2a20'},
  b: {top: '#6e7a8a', pants: '#2a2d33', hair: '#1c1410', long: true, skin: '#e8c0a0'},
  c: {top: '#3d4b3f', pants: '#2a2d33', hair: '#5a3b22'},
  d: {top: '#8a3b33', pants: '#24262b', hair: '#c49a5a', long: true, skin: '#f0c8a8'},
  e: {top: '#d8d2c6', pants: '#3a3d45', hair: '#2a1d16'},
  gip: {top: '#7a7f88', pants: '#2a2d33', hair: '#3b2a20'},
};
type LookKey = keyof typeof LOOKS;

const monitorTex = (lines: string[], hi = -1) => (g: CanvasRenderingContext2D) => {
  g.fillStyle = '#f4f2ee';
  g.fillRect(0, 0, 680, 400);
  g.fillStyle = '#8a6a3f';
  g.fillRect(0, 0, 680, 36);
  g.font = '700 30px Manrope, sans-serif';
  lines.forEach((l, i) => {
    g.fillStyle = i === hi ? '#ffe2d6' : '#ffffff';
    roundRect(g, 24, 56 + i * 64, 632, 52, 10);
    g.fill();
    g.fillStyle = i === hi ? '#c0563f' : '#2d2a24';
    g.fillText('📁 ' + l, 44, 92 + i * 64);
  });
};

// ===== 1. Переговорная: 12 человек, вопрос заказчика =====
export const Meeting12: React.FC<{dur: number; keys: Key[]; says?: SayT[]; writeAt?: number; mePose?: string}> = ({keys, says = [], writeAt = 999, mePose = 'sit'}) => {
  const {t} = useSec();
  const seats: {p: V3; r: number; look: LookKey; who: string}[] = [];
  const looks: LookKey[] = ['a', 'b', 'c', 'd', 'e', 'gip', 'a', 'c', 'b', 'e'];
  for (let i = 0; i < 5; i++) {
    seats.push({p: [-0.95, 0, -2 + i * 1.0], r: Math.PI / 2, look: i === 2 ? 'me' : looks[i], who: i === 2 ? 'me' : `l${i}`});
    seats.push({p: [0.95, 0, -2 + i * 1.0], r: -Math.PI / 2, look: looks[i + 5], who: `r${i}`});
  }
  seats.push({p: [0, 0, -3.1], r: 0, look: 'client', who: 'client'});
  seats.push({p: [0, 0, 3.1], r: Math.PI, look: 'e', who: 'end'});
  const at = (who: string): V3 => {
    const s = seats.find((x) => x.who === who) ?? seats[0];
    return [Math.max(-0.35, Math.min(0.35, s.p[0] * 0.4)), who === "me" ? 1.68 : 1.85, s.p[2]];
  };
  const notepad = useCanvasTex(256, 360, (g) => {
    g.fillStyle = '#fbfaf5';
    g.fillRect(0, 0, 256, 360);
    g.strokeStyle = '#c9d4ea';
    for (let y = 40; y < 360; y += 24) {
      g.beginPath();
      g.moveTo(16, y);
      g.lineTo(240, y);
      g.stroke();
    }
    g.fillStyle = '#1d2a4a';
    g.font = 'italic 600 22px Manrope, sans-serif';
    const n = Math.max(0, Math.min(5, Math.floor((t - writeAt) * 2)));
    ['Рабочка по', 'инженерке —', 'сроков нет.', 'Подрядчик?', '«уточнит»'].slice(0, n).forEach((s, i) => g.fillText(s, 20, 58 + i * 48));
  }, `np${Math.max(0, Math.min(5, Math.floor((t - writeAt) * 2)))}`);
  return (
    <AbsoluteFill>
      <RealWorld keys={keys}>
        <Room w={8} d={10} />
        <M pos={[0, 0.74, 0]}>
          <boxGeometry args={[1.5, 0.05, 6.6]} />
          {mat.wood('#4a3324')}
        </M>
        {[-2.6, 0, 2.6].map((z) => (
          <M key={z} pos={[0, 0.36, z]}>
            <boxGeometry args={[0.5, 0.72, 0.5]} />
            {mat.metal('#2b2f36')}
          </M>
        ))}
        {seats.map((s, i) => (
          <group key={i}>
            <Chair pos={[s.p[0] * 1.12, 0, s.p[2] * (s.who === 'client' || s.who === 'end' ? 1.05 : 1)]} rot={s.r + Math.PI} />
            <Human pos={[s.p[0] * 1.12, 0, s.p[2] * (s.who === 'client' || s.who === 'end' ? 1.05 : 1)]} rot={s.r} pose={s.who === 'client' && t >= writeAt ? 'write' : s.who === 'me' ? (mePose as never) : 'sit'} look={LOOKS[s.look]} seed={i} talk={says.some((x) => x.who === s.who && t >= x.at && t < (x.until ?? x.at + 2))} />
            <M pos={[s.p[0] * 0.55, 0.77, s.p[2]]} rot={[0, 0.2 * (i % 3), 0]}>
              <boxGeometry args={[0.21, 0.004, 0.297]} />
              <meshStandardMaterial color="#fbfaf6" roughness={0.9} />
            </M>
          </group>
        ))}
        <mesh position={[0, 0.775, -2.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.25]} />
          <meshStandardMaterial map={notepad} roughness={0.9} />
        </mesh>
        <M pos={[0, 1.7, 4.9]}>
          <boxGeometry args={[2.2, 1.25, 0.06]} />
          {mat.plastic('#0d0e11')}
        </M>
        <Plant pos={[3.2, 0, -4]} s={1.4} />
        <Plant pos={[-3.2, 0, 4]} s={1.2} />
        {says.map((s, i) => (
          <Say key={i} text={s.text} at={s.at} until={s.until} pos={at(s.who)} me={s.who === "me"} s={0.8} />
        ))}
      </RealWorld>
    </AbsoluteFill>
  );
};

// ===== 2. Ночь перед экспертизой =====
export const NightDesk: React.FC<{dur: number; keys: Key[]; pose?: string; poseAt?: number; folders?: string[]; hi?: number; phone?: {title: string; text?: string; at: number}[]; clock?: string; says?: SayT[]}> = ({
  keys,
  pose = 'sitType',
  poseAt = 999,
  folders = ['КР_финал', 'КР_финал_2', 'КР_финал_исправленный'],
  hi = -1,
  phone = [],
  clock = '23:00',
  says = [],
}) => {
  const {t} = useSec();
  const mon = useCanvasTex(680, 400, monitorTex(folders, hi), folders.join() + hi);
  const scr = useScreen('Вызовы', 'сегодня', phone, t, '#ff5a2e');
  const clk = useCanvasTex(512, 200, (g) => {
    g.fillStyle = '#0b0c10';
    g.fillRect(0, 0, 512, 200);
    g.fillStyle = '#ff4d2e';
    g.font = '800 150px Manrope, sans-serif';
    g.textAlign = 'center';
    g.fillText(clock, 256, 160);
  }, clock);
  return (
    <AbsoluteFill>
      <RealWorld keys={keys} night>
        <Room w={8} d={8} night />
        <ambientLight intensity={0.06} />
        <Desk pos={[0, 0, 0]} screen={mon} lamp />
        <pointLight position={[0, 1.25, 0]} intensity={2.5} distance={2.5} color="#9fc1ff" />
        <Chair pos={[0, 0, 0.7]} rot={Math.PI} />
        <Human pos={[0, 0, 0.62]} rot={Math.PI} pose={(t >= poseAt ? pose : 'sitType') as never} look={LOOKS.me} />
        <Phone pos={[0.45, 0.765, 0.12]} rot={[-Math.PI / 2, 0, 0.3]} screen={scr} s={1.6} buzz={phone.some((p) => t >= p.at && t < p.at + 0.6)} />
        <M pos={[-1.5, 2.1, -3.85]}>
          <boxGeometry args={[0.9, 0.36, 0.05]} />
          {mat.plastic('#0b0c10')}
        </M>
        <mesh position={[-1.5, 2.1, -3.82]}>
          <planeGeometry args={[0.86, 0.32]} />
          <meshBasicMaterial map={clk} toneMapped={false} />
        </mesh>
        {says.map((s, i) => (
          <Say key={i} text={s.text} at={s.at} until={s.until} pos={[0, 1.95, 0.5]} me s={0.6} />
        ))}
      </RealWorld>
    </AbsoluteFill>
  );
};

// ===== 3. Ушёл ГИП: пустое место, коробка, новый человек в бумагах =====
export const EmptyDesk: React.FC<{dur: number; keys: Key[]; newAt?: number; papersAt?: number; says?: SayT[]}> = ({keys, newAt = 999, papersAt = 999, says = []}) => {
  const {t} = useSec();
  const mon = useCanvasTex(680, 400, (g) => {
    g.fillStyle = '#1a1c22';
    g.fillRect(0, 0, 680, 400);
  }, 'off');
  const pile = Math.max(0, Math.min(14, Math.floor((t - papersAt) * 6)));
  return (
    <AbsoluteFill>
      <RealWorld keys={keys}>
        <Room w={9} d={9} />
        <Desk pos={[0, 0, 0]} screen={mon} />
        <Chair pos={[0, 0, 0.75]} rot={Math.PI + 0.5} />
        {/* коробка с вещами */}
        <group position={[-0.45, 0.76, 0.05]}>
          <M pos={[0, 0.12, 0]}>
            <boxGeometry args={[0.42, 0.24, 0.32]} />
            <meshStandardMaterial color="#b98d5c" roughness={0.9} />
          </M>
          <M pos={[0.08, 0.3, 0]} rot={[0, 0, 0.2]}>
            <boxGeometry args={[0.14, 0.18, 0.02]} />
            {mat.plastic('#2b2f36')}
          </M>
          <Plant pos={[-0.1, 0.22, 0.02]} s={0.35} />
        </group>
        {t >= newAt ? <Human pos={[1.6, 0, 0.9]} rot={-2.2} pose={t >= papersAt ? 'headInHands' : 'stand'} look={LOOKS.gip} seed={3} /> : null}
        {t >= newAt ? <Desk pos={[1.7, 0, -0.3]} rot={-0.4} mugs={false} /> : null}
        {Array.from({length: pile}).map((_, i) => (
          <M key={i} pos={[1.6 + Math.sin(i) * 0.05, 0.77 + i * 0.02, -0.25 + Math.cos(i * 1.7) * 0.05]} rot={[0, i * 0.4, 0]}>
            <boxGeometry args={[0.24, 0.018, 0.32]} />
            <meshStandardMaterial color={i % 4 === 0 ? '#e9e2cf' : '#fbfaf6'} roughness={0.9} />
          </M>
        ))}
        <Shelf pos={[-3.3, 0, -1]} rot={Math.PI / 2} />
        <Plant pos={[3.2, 0, -3.6]} s={1.4} />
        {says.map((s, i) => (
          <Say key={i} text={s.text} at={s.at} until={s.until} pos={[1.6, 1.95, 0.9]} s={0.6} />
        ))}
      </RealWorld>
    </AbsoluteFill>
  );
};

// ===== 4. Всё через меня: очередь к столу руководителя =====
export const Queue: React.FC<{dur: number; keys: Key[]; queueAt?: number; n?: number; pose?: string; poseAt?: number; says?: SayT[]; buzzAt?: number; away?: boolean}> = ({keys, queueAt = 0, n = 6, pose = 'headInHands', poseAt = 999, says = [], buzzAt = 999, away = false}) => {
  const {t} = useSec();
  const looks: LookKey[] = ['gip', 'b', 'c', 'a', 'd', 'e', 'gip', 'c'];
  const scr = useScreen('Сообщения', 'непрочитанные', [{title: '+37 новых', at: buzzAt}], t);
  const mon = useCanvasTex(680, 400, monitorTex(['Проекты бюро', 'Входящие: 112', 'Задачи на сегодня: 41'], 1), 'q');
  const pile = Math.max(0, Math.min(16, Math.floor((t - queueAt) * 3)));
  return (
    <AbsoluteFill>
      <RealWorld keys={keys}>
        <Room w={9} d={11} />
        <Desk pos={[0, 0, -2.5]} screen={mon} />
        <Chair pos={[0, 0, -3.15]} />
        {away ? null : <Human pos={[0, 0, -3.1]} rot={0} pose={(t >= poseAt ? pose : 'sitType') as never} look={LOOKS.me} />}
        {Array.from({length: n}).map((_, i) => {
          const appear = queueAt + i * 0.35;
          if (t < appear) return null;
          const k = Math.min(1, (t - appear) / 0.4);
          return <Human key={i} pos={[Math.sin(i * 1.3) * 0.18, 0, -1.6 + i * 0.75 + (1 - k) * 1.2]} rot={Math.PI} pose={i % 3 === 1 ? 'armsCrossed' : i % 3 === 2 ? 'phone' : 'stand'} look={LOOKS[looks[i % looks.length]]} seed={i + 5} />;
        })}
        {Array.from({length: pile}).map((_, i) => (
          <M key={i} pos={[-0.45, 0.77 + i * 0.022, -2.45]} rot={[0, i * 0.3, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.3]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#ece5d2' : '#fbfaf6'} roughness={0.9} />
          </M>
        ))}
        <Phone pos={[0.5, 0.765, -2.35]} rot={[-Math.PI / 2, 0, -0.2]} screen={scr} s={1.6} buzz={t >= buzzAt} />
        <Shelf pos={[-3.8, 0, -3]} rot={Math.PI / 2} />
        <Plant pos={[3.6, 0, -4.5]} s={1.4} />
        {says.map((s, i) => (
          <Say key={i} text={s.text} at={s.at} until={s.until} pos={s.who === 'me' ? [0, 1.95, -3.1] : [0.3, 2.0, -1.6]} me={s.who === 'me'} s={0.65} />
        ))}
      </RealWorld>
    </AbsoluteFill>
  );
};

// ===== 5. Домино: раздел → акт → оплата → зарплата =====
export const Dominoes: React.FC<{dur: number; keys: Key[]; labels?: string[]; stuck?: number; fallAt?: number; calendar?: string}> = ({
  keys,
  labels = ['ОБМЕРЫ', 'КОНЦЕПЦИЯ', 'АР', 'КР', 'ЭОМ', 'АКТ', 'ОПЛАТА', 'ЗАРПЛАТА'],
  stuck = 4,
  fallAt = 0.8,
  calendar = 'ПЯТНИЦА',
}) => {
  const {t} = useSec();
  const cal = useCanvasTex(400, 400, (g) => {
    g.fillStyle = '#fbfaf6';
    g.fillRect(0, 0, 400, 400);
    g.fillStyle = '#c0563f';
    g.fillRect(0, 0, 400, 110);
    g.fillStyle = '#fff';
    g.font = '800 54px Manrope, sans-serif';
    g.textAlign = 'center';
    g.fillText('ЗАРПЛАТА', 200, 78);
    g.fillStyle = '#1d1f24';
    g.font = '900 72px Manrope, sans-serif';
    g.fillText(calendar, 200, 270);
  }, calendar);
  return (
    <AbsoluteFill>
      <RealWorld keys={keys}>
        <Room w={8} d={8} />
        <M pos={[0, 0.74, 0]}>
          <boxGeometry args={[3.6, 0.05, 1.4]} />
          {mat.wood('#6b4a33')}
        </M>
        {[-1.6, 1.6].map((x) => (
          <M key={x} pos={[x, 0.36, 0]}>
            <boxGeometry args={[0.06, 0.72, 1.2]} />
            {mat.metal('#2b2f36')}
          </M>
        ))}
        <group position={[0, 0.765, 0]} scale={1.7}>
        {labels.map((l, i) => (
          <Domino key={i} i={i} label={l} x={-0.9 + i * 0.2} fall={i < stuck ? Math.max(0, Math.min(1, (t - fallAt - i * 0.18) / 0.25)) : 0} stuck={i === stuck} red={i >= stuck} />
        ))}
        </group>
        <group position={[1.3, 0.77, -0.45]} rotation={[-0.35, -0.4, 0]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.02]} />
            <meshStandardMaterial map={cal} roughness={0.8} />
          </mesh>
        </group>
      </RealWorld>
    </AbsoluteFill>
  );
};
const Domino: React.FC<{i: number; label: string; x: number; fall: number; stuck: boolean; red: boolean}> = ({label, x, fall, stuck, red}) => {
  const {t} = useSec();
  const tx = useCanvasTex(160, 320, (g) => {
    g.fillStyle = stuck ? '#ff5a2e' : red ? '#e8e2d4' : '#fbfaf6';
    g.fillRect(0, 0, 160, 320);
    g.fillStyle = stuck ? '#fff' : '#1d1f24';
    g.font = '800 30px Manrope, sans-serif';
    g.save();
    g.translate(80, 160);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.fillText(label, 0, 10);
    g.restore();
  }, label + stuck + red);
  const wob = stuck ? Math.sin(t * 14) * 0.03 * Math.max(0, Math.min(1, t - 1)) : 0;
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, -fall * 1.25 + wob]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, 0.32, 0.16]} />
        <meshStandardMaterial color={stuck ? '#ff5a2e' : '#f6f3ec'} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.16, 0.081]}>
        <planeGeometry args={[0.058, 0.31]} />
        <meshBasicMaterial map={tx} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.16, 0.0805]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.001, 0.001]} />
        <meshBasicMaterial color={'#000'} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
