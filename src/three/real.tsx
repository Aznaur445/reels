// Реалистичная 3D-сцена: интерьеры, мебель, люди в позах, физический свет (ACES, PMREM-окружение, мягкие тени).
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useLayoutEffect, useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {roundRect, useCanvasTex, wrapText} from './kit';

export const useSec = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// ---------- текстуры ----------
const tex = (c: HTMLCanvasElement, rep: [number, number] = [1, 1]) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
export const useParquet = () =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d')!;
    const r = rng(11);
    const pw = 128;
    const ph = 1024 / 6;
    for (let col = 0; col < 8; col++)
      for (let row = -1; row < 7; row++) {
        const y = row * ph + (col % 2) * ph * 0.5;
        const base = 150 + r() * 40;
        g.fillStyle = `rgb(${base},${base * 0.72},${base * 0.47})`;
        g.fillRect(col * pw, y, pw - 2, ph - 2);
        for (let k = 0; k < 14; k++) {
          g.strokeStyle = `rgba(80,48,25,${0.08 + r() * 0.12})`;
          g.lineWidth = 1 + r() * 2;
          g.beginPath();
          const x = col * pw + r() * pw;
          g.moveTo(x, y);
          g.bezierCurveTo(x + r() * 10 - 5, y + ph * 0.3, x + r() * 10 - 5, y + ph * 0.7, x + r() * 6 - 3, y + ph);
          g.stroke();
        }
      }
    return tex(c, [3, 3]);
  }, []);
export const useCarpet = (color = '#5b6475') =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const r = rng(5);
    g.fillStyle = color;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.05)`;
      g.fillRect(r() * 256, r() * 256, 1.5, 1.5);
    }
    return tex(c, [8, 8]);
  }, [color]);
/** Вид из окна: город днём или ночью. */
export const useCity = (night: boolean) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const g = c.getContext('2d')!;
    const sky = g.createLinearGradient(0, 0, 0, 512);
    if (night) {
      sky.addColorStop(0, '#060b1a');
      sky.addColorStop(1, '#1d2a4a');
    } else {
      sky.addColorStop(0, '#7fb2e8');
      sky.addColorStop(1, '#dfeaf4');
    }
    g.fillStyle = sky;
    g.fillRect(0, 0, 1024, 512);
    const r = rng(night ? 21 : 9);
    for (let layer = 0; layer < 2; layer++) {
      let x = 0;
      while (x < 1024) {
        const w = 40 + r() * 90;
        const h = 120 + r() * (layer ? 260 : 180);
        const shade = night ? (layer ? 18 : 30) : layer ? 150 : 185;
        g.fillStyle = `rgb(${shade},${shade + 4},${shade + 12})`;
        g.fillRect(x, 512 - h, w, h);
        for (let wy = 512 - h + 10; wy < 500; wy += 16)
          for (let wx = x + 6; wx < x + w - 8; wx += 12) {
            if (night ? r() > 0.55 : r() > 0.3) {
              g.fillStyle = night ? `rgba(255,${200 + r() * 50},${120 + r() * 60},${0.6 + r() * 0.4})` : 'rgba(120,150,190,0.55)';
              g.fillRect(wx, wy, 6, 8);
            }
          }
        x += w + 4;
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [night]);

// ---------- камера, свет, окружение ----------
export type Key = {t: number; pos: [number, number, number]; look: [number, number, number]; fov?: number};
const lerp3 = (a: number[], b: number[], p: number) => a.map((v, i) => v + (b[i] - v) * p) as [number, number, number];

const Rig: React.FC<{keys: Key[]; handheld?: number}> = ({keys, handheld = 0.012}) => {
  const {camera} = useThree();
  const {t} = useSec();
  let k = 0;
  while (k < keys.length - 1 && t >= keys[k + 1].t) k++;
  const a = keys[k];
  const b = keys[Math.min(k + 1, keys.length - 1)];
  const p = b === a ? 1 : interpolate(t, [a.t, b.t], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.3, 1)});
  const pos = lerp3(a.pos, b.pos, p);
  const look = lerp3(a.look, b.look, p);
  // «ручная» камера — лёгкое покачивание
  const hx = Math.sin(t * 1.3) * handheld + Math.sin(t * 3.1) * handheld * 0.4;
  const hy = Math.cos(t * 1.7) * handheld * 0.8;
  camera.position.set(pos[0] + hx, pos[1] + hy, pos[2]);
  camera.lookAt(look[0] + hx * 0.5, look[1] + hy * 0.5, look[2]);
  const cam = camera as THREE.PerspectiveCamera;
  const fov = (a.fov ?? 42) + ((b.fov ?? 42) - (a.fov ?? 42)) * p;
  if (Math.abs(cam.fov - fov) > 0.01) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  return null;
};

const Env: React.FC<{exposure: number}> = ({exposure}) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, exposure]);
  return null;
};

/** Кадр: 3D-сцена + цветокоррекция, виньетка и зерно, как у реальной камеры. */
export const RealWorld: React.FC<{keys: Key[]; children: React.ReactNode; night?: boolean; exposure?: number; handheld?: number}> = ({keys, children, night, exposure, handheld}) => {
  const {width, height} = useVideoConfig();
  const {f} = useSec();
  return (
    <div style={{position: 'absolute', inset: 0, background: night ? '#05070d' : '#d8d2c6', filter: night ? 'contrast(1.1) saturate(1.05)' : 'contrast(1.06) saturate(1.12)'}}>
      <ThreeCanvas width={width} height={height} shadows="soft" gl={{antialias: true}} camera={{fov: 42, near: 0.05, far: 120}}>
        <Env exposure={exposure ?? (night ? 0.9 : 1.05)} />
        <Rig keys={keys} handheld={handheld} />
        {children}
      </ThreeCanvas>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none'}} />
      <Grain f={f} />
    </div>
  );
};
const Grain: React.FC<{f: number}> = ({f}) => {
  const url = useMemo(() => {
    const out: string[] = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d')!;
      const im = g.createImageData(256, 256);
      const r = rng(100 + k);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = r() * 255;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 18;
      }
      g.putImageData(im, 0, 0);
      out.push(c.toDataURL());
    }
    return out;
  }, []);
  return <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${url[f % 4]})`, mixBlendMode: 'overlay', pointerEvents: 'none'}} />;
};

