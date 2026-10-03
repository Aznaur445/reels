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

export type Overlay = {type: 'hookTitle' | 'pill' | 'numberBadge' | 'stamp' | 'flash' | 'countdown'; from: number; to: number; props?: Record<string, unknown>};

export type Storyboard = {
  style?: 'light' | 'dark'; // dark — монтаж как в референсе (тёмный фон, камера с подсветкой)
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
};
