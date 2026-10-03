// Набор для 3D-диорамы в стиле второго референса: игрушечный мир, тени от солнца, насыщенный цвет,
// камера всё время в движении. Всё процедурное — без внешних моделей и текстур.
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';

export const useSec = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};

// ---------- текстуры ----------
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

export const useSoil = (repeat = 3) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d')!;
    const r = rng(7);
    g.fillStyle = '#c4643a';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(${120 + r() * 90},${50 + r() * 40},${25 + r() * 20},${0.25 + r() * 0.3})`;
      g.fillRect(r() * 512, r() * 512, 2 + r() * 6, 2 + r() * 6);
    }
    g.strokeStyle = 'rgba(70,28,12,0.55)';
    for (let k = 0; k < 70; k++) {
      g.lineWidth = 1 + r() * 2.5;
      g.beginPath();
      let x = r() * 512;
      let y = r() * 512;
      g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (r() - 0.5) * 70;
        y += (r() - 0.5) * 70;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [repeat]);

export const usePaving = (repeat = 6) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const r = rng(3);
    g.fillStyle = '#9d968a';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const v = 188 + r() * 30;
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.fillRect(x * 32 + (y % 2) * 16, y * 32, 30, 30);
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [repeat]);

/** Текстура с текстом: плашка, подпись, экран. draw вызывается при изменении key. */
export const useCanvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, key: string) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, key]);

export const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

export const wrapText = (g: CanvasRenderingContext2D, text: string, maxW: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
};

// ---------- сцена-обёртка ----------
export type Key = {t: number; pos: [number, number, number]; look: [number, number, number]; fov?: number};

const lerp3 = (a: number[], b: number[], p: number) => a.map((v, i) => v + (b[i] - v) * p) as [number, number, number];

const CameraRig: React.FC<{keys: Key[]; shake?: number}> = ({keys, shake = 0}) => {
  const {camera} = useThree();
  const {t, f} = useSec();
  let k = 0;
  while (k < keys.length - 1 && t >= keys[k + 1].t) k++;
  const a = keys[k];
  const b = keys[Math.min(k + 1, keys.length - 1)];
  const p = b === a ? 1 : interpolate(t, [a.t, b.t], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.25, 1)});
  const pos = lerp3(a.pos, b.pos, p);
  const look = lerp3(a.look, b.look, p);
  const s = shake * Math.max(0, 1 - (t % 1000) * 0);
  camera.position.set(pos[0] + Math.sin(f * 1.7) * s, pos[1] + Math.cos(f * 2.3) * s, pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  const cam = camera as THREE.PerspectiveCamera;
  const fov = a.fov !== undefined && b.fov !== undefined ? a.fov + (b.fov - a.fov) * p : a.fov ?? 56;
  if (cam.fov !== fov) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  return null;
};

/** Мир-диорама: небо, солнце, тени, мощёная площадка вокруг. */
export const World: React.FC<{keys: Key[]; children: React.ReactNode; sky?: boolean; shake?: number; ground?: 'paving' | 'none'; warm?: number}> = ({
  keys,
  children,
  sky = true,
  shake = 0,
  ground = 'paving',
  warm = 1,
}) => {
  const {width, height} = useVideoConfig();
  const {t} = useSec();
  const paving = usePaving(10);
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'saturate(1.35) contrast(1.12)'}}>
      <div style={{position: 'absolute', inset: 0, background: sky ? 'linear-gradient(180deg,#2f6fd0 0%,#6fa8e6 38%,#cfe3f4 60%,#e9d9b8 100%)' : '#0a1530'}} />
      {sky
        ? [0, 1, 2, 3].map((i) => (
            <div key={i} style={{position: 'absolute', left: ((i * 330 + t * 14) % 1400) - 250, top: 70 + i * 55, width: 260 + i * 40, height: 70, borderRadius: 60, background: 'rgba(255,255,255,0.85)', filter: 'blur(10px)'}} />
          ))
        : null}
      <ThreeCanvas width={width} height={height} shadows gl={{alpha: true, antialias: true}} camera={{fov: 56, near: 0.1, far: 200}}>
        <CameraRig keys={keys} shake={shake} />
        <hemisphereLight args={['#dfefff', '#b0643a', 0.75]} />
        <directionalLight
          position={[8, 14, 6]}
          intensity={2.6 * warm}
          color="#fff1d6"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        {ground === 'paving' ? (
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <planeGeometry args={[80, 80]} />
            <meshStandardMaterial map={paving} roughness={0.95} />
          </mesh>
        ) : null}
        {children}
      </ThreeCanvas>
      <SunFlare />
    </div>
  );
};

const SunFlare: React.FC = () => {
  const {t} = useSec();
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
  return (
    <div style={{position: 'absolute', left: 760, top: -120, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,250,210,0.95) 0%, rgba(255,226,120,0.55) 18%, rgba(255,200,80,0.0) 60%)', opacity: pulse, mixBlendMode: 'screen', pointerEvents: 'none'}} />
  );
};

/** Земляная «грядка» в бортах — как поля в референсе. */
export const Plot: React.FC<{w: number; d: number; pos?: [number, number, number]}> = ({w, d, pos = [0, 0, 0]}) => {
  const soil = useSoil(Math.max(1, Math.round(w / 3)));
  const wall = '#d9b57a';
  return (
    <group position={pos}>
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={soil} roughness={1} />
      </mesh>
      {[
        [0, -d / 2, w + 0.5, 0.25],
        [0, d / 2, w + 0.5, 0.25],
      ].map(([x, z, ww, dd], i) => (
        <mesh key={i} castShadow receiveShadow position={[x, 0.18, z]}>
          <boxGeometry args={[ww, 0.36, dd]} />
          <meshStandardMaterial color={wall} roughness={1} />
        </mesh>
      ))}
      {[-w / 2, w / 2].map((x, i) => (
        <mesh key={i} castShadow receiveShadow position={[x, 0.18, 0]}>
          <boxGeometry args={[0.25, 0.36, d]} />
          <meshStandardMaterial color={wall} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

/** Игрушечный человечек. */
export const Person: React.FC<{pos?: [number, number, number]; rot?: number; color?: string; head?: string; scale?: number; seated?: boolean; bob?: number; label?: string}> = ({
  pos = [0, 0, 0],
  rot = 0,
  color = '#2f4f8a',
  head = '#f2c7a0',
  scale = 1.35,
  seated,
  bob = 0,
}) => {
  const {t} = useSec();
  const y = seated ? -0.12 : 0;
  const by = Math.abs(Math.sin(t * 6)) * 0.05 * bob;
  return (
    <group position={[pos[0], pos[1] + y + by, pos[2]]} rotation={[0, rot, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.22, 0.5, 6, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.2, 24, 16]} />
        <meshStandardMaterial color={head} roughness={0.5} />
      </mesh>
      <mesh position={[0.07, 1.15, 0.18]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.07, 1.15, 0.18]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

export const Box: React.FC<{pos: [number, number, number]; size: [number, number, number]; color: string; rot?: [number, number, number]; emissive?: string; ei?: number; map?: THREE.Texture | null; scale?: number}> = ({
  pos,
  size,
  color,
  rot = [0, 0, 0],
  emissive,
  ei = 0,
  map,
  scale = 1,
}) => (
  <mesh castShadow receiveShadow position={pos} rotation={rot} scale={scale}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.7} emissive={emissive ?? '#000'} emissiveIntensity={ei} map={map ?? undefined} />
  </mesh>
);

/** Стол с ноутбуком. */
export const Desk: React.FC<{pos?: [number, number, number]; rot?: number; screen?: THREE.Texture}> = ({pos = [0, 0, 0], rot = 0, screen}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <Box pos={[0, 0.75, 0]} size={[2.2, 0.08, 1.1]} color="#8a6a3f" />
    {[
      [-1, -0.45],
      [1, -0.45],
      [-1, 0.45],
      [1, 0.45],
    ].map(([x, z], i) => (
      <Box key={i} pos={[x, 0.37, z]} size={[0.07, 0.74, 0.07]} color="#5b4630" />
    ))}
    <Box pos={[0, 0.8, 0.15]} size={[0.8, 0.03, 0.5]} color="#cfd3da" />
    <mesh castShadow position={[0, 1.05, -0.08]} rotation={[-0.25, 0, 0]}>
      <boxGeometry args={[0.8, 0.5, 0.03]} />
      <meshStandardMaterial color="#cfd3da" />
    </mesh>
    {screen ? (
      <mesh position={[0, 1.05, -0.06]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[0.74, 0.44]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    ) : null}
  </group>
);

/** Реплика-облачко над головой (спрайт с текстом), появляется пружиной. */
export const Bubble3D: React.FC<{text: string; at: number; until?: number; pos: [number, number, number]; scale?: number; color?: string; ink?: string}> = ({
  text,
  at,
  until = 999,
  pos,
  scale = 1,
  color = '#ffffff',
  ink = '#2d2a24',
}) => {
  const {t} = useSec();
  const tex = useCanvasTex(
    720,
    300,
    (g) => {
      g.font = '800 64px Manrope, sans-serif';
      const lines = wrapText(g, text, 620);
      const h = 60 + lines.length * 76;
      g.fillStyle = color;
      roundRect(g, 10, 10, 700, h, 46);
      g.fill();
      g.beginPath();
      g.moveTo(320, h + 8);
      g.lineTo(360, h + 60);
      g.lineTo(400, h + 8);
      g.fill();
      g.fillStyle = ink;
      g.textAlign = 'center';
      lines.forEach((l, i) => g.fillText(l, 360, 90 + i * 76));
    },
    text + color,
  );
  if (t < at || t > until) return null;
  const p = Math.min(1, (t - at) / 0.25);
  const s = (p < 1 ? 1.25 * p - 0.25 * p * p * 1.0 : 1) * scale;
  return (
    <sprite position={pos} scale={[2.4 * s, 1.0 * s, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

/** Огонь: частицы-шарики, летящие вверх, и тёплый свет. */
export const Fire: React.FC<{pos: [number, number, number]; size?: number; from?: number}> = ({pos, size = 1, from = 0}) => {
  const {t} = useSec();
  if (t < from) return null;
  const k = Math.min(1, (t - from) / 0.4);
  return (
    <group position={pos} scale={size * k}>
      <pointLight color="#ff7a2e" intensity={8} distance={6} position={[0, 0.8, 0]} />
      {Array.from({length: 26}).map((_, i) => {
        const ph = (t * 1.3 + i * 0.137) % 1;
        const r = 0.35 * (1 - ph);
        const x = Math.sin(i * 12.9) * 0.35 * (1 - ph * 0.5);
        const z = Math.cos(i * 7.3) * 0.35 * (1 - ph * 0.5);
        return (
          <mesh key={i} position={[x, ph * 1.8, z]}>
            <sphereGeometry args={[Math.max(0.02, r), 10, 8]} />
            <meshBasicMaterial color={ph < 0.35 ? '#ffe27a' : ph < 0.7 ? '#ff8a2e' : '#d0401c'} transparent opacity={1 - ph} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Пружинное появление (масштаб 0 → 1 с перелётом). */
export const pop = (t: number, at: number, dur = 0.35) => {
  if (t < at) return 0;
  const p = Math.min(1, (t - at) / dur);
  return 1 + Math.sin(p * Math.PI) * 0.18 * (1 - p) - (1 - p) * (1 - p) * (1 - p) * 1;
};