// ---------- примитивы ----------
type V3 = [number, number, number];
export const M: React.FC<{pos?: V3; rot?: V3; scale?: number | V3; children: React.ReactNode; shadow?: boolean}> = ({pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, children, shadow = true}) => (
  <mesh position={pos} rotation={rot} scale={scale} castShadow={shadow} receiveShadow>
    {children}
  </mesh>
);
export const mat = {
  wood: (c = '#8b5e3c') => <meshStandardMaterial color={c} roughness={0.55} metalness={0} />,
  metal: (c = '#9aa0a8') => <meshStandardMaterial color={c} roughness={0.3} metalness={1} />,
  plastic: (c = '#222') => <meshStandardMaterial color={c} roughness={0.45} metalness={0} />,
  fabric: (c = '#333') => <meshStandardMaterial color={c} roughness={0.95} metalness={0} />,
  paint: (c = '#ece8e1') => <meshStandardMaterial color={c} roughness={0.9} metalness={0} />,
};

// ---------- помещение ----------
export const Room: React.FC<{w?: number; d?: number; h?: number; night?: boolean; floor?: 'parquet' | 'carpet'; window?: boolean}> = ({w = 12, d = 10, h = 3.2, night, floor = 'parquet', window = true}) => {
  const parquet = useParquet();
  const carpet = useCarpet();
  const city = useCity(!!night);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor === 'parquet' ? parquet : carpet} roughness={floor === 'parquet' ? 0.45 : 0.95} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        {mat.paint('#f2efe9')}
      </mesh>
      {/* задняя стена с окнами */}
      <group position={[0, 0, -d / 2]}>
        {window ? (
          <>
            <mesh position={[0, h / 2 + 0.15, -0.3]}>
              <planeGeometry args={[w * 1.6, h * 1.4]} />
              <meshBasicMaterial map={city} toneMapped={false} />
            </mesh>
            {Array.from({length: Math.floor(w / 2) + 1}).map((_, i) => (
              <M key={i} pos={[-w / 2 + i * 2, h / 2, 0]}>
                <boxGeometry args={[0.12, h, 0.2]} />
                {mat.metal('#2b2f36')}
              </M>
            ))}
            <M pos={[0, 0.35, 0]}>
              <boxGeometry args={[w, 0.7, 0.25]} />
              {mat.paint('#e4e0d8')}
            </M>
            <M pos={[0, h - 0.15, 0]}>
              <boxGeometry args={[w, 0.3, 0.25]} />
              {mat.paint('#e4e0d8')}
            </M>
          </>
        ) : (
          <M pos={[0, h / 2, 0]}>
            <boxGeometry args={[w, h, 0.2]} />
            {mat.paint()}
          </M>
        )}
      </group>
      {/* боковые стены */}
      {[-1, 1].map((s) => (
        <M key={s} pos={[(s * w) / 2, h / 2, 0]}>
          <boxGeometry args={[0.2, h, d]} />
          {mat.paint('#ebe6dd')}
        </M>
      ))}
      {/* потолочные светильники */}
      {[-w / 4, w / 4].map((x) =>
        [-d / 4, d / 4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, h - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color={night ? '#3a3a3a' : '#ffffff'} toneMapped={false} />
          </mesh>
        )),
      )}
      {night ? null : (
        <>
          <directionalLight position={[3, 6, -8]} intensity={2.4} color="#fff2dc" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0005} shadow-radius={6} />
          <ambientLight intensity={0.25} />
          <pointLight position={[0, h - 0.4, 0]} intensity={6} distance={12} color="#fff8ee" />
        </>
      )}
    </group>
  );
};

