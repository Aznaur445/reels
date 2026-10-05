import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import type {Storyboard} from '../types';
import {SCREENS} from './screens';
import {D} from './theme';

/** Положение человека в кадре: talk — во весь кадр (с «наездом» zoom), split — ниже, перед экраном сервиса, hide — нет. */
type Pose = {s: number; y: number; o: number; ox: number};
const POSES = {
  talk: {s: 1, y: 0, o: 1, ox: 0},
  split: {s: 0.5, y: 120, o: 1, ox: 0},
  hide: {s: 0.5, y: 380, o: 0, ox: 0},
};
const modeOf = (type: string, props?: Record<string, unknown>) => (type === 'talk' ? 'talk' : ((props?.person as string) ?? 'split')) as keyof typeof POSES;

// Исходник 606×1080 растянут на ширину кадра: 1080×1925
const VW = 1080;
const VH = 1925;

export const PersonLayer: React.FC<{sb: Storyboard; layer: 'back' | 'front'}> = ({sb, layer}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const scenes = sb.scenes;
  const P = useMemo(() => ({...POSES, talk: {...POSES.talk, ...(sb.poses?.talk ?? {})}, split: {...POSES.split, ...(sb.poses?.split ?? {})}}), [sb.poses]);
  const custom = !!sb.poses;
  const pose = useMemo(() => {
    const idx = scenes.findIndex((s) => t >= s.from && t < s.to);
    const end = t >= sb.cta.from;
    const cur = idx < 0 ? null : scenes[idx];
    const tgt: Pose = end ? (sb.cta.spoken ? {...P.split} : P.hide) : cur ? {...P[modeOf(cur.type, cur.props)]} : P.talk;
    if (cur?.type === 'talk') {
      tgt.s = P.talk.s * ((cur.props?.zoom as number) ?? 1);
      tgt.y = P.talk.y + ((cur.props?.y as number) ?? 0);
    }
    const prev = idx > 0 ? scenes[idx - 1] : null;
    const from: Pose = prev ? {...P[modeOf(prev.type, prev.props)]} : tgt;
    if (prev?.type === 'talk') {
      from.s = P.talk.s * ((prev.props?.zoom as number) ?? 1);
      from.y = P.talk.y + ((prev.props?.y as number) ?? 0);
    }
    const start = end ? sb.cta.from : cur?.from ?? 0;
    // talk → talk: резкая смена крупности (джамп-кат), остальное — плавный переход
    const jump = cur?.type === 'talk' && prev?.type === 'talk';
    const k = jump ? 1 : interpolate(t - start, [0, 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    return {s: from.s + (tgt.s - from.s) * k, y: from.y + (tgt.y - from.y) * k, o: from.o + (tgt.o - from.o) * k, mode: cur ? modeOf(cur.type, cur.props) : 'talk'};
  }, [t, scenes, sb.cta.from, P]);

  if (!sb.person || !sb.segments) return null;
  const talkK = Math.max(0, Math.min(1, (pose.s - 0.5) / 0.5)); // 1 — во весь кадр, 0 — split
  if (layer === 'back') {
    // Задник для «говорящей головы»: размытый экран сервиса и тёплый контровой свет за человеком
    const Scr = SCREENS.project;
    return (
      <AbsoluteFill style={{opacity: 0.9 * talkK}}>
        <div style={{position: 'absolute', left: -200, top: 180, width: Scr.w, height: Scr.h, transform: `scale(${1480 / Scr.w}) translate(${Math.sin(t / 6) * 20}px, 0)`, transformOrigin: '0 0', filter: 'blur(16px)', opacity: 0.32}}>
          <Scr.Comp />
        </div>
        <AbsoluteFill style={{background: `linear-gradient(180deg, ${D.bg}cc 0%, transparent 30%, transparent 60%, ${D.bg} 100%)`}} />
      </AbsoluteFill>
    );
  }
  const glowY = custom ? 1920 - VH * pose.s * 0.62 + pose.y : 640 * pose.s + (1 - pose.s) * VH + pose.y;
  return (
    <AbsoluteFill style={{opacity: pose.o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 540 - 560, top: glowY - 520, width: 1120, height: 1040, borderRadius: '50%', background: sb.glow ?? 'radial-gradient(closest-side, rgba(255,90,46,0.30), rgba(79,123,234,0.10) 55%, transparent 75%)', filter: 'blur(10px)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 1920 - VH,
          width: VW,
          height: VH,
          transform: `translateY(${pose.y}px) scale(${pose.s})`,
          transformOrigin: !custom && pose.s >= 1 ? '50% 33%' : '50% 100%',
          filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.25)) drop-shadow(0 30px 60px rgba(0,0,0,0.55))',
        }}
      >
        {sb.segments.map((g, i) => {
          const from = Math.round(g.at * fps);
          const dur = Math.max(1, Math.round(g.dur * fps) + (i < sb.segments!.length - 1 ? 1 : Math.round(3 * fps)));
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <OffthreadVideo src={staticFile(sb.person!)} startFrom={Math.round(g.src * fps)} transparent muted style={{width: VW, height: VH, position: 'absolute', inset: 0}} />
            </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
