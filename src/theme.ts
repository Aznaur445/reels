// Цвета и размеры — из стиля stroy-control1.ru (src/app/globals.css в stroykontrol).
export const C = {
  bg: '#f6f1e6',
  panel: '#fffcf5',
  soft: '#f1ebdd',
  ink: '#2d2a24',
  muted: '#6d665a',
  faint: '#a29a8a',
  line: '#ebe4d4',
  line2: '#ddd3bf',
  accent: '#8a6a3f',
  accentInk: '#fffaf0',
  accentSoft: '#f1e7d4',
  done: '#4f8a5b',
  overdue: '#c0563f',
  warn: '#b98a2a',
};

export const FONT = 'Manrope, Inter, sans-serif';
export const RADIUS = 18;
export const SHADOW = '0 2px 4px rgba(90,70,35,0.06), 0 18px 48px rgba(90,70,35,0.12)';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Безопасные зоны Reels: сверху 250, снизу 400, справа 150.
export const SAFE = {top: 250, bottom: 400, right: 150, left: 60};
export const SAFE_W = W - SAFE.left - SAFE.right; // 870
// Зона визуала (над субтитрами) и зона субтитров.
export const VISUAL = {top: 312, height: 900};
export const SUBS = {top: 1230, height: 270};