// ---------- мебель ----------
export const Desk: React.FC<{pos?: V3; rot?: number; w?: number; screen?: THREE.Texture | null; lamp?: boolean; mugs?: boolean}> = ({pos = [0, 0, 0], rot = 0, w = 1.6, screen, lamp, mugs = true}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <M pos={[0, 0.74, 0]}>
      <boxGeometry args={[w, 0.04, 0.8]} />
      {mat.wood('#c8b08a')}
    </M>
    {[-1, 1].map((s) => (
      <M key={s} pos={[(s * (w - 0.1)) / 2, 0.36, 0]}>
        <boxGeometry args={[0.05, 0.72, 0.7]} />
        {mat.metal('#3a3d42')}
      </M>
    ))}
    <M pos={[w / 2 - 0.3, 0.36, 0.05]}>
      <boxGeometry args={[0.42, 0.6, 0.6]} />
      {mat.paint('#e8e4dc')}
    </M>
    {/* монитор */}
    <group position={[0, 0.76, -0.22]}>
      <M pos={[0, 0.02, 0]}>
        <boxGeometry args={[0.22, 0.02, 0.16]} />
        {mat.metal('#555a61')}
      </M>
      <M pos={[0, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.3, 0.03]} />
        {mat.metal('#555a61')}
      </M>
      <M pos={[0, 0.42, 0.03]}>
        <boxGeometry args={[0.72, 0.44, 0.03]} />
        {mat.plastic('#15171b')}
      </M>
      {screen ? (
        <mesh position={[0, 0.42, 0.047]}>
          <planeGeometry args={[0.68, 0.4]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
    <M pos={[0, 0.77, 0.12]}>
      <boxGeometry args={[0.44, 0.02, 0.14]} />
      {mat.plastic('#2a2c30')}
    </M>
    {mugs ? (
      <M pos={[-w / 2 + 0.25, 0.81, 0.15]}>
        <cylinderGeometry args={[0.045, 0.04, 0.1, 20]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.2} />
      </M>
    ) : null}
    {[0, 1, 2].map((i) => (
      <M key={i} pos={[-w / 2 + 0.42, 0.765 + i * 0.006, -0.05]} rot={[0, 0.1 * i, 0]}>
        <boxGeometry args={[0.21, 0.004, 0.297]} />
        <meshStandardMaterial color="#fbfaf6" roughness={0.9} />
      </M>
    ))}
    {lamp ? (
      <group position={[-w / 2 + 0.2, 0.76, -0.25]}>
        <M pos={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.02, 20]} />
          {mat.metal('#222')}
        </M>
        <M pos={[0.05, 0.22, 0]} rot={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.01, 0.01, 0.45, 8]} />
          {mat.metal('#222')}
        </M>
        <M pos={[0.17, 0.42, 0.03]} rot={[0.3, 0, -1.2]}>
          <coneGeometry args={[0.08, 0.14, 20, 1, true]} />
          <meshStandardMaterial color="#222" side={THREE.DoubleSide} />
        </M>
        <spotLight position={[0.2, 0.4, 0.05]} target-position={[0.5, -0.8, 0.3]} angle={0.9} penumbra={0.8} intensity={14} distance={4} color="#ffcf8a" castShadow />
      </group>
    ) : null}
  </group>
);

export const Chair: React.FC<{pos?: V3; rot?: number; color?: string}> = ({pos = [0, 0, 0], rot = 0, color = '#1d1f24'}) => (
  <group position={pos} rotation={[0, rot, 0]}>
    <M pos={[0, 0.47, 0]}>
      <boxGeometry args={[0.5, 0.08, 0.48]} />
      {mat.fabric(color)}
    </M>
    <M pos={[0, 0.82, -0.23]} rot={[-0.12, 0, 0]}>
      <boxGeometry args={[0.46, 0.6, 0.06]} />
      {mat.fabric(color)}
    </M>
    <M pos={[0, 0.26, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.36, 12]} />
      {mat.metal()}
    </M>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return (
        <M key={i} pos={[Math.cos(a) * 0.17, 0.06, Math.sin(a) * 0.17]} rot={[0, -a, 0]}>
          <boxGeometry args={[0.34, 0.03, 0.04]} />
          {mat.metal('#2a2c30')}
        </M>
      );
    })}
  </group>
);

