// Typed view of public/data.json (written by scripts/prep_remotion.py).
// Typing it explicitly keeps optional scenes (hook, formula, banner, sketch) null-safe,
// so a new project can leave any of them out of storyboard.json.
import raw from '../public/data.json';

export interface Word {text: string; start: number; end: number}
export interface Shot {
  id: string; start: number; end: number; label: string;
  image: string | null; video: string | null; videoSeconds: number | null;
  sfx: string | null; sfxAt: number | null;
}
export interface Target {
  at: number; label?: string; arrowX: number; arrowY: number; arrowScale?: number;
  boxX: number; boxW: number; boxY: number; boxH: number;
}
export interface CalloutCfg {
  id: string; image: string | null; aspect: [number, number]; start: number; end: number;
  x: number; y: number; width: number; targets: Target[];
}
export interface Hook {teaser?: string; text: string; start: number; end: number; highlight: string[]}
export interface Formula {
  start: number; end: number; terms: {t: string; at: number}[];
  result: {t: string; at: number}; cta?: {t: string; at: number};
}
export interface Banner {start: number; end: number; question: string; answer: string; sub: string}
export interface Thumbnail {chip: string; big: string; accent: string; foot: string; image: string | null}
export interface Sketch {start: number; end: number}
export interface ShortData {
  duration: number; voice: string | null; voiceTrim: {from: number; at: number} | null; music: string | null;
  words: Word[]; shots: Shot[]; callouts: CalloutCfg[];
  hook: Hook | null; formula: Formula | null; banner: Banner | null; jev: Sketch | null; thumbnail: Thumbnail | null;
}

export const data = raw as unknown as ShortData;
