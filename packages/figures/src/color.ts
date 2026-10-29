import type { Item } from './types';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hexToRgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.substring(i, i + 2), 16)) as [number, number, number];
}

export function mix(c1: string, c2: string, t: number): string {
  const A = hexToRgb(c1);
  const B = hexToRgb(c2);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Luminancia percibida aproximada (0–255). */
export const luma = (h: string) => {
  const [r, g, b] = hexToRgb(h);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};

export function hexToHsl(h: string): [number, number, number] {
  const [r, g, b] = hexToRgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let s = 0;
  let hh = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh *= 60;
  }
  return [hh, s, l];
}

export function hslToHex(hh: number, s: number, l: number): string {
  hh = ((hh % 360) + 360) % 360;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [0, 8, 4].map((n) => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('');
}

/** Color de la paleta con más contraste respecto al promedio (para el interior en modo original). */
export function contrastColor(item: Item): string {
  const base = item.palette[0];
  const rest = item.palette.slice(1);
  return rest.reduce((best, c) => (Math.abs(luma(c) - luma(base)) > Math.abs(luma(best) - luma(base)) ? c : best), rest[0] ?? base);
}

/**
 * Colores vivos: los colores extraídos son punto de partida, no regla.
 * Conserva el tono más "colorido" de la carátula y sube saturación y luz.
 * Si la carátula es gris o negra, toma un tono cercano al del grupo.
 * Devuelve [exterior, interior complementario].
 */
export function vividColors(item: Item, groupColor: string, index: number): [string, string] {
  const cand = item.palette
    .map((c) => {
      const [hh, s, l] = hexToHsl(c);
      return { hh, s, l, score: s * (1 - Math.abs(l - 0.5) * 1.4) };
    })
    .sort((a, b) => b.score - a.score)[0];
  let hh = cand.hh;
  let s = cand.s;
  const base = hexToHsl(item.palette[0]);
  if (cand.score < 0.12) {
    hh = hexToHsl(groupColor)[0] + (((index * 37) % 50) - 25);
    s = 0.5;
  }
  const S = clamp(0.62 + s * 0.35, 0.62, 0.92);
  const L = clamp(0.38 + base[2] * 0.45, 0.44, 0.68);
  return [hslToHex(hh, S, L), hslToHex(hh + 180, clamp(S - 0.05, 0.55, 0.9), clamp(1.12 - L, 0.42, 0.7))];
}

/** Versión viva de un color de grupo (mismo tono, saturado). */
export const vividGroup = (groupColor: string, l = 0.58) => hslToHex(hexToHsl(groupColor)[0], 0.9, l);