export const Plant: React.FC<{pos?: V3; s?: number}> = ({pos = [0, 0, 0], s = 1}) => (
  <group position={pos} scale={s}>
    <M pos={[0, 0.2, 0]}>
      <cylinderGeometry args={[0.18, 0.14, 0.4, 24]} />
      <meshStandardMaterial color="#d9d4ca" roughness={0.7} />
    </M>
    {Array.from({length: 14}).map((_, i) => {
      const a = i * 2.39;
      const h = 0.45 + (i % 5) * 0.12;
      return (
        <M key={i} pos={[Math.cos(a) * 0.12, 0.4 + h / 2, Math.sin(a) * 0.12]} rot={[Math.sin(a) * 0.5, a, Math.cos(a) * 0.5]}>
          <boxGeometry args={[0.08, h, 0.01]} />
          <meshStandardMaterial color={i % 3 ? '#3d7a3f' : '#4f9150'} roughness={0.6} />
        </M>
      );
    })}
  </group>
);

export const Shelf: React.FC<{pos?: V3; rot?: number}> = ({pos = [0, 0, 0], rot = 0}) => {
  const colors = ['#2b4c7e', '#8a6a3f', '#c0563f', '#4f8a5b', '#d8d2c6', '#2b2f36'];
  const r = rng(4);
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <M pos={[0, 1, 0]}>
        <boxGeometry args={[1.6, 2, 0.4]} />
        {mat.wood('#e6dfd2')}
      </M>
      {[0, 1, 2, 3].map((row) =>
        Array.from({length: 9}).map((_, i) => (
          <M key={`${row}-${i}`} pos={[-0.7 + i * 0.16, 0.28 + row * 0.47, 0.12]}>
            <boxGeometry args={[0.07, 0.32, 0.26]} />
            {mat.plastic(colors[Math.floor(r() * colors.length)])}
          </M>
        )),
      )}
    </group>
  );
};

// ---------- человек ----------
export type Pose = 'stand' | 'sit' | 'sitType' | 'headInHands' | 'phone' | 'write' | 'point' | 'armsCrossed' | 'sitBack';
type Look = {skin?: string; hair?: string; top?: string; pants?: string; long?: boolean; tie?: string; jacket?: boolean};

const Limb: React.FC<{len: number; r: number; color: string}> = ({len, r, color}) => (
  <mesh position={[0, -len / 2, 0]} castShadow>
    <capsuleGeometry args={[r, len - r * 2, 6, 14]} />
    <meshStandardMaterial color={color} roughness={0.85} />
  </mesh>
);

