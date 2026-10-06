// Формат раскадровки videos/<id>/storyboard.json — из неё собирается ролик без правки кода.

export type Word = {
  text: string; // слово с пунктуацией, как в субтитрах
  start: number; // секунды на смонтированной дорожке
  end: number;
};

export type SceneType =
  | 'office3d'
  | 'calendar3d'
  | 'stages3d'
  | 'meeting3d'
  | 'clock3d'
  | 'vacation3d'
  | 'city3d'
  | 'phone3d'
  | 'meet12_3d'
  | 'talk'
  | 'nightdesk3d'
  | 'emptydesk3d'
  | 'queue3d'
  | 'dominoes3d'
  | 'dialogue'
  | 'calendar'
  | 'clock'
  | 'meeting'
  | 'vacation'
  | 'growth'
  | 'fireGrid'
  | 'countdown'
  | 'bigText'
  | 'orderFeed'
  | 'executorCard'
  | 'camera'
  | 'cardStack'
  | 'phoneChat'
  | 'stageGraph'
  | 'taskCard'
  | 'scheduleBars'
  | 'phoneNotification'
  | 'orderFeed'
  | 'executorCard'
  | 'chaos'
  | 'counter'
  | 'kineticWord'
  | 'screenshot';

export type Scene = {
  type: SceneType;
  from: number; // секунды
  to: number;
  props?: Record<string, unknown>;
  note?: string; // пояснение для таблицы раскадровки
  text?: string; // мои слова в этом куске
};

export type Kinetic = {
  text: string;
  at: number; // секунды — момент, когда слово звучит
  duration?: number;
};

export type Cta = {
  keyword: string;
  spoken: boolean; // произнесён ли призыв голосом
  keywordConfirmed?: boolean;
  from: number; // начало финального экрана, секунды
  duration: number;
  lead?: string;
  tail?: string;
};

export type Overlay = {type: 'hookTitle' | 'pill' | 'numberBadge' | 'stamp' | 'flash' | 'countdown' | 'label' | 'gHead'; from: number; to: number; props?: Record<string, unknown>};

export type Storyboard = {
  style?: 'light' | 'dark' | 'glass' | 'screen'; // dark — монтаж как в референсе (тёмный фон, камера с подсветкой)
  overlays?: Overlay[];
  accentWords?: string[]; // начала слов, которые в субтитрах красятся акцентом
  id: string;
  title: string;
  fps: number;
  voice: string; // путь относительно public/, например videos/<id>/audio/voice.wav
  voiceDuration: number;
  duration: number; // общая длина ролика, секунды (речь + финал)
  music?: {src: string; underVoiceDb: number; openDb: number};
  words: Word[];
  scenes: Scene[];
  kinetic: Kinetic[];
  cta: Cta;
  cover: {title: string; subtitle?: string; screen?: string};
  segments?: {src: number; dur: number; at: number}[]; // видеоисходник: куски исходника (src, сек) и их место в ролике (at)
  person?: string; // видео человека без фона (VP9 с альфой), путь относительно public/
  poses?: {talk?: {s: number; y: number}; split?: {s: number; y: number}}; // положение человека (glass)
  glow?: string; // цвет подсветки за человеком
  chapters?: {title: string; from: number}[]; // главы сверху (glass)
  bgs?: {src: string; from: number}[]; // размытые задники (glass)
};