/** Человек: таз, торс, голова с волосами, руки и ноги на шарнирах; позы. */
export const Human: React.FC<{pos?: V3; rot?: number; pose?: Pose; look?: Look; talk?: boolean; seed?: number}> = ({pos = [0, 0, 0], rot = 0, pose = 'stand', look = {}, talk, seed = 0}) => {
  const {t} = useSec();
  const skin = look.skin ?? '#e0b393';
  const hair = look.hair ?? '#3b2a20';
  const top = look.top ?? '#2b3f6b';
  const pants = look.pants ?? '#2a2d33';
  const sitting = pose.startsWith('sit') || pose === 'headInHands' || pose === 'write';
  const breathe = Math.sin(t * 2 + seed) * 0.008;
  const nod = talk ? Math.sin(t * 9 + seed) * 0.06 : Math.sin(t * 0.7 + seed) * 0.02;
  // углы суставов
  let shL = [0, 0, 0.12], shR = [0, 0, -0.12], elL = 0, elR = 0, headX = 0, torsoX = 0;
  if (pose === 'sitType' || pose === 'write') {
    shL = [-0.9, 0, 0.15];
    shR = [-0.9, 0, -0.15];
    elL = -0.9;
    elR = -0.9;
    headX = 0.25;
    torsoX = 0.12;
    if (pose === 'write') shR = [-0.9 + Math.sin(t * 6 + seed) * 0.08, 0, -0.2];
  } else if (pose === 'headInHands') {
    shL = [-2.1, 0, 0.45];
    shR = [-2.1, 0, -0.45];
    elL = -2.2;
    elR = -2.2;
    headX = 0.45;
    torsoX = 0.38;
  } else if (pose === 'phone') {
    shR = [-0.5, 0, -0.9];
    elR = -2.4;
    headX = -0.05;
  } else if (pose === 'point') {
    shR = [-1.4, 0, -0.2];
    elR = -0.1;
  } else if (pose === 'armsCrossed') {
    shL = [-0.5, 0, 0.5];
    shR = [-0.5, 0, -0.5];
    elL = -2.0;
    elR = -2.0;
  } else if (pose === 'sit' || pose === 'sitBack') {
    shL = [-0.5, 0, 0.12];
    shR = [-0.5, 0, -0.12];
    elL = -0.8;
    elR = -0.8;
    torsoX = pose === 'sitBack' ? -0.12 : 0.05;
  }
  const hipY = sitting ? 0.5 : 0.95;
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* ноги */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.1, hipY, 0]} rotation={[sitting ? -Math.PI / 2 : 0, 0, 0]}>
          <Limb len={0.46} r={0.075} color={pants} />
          <group position={[0, -0.46, 0]} rotation={[sitting ? Math.PI / 2 : 0, 0, 0]}>
            <Limb len={0.46} r={0.06} color={pants} />
            <mesh position={[0, -0.47, 0.06]} castShadow>
              <boxGeometry args={[0.1, 0.07, 0.26]} />
              <meshStandardMaterial color="#141414" roughness={0.4} />
            </mesh>
          </group>
        </group>
      ))}
      {/* торс */}
      <group position={[0, hipY, 0]} rotation={[torsoX, 0, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.34, 0.14, 0.2]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.34 + breathe, 0]} scale={[1, 1, 0.62]} castShadow>
          <capsuleGeometry args={[0.19, 0.3, 8, 18]} />
          <meshStandardMaterial color={top} roughness={0.8} />
        </mesh>
        {look.tie ? (
          <mesh position={[0, 0.4, 0.125]} castShadow>
            <boxGeometry args={[0.05, 0.28, 0.01]} />
            <meshStandardMaterial color={look.tie} roughness={0.5} />
          </mesh>
        ) : null}
        {look.jacket ? (
          <mesh position={[0, 0.48, 0.118]}>
            <boxGeometry args={[0.1, 0.12, 0.012]} />
            <meshStandardMaterial color="#f4f4f4" roughness={0.6} />
          </mesh>
        ) : null}
        {/* шея и голова */}
        <mesh position={[0, 0.64, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.055, 0.1, 12]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <group position={[0, 0.8, 0]} rotation={[headX + nod, Math.sin(t * 0.5 + seed) * 0.08, 0]}>
          <mesh scale={[0.9, 1.08, 0.98]} castShadow>
            <sphereGeometry args={[0.115, 28, 20]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.035, -0.012]} scale={[0.95, look.long ? 1.15 : 0.95, 1.02]} castShadow>
            <sphereGeometry args={[0.118, 28, 20, 0, Math.PI * 2, 0, look.long ? Math.PI * 0.62 : Math.PI * 0.48]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          {look.long ? (
            <mesh position={[0, -0.07, -0.045]} scale={[1, 1.5, 0.62]} castShadow>
              <sphereGeometry args={[0.112, 24, 16, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75]} />
              <meshStandardMaterial color={hair} roughness={0.9} />
            </mesh>
          ) : null}
          <mesh position={[0, -0.01, 0.112]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.038, 0.02, 0.098]}>
              <sphereGeometry args={[0.011, 10, 8]} />
              <meshStandardMaterial color="#1a1410" roughness={0.3} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`e${s}`} position={[s * 0.104, 0, 0]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
          ))}
        </group>
        {/* руки */}
        {[
          [-1, shL, elL],
          [1, shR, elR],
        ].map(([s, sh, el]) => {
          const a = sh as number[];
          return (
            <group key={s as number} position={[(s as number) * 0.24, 0.52, 0]} rotation={[a[0], a[1], a[2]]}>
              <Limb len={0.3} r={0.055} color={top} />
              <group position={[0, -0.3, 0]} rotation={[el as number, 0, 0]}>
                <Limb len={0.27} r={0.045} color={top} />
                <mesh position={[0, -0.3, 0]} castShadow>
                  <sphereGeometry args={[0.045, 14, 10]} />
                  <meshStandardMaterial color={skin} roughness={0.6} />
                </mesh>
                {pose === 'phone' && s === 1 ? (
                  <mesh position={[0, -0.3, 0.05]} rotation={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.07, 0.14, 0.012]} />
                    <meshStandardMaterial color="#0b0c10" roughness={0.3} />
                  </mesh>
                ) : null}
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
};

/** Облако реплики (как в мессенджере), всплывает. */
export const Say: React.FC<{text: string; at: number; until?: number; pos: V3; me?: boolean; s?: number}> = ({text, at, until = 999, pos, me, s = 1}) => {
  const {t} = useSec();
  const tx = useCanvasTex(
    900,
    320,
    (g) => {
      g.font = '700 62px Manrope, sans-serif';
      const lines = wrapText(g, text, 780);
      const w = Math.min(860, Math.max(...lines.map((l) => g.measureText(l).width)) + 80);
      const h = 50 + lines.length * 74;
      g.shadowColor = 'rgba(0,0,0,0.35)';
      g.shadowBlur = 24;
      g.fillStyle = me ? '#3d6fe0' : 'rgba(255,255,255,0.97)';
      roundRect(g, (900 - w) / 2, 20, w, h, 40);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = me ? '#fff' : '#1d1f24';
      g.textAlign = 'center';
      lines.forEach((l, i) => g.fillText(l, 450, 88 + i * 74));
    },
    text + me,
  );
  if (t < at || t > until) return null;
  const p = Math.min(1, (t - at) / 0.22);
  const k = (0.7 + 0.3 * p) * s;
  return (
    <sprite position={pos} scale={[1.6 * k, 0.57 * k, 1]}>
      <spriteMaterial map={tx} transparent opacity={p} depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  );
};

/** Экран (телефон/монитор) с сообщениями. */
export const useScreen = (header: string, sub: string, items: {title: string; text?: string; at: number}[], t: number, accent?: string) => {
  const n = items.filter((i) => t >= i.at).length;
  return useCanvasTex(
    540,
    1080,
    (g) => {
      g.fillStyle = '#0f1626';
      g.fillRect(0, 0, 540, 1080);
      g.fillStyle = '#fff';
      g.font = '800 40px Manrope, sans-serif';
      g.fillText(header, 36, 120);
      g.fillStyle = '#93a3c4';
      g.font = '600 28px Manrope, sans-serif';
      g.fillText(sub, 36, 160);
      let y = 210;
      items.slice(0, n).forEach((it) => {
        g.font = '800 32px Manrope, sans-serif';
        const tl = wrapText(g, it.title, 440);
        g.font = '500 28px Manrope, sans-serif';
        const xl = it.text ? wrapText(g, it.text, 440) : [];
        const h = 40 + tl.length * 40 + xl.length * 36;
        g.fillStyle = '#1f2d4d';
        roundRect(g, 24, y, 492, h, 26);
        g.fill();
        g.fillStyle = accent && it.title.includes('!') ? accent : '#fff';
        g.font = '800 32px Manrope, sans-serif';
        tl.forEach((s, i) => g.fillText(s, 48, y + 48 + i * 40));
        g.fillStyle = '#c9d4ea';
        g.font = '500 28px Manrope, sans-serif';
        xl.forEach((s, i) => g.fillText(s, 48, y + 48 + tl.length * 40 + i * 36));
        y += h + 18;
      });
    },
    `${header}|${n}`,
  );
};
export const Phone: React.FC<{pos: V3; rot?: V3; screen: THREE.Texture; s?: number; buzz?: boolean}> = ({pos, rot = [-Math.PI / 2, 0, 0], screen, s = 1, buzz}) => {
  const {f} = useSec();
  const j = buzz ? Math.sin(f * 2.6) * 0.004 : 0;
  return (
    <group position={[pos[0] + j, pos[1], pos[2]]} rotation={rot} scale={s}>
      <mesh castShadow>
        <boxGeometry args={[0.075, 0.155, 0.008]} />
        <meshStandardMaterial color="#0c0d10" roughness={0.25} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.0045]}>
        <planeGeometry args={[0.069, 0.149]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
    </group>
  );
};
