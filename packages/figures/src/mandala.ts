import { contrastColor, mix, vividColors, vividGroup } from './color';
import type { ColorMode, FigureData, Group, HoverInfo, Item } from './types';

/**
 * Mandala de Samotracia — SVG (vectorial, nítido a cualquier zoom; antes era Canvas 2D, ver
 * docs/01-plan-del-proyecto.md).
 *
 * Cada anillo es un grupo (del más pequeño al centro al más grande afuera) y cada pétalo un elemento.
 * El pétalo tiene capas: color del grupo, anillo negro (modo vivo), color del elemento y su complementario.
 * Entre pétalos hay hojas apagadas (ornamento, no datos) que se encienden con una onda de luz
 * que viaja de afuera hacia el centro.
 *
 * La rotación continua y la onda de luz se hacen con CSS (@keyframes / @property), no con un
 * requestAnimationFrame que redibuje todo cada cuadro — eso es lo que permite que el SVG se quede
 * nítido en cualquier zoom. La geometría (anillos, pétalos, formas) es la misma matemática que el
 * canvas original, solo que genera nodos SVG en vez de llamadas de dibujo.
 *
 * Todos los números que se fueron afinando en el prototipo viven en MandalaOptions.
 */
export interface MandalaOptions {
  colorMode: ColorMode;
  /** Tema general de la página: solo afecta el vacío detrás de las piezas; los contornos siempre son oscuros. */
  theme: 'light' | 'dark';
  /** Grados por segundo que gira cada anillo (alternan sentido). */
  ringRotationSpeed: number;
  /** Grados por segundo que giran los rayos del fondo. */
  backgroundSpinSpeed: number;
  /** Grados por segundo que gira el centro de puntos. */
  centerSpinSpeed: number;
  glow: {
    enabled: boolean;
    /** Anillos por segundo que avanza la onda (1.38 ≈ 6.5 s de afuera al centro con 9 anillos). */
    speed: number;
    /** Ancho de la onda en anillos: más alto = transición más gradual. */
    width: number;
    /** Brillo máximo (0–1). */
    max: number;
    /** Pausa entre ciclos, en "anillos" de tiempo. */
    pause: number;
  };
  /** Grupos con menos elementos que este número usan pétalos angostos y hojas de relleno. */
  innerRingMaxItems: number;
  /** Ancho máximo del pétalo interno, como fracción del espacio de cada elemento. */
  innerPetalWidth: number;
  /** Opacidad del resto de pétalos cuando hay uno bajo el cursor. */
  hoverDim: number;
  /** Escala del pétalo bajo el cursor. */
  hoverScale: number;
  /** Opacidad de los grupos fuera de foco. */
  focusDim: number;
}

export const defaultMandalaOptions: MandalaOptions = {
  colorMode: 'vivid',
  theme: 'dark',
  ringRotationSpeed: 2.2,
  backgroundSpinSpeed: 1.2,
  centerSpinSpeed: 3,
  glow: { enabled: true, speed: 1.38, width: 2.4, max: 0.88, pause: 5 },
  innerRingMaxItems: 30,
  innerPetalWidth: 0.5,
  hoverDim: 0.62,
  hoverScale: 1.1,
  focusDim: 0.15,
};

type Shape = 'lotus' | 'drop' | 'leaf' | 'scallop';

interface RingLayout {
  group: Group;
  index: number;
  r0: number;
  r1: number;
  n: number;
  shape: Shape;
  dir: 1 | -1;
  inner: boolean;
  L: number;
  mid: number;
  w: number;
  /** Fase de la onda de luz (0 = anillo más externo, crece hacia el centro). */
  k: number;
}

interface PetalLayout {
  item: Item;
  ring: RingLayout;
  slot: number;
  a0: number;
  vivid: string;
  vividInner: string;
  original: string;
  originalInner: string;
}

interface PetalLayerRef {
  group: SVGGElement;
  path: SVGPathElement;
  tx: number;
  k: number;
}

interface PetalEntry {
  pos: SVGGElement;
  inner: SVGGElement;
  layers: PetalLayerRef[];
  ring: RingLayout;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 1000;
const C = 500;
const INK_ORIGINAL = '#140c18';
const INK_VIVID = '#050307';
const HOVER_INK = '#ece7f2';
const rad = (d: number) => (d * Math.PI) / 180;

/** Vacío detrás de las piezas (rayos de fondo, bandas entre anillos, fondo del centro): sigue el tema. */
const VOID_RAYS = {
  dark: { vivid: ['#07050a', '#120c18'], original: ['#1f1628', '#2a1d35'] },
  light: { vivid: ['#f4eff8', '#e9ddf1'], original: ['#efe8f4', '#e3d9ec'] },
} as const satisfies Record<'light' | 'dark', Record<ColorMode, readonly [string, string]>>;

const VOID_CORE = {
  dark: { vivid: INK_VIVID, original: INK_ORIGINAL },
  light: { vivid: '#f6f1fa', original: '#f0eaf5' },
} as const satisfies Record<'light' | 'dark', Record<ColorMode, string>>;

// ---------- helpers de DOM/SVG ----------

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function circlePathD(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} Z`;
}

/** Dona (círculo con un hueco) vía fill-rule evenodd: dos círculos como subtrazos independientes. */
function annulusPathD(cx: number, cy: number, rInner: number, rOuter: number): string {
  return `${circlePathD(cx, cy, rOuter)} ${circlePathD(cx, cy, rInner)}`;
}

function petalPathD(shape: Shape, L: number, w: number): string {
  if (shape === 'drop') {
    return `M0,0 C${L * 0.3},${-w * 0.62} ${L * 1.04},${-w * 0.66} ${L},0 C${L * 1.04},${w * 0.66} ${L * 0.3},${w * 0.62} 0,0 Z`;
  }
  if (shape === 'leaf') {
    return `M0,0 Q${L * 0.5},${-w * 0.75} ${L},0 Q${L * 0.5},${w * 0.75} 0,0 Z`;
  }
  if (shape === 'scallop') {
    const rr = Math.min(w / 2, L * 0.6);
    return `M0,${-w * 0.42} L${L - rr},${-w * 0.5} L${L - rr},${-rr} A${rr},${rr} 0 0 1 ${L - rr},${rr} L0,${w * 0.42} Z`;
  }
  // lotus
  return `M0,${-w * 0.3} C${L * 0.25},${-w * 0.62} ${L * 0.72},${-w * 0.5} ${L},0 C${L * 0.72},${w * 0.5} ${L * 0.25},${w * 0.62} 0,${w * 0.3} Z`;
}

function veinsPathD(L: number, w: number): string {
  let d = `M${L * 0.05},0 L${L * 0.95},0`;
  for (let v = 1; v < 5; v++) {
    const x = (L * v) / 5;
    d += ` M${x},0 L${x + L * 0.08},${-w * 0.22} M${x},0 L${x + L * 0.08},${w * 0.22}`;
  }
  return d;
}

/** Hoja de puntos (centro del mandala): un contorno de puntillismo + filas de puntos. */
function appendDotLeaf(parent: SVGGElement, L: number, hw: number, c0: string, c1: string, c2: string, dr: number) {
  const halfW = (t: number, h: number) => h * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.85);
  let d = '';
  for (let i = 0; i <= 24; i++) d += `${i === 0 ? 'M' : 'L'}${L * (i / 24)},${-halfW(i / 24, hw)} `;
  for (let i = 24; i >= 0; i--) d += `L${L * (i / 24)},${halfW(i / 24, hw)} `;
  d += 'Z';
  parent.appendChild(svgEl('path', { d, fill: INK_VIVID }));

  const dot = (x: number, y: number, r: number, c: string) => {
    parent.appendChild(svgEl('circle', { cx: x, cy: y, r, fill: c }));
  };
  const row = (k: number, col: string, r: number, x0: number) => {
    const N = Math.max(6, Math.round((L * k) / (r * 2.6)));
    for (const sgn of [-1, 1]) for (let i = 1; i < N; i++) dot(x0 + L * k * (i / N), sgn * halfW(i / N, hw * k) * 0.86, r, col);
  };
  row(1, c0, dr, 0);
  row(0.72, c1, dr * 0.9, L * 0.14);
  const M = Math.max(4, Math.round((L * 0.6) / (dr * 2.8)));
  for (let i = 0; i < M; i++) dot(L * (0.22 + (0.6 * i) / (M - 1)), 0, dr * (0.7 + 0.9 * Math.sin(Math.PI * (i / (M - 1)))), c2);
  dot(L * 0.03, 0, dr * 0.9, c0);
  dot(L * 0.97, 0, dr * 0.9, c0);
}

/** Color "apagado" de una hoja: igual lógica que antes, ahora precomputado (no por cuadro). */
function leafBaseColor(ring: RingLayout, vivid: boolean, theme: 'light' | 'dark', voidCore: string): string {
  const gc = ring.group.color;
  const light = theme === 'light';
  const ink = vivid ? INK_VIVID : INK_ORIGINAL;
  const off = light ? voidCore : ink;
  const ratio = vivid ? (light ? (ring.inner ? 0.42 : 0.6) : 0.55) : light ? (ring.inner ? 0.28 : 0.45) : 0.35;
  return mix(gc, off, ratio);
}

/** Color "encendido" de una hoja (pico de la onda de luz). */
function leafLitColor(ring: RingLayout, vivid: boolean, theme: 'light' | 'dark'): string {
  const gc = ring.group.color;
  const light = theme === 'light';
  const ink = vivid ? INK_VIVID : INK_ORIGINAL;
  return light ? mix(gc, ink, 0.6) : vivid ? vividGroup(gc) : gc;
}

/** Genera los `@keyframes` de la onda de luz muestreando la misma curva cos^1.6 que usaba el canvas. */
function buildGlowKeyframes(glow: MandalaOptions['glow'], ringCount: number): { css: string; period: number } {
  const period = (ringCount + glow.pause) / Math.max(glow.speed, 1e-6);
  if (!glow.enabled || !Number.isFinite(period) || period <= 0) {
    return { css: '@keyframes sam-glow { 0%, 100% { --sam-glow: 0; } }', period: 1 };
  }
  const halfPct = Math.min(49, (glow.width / (ringCount + glow.pause)) * 100);
  const SAMPLES = 8;
  const stops: string[] = [`0% { --sam-glow: 0; }`, `${(50 - halfPct).toFixed(3)}% { --sam-glow: 0; }`];
  for (let i = -SAMPLES; i <= SAMPLES; i++) {
    const d = (i / SAMPLES) * glow.width;
    const pct = 50 + (d / glow.width) * halfPct;
    const b = glow.max * Math.pow(0.5 + 0.5 * Math.cos((Math.PI * d) / glow.width), 1.6);
    stops.push(`${pct.toFixed(3)}% { --sam-glow: ${b.toFixed(4)}; }`);
  }
  stops.push(`${(50 + halfPct).toFixed(3)}% { --sam-glow: 0; }`, `100% { --sam-glow: 0; }`);
  return { css: `@keyframes sam-glow { ${stops.join(' ')} }`, period };
}

/** Periodo de la "respiración" propia del anillo seleccionado (independiente de la onda general). */
const BREATHE_PERIOD_SEC = 2.4;

function spinStyle(durationSec: number, direction: 'normal' | 'reverse'): string {
  return `transform-box:view-box;transform-origin:${C}px ${C}px;animation-name:sam-spin;animation-duration:${durationSec.toFixed(3)}s;animation-timing-function:linear;animation-iteration-count:infinite;animation-direction:${direction};`;
}

export class MandalaFigure {
  private svg: SVGSVGElement;
  private styleEl: SVGStyleElement;
  private opts: MandalaOptions;
  private data: FigureData;
  private focus: string | null = null;
  private hoverId: string | null = null;
  private running = false;
  private reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private cleanup: Array<() => void> = [];

  private ringEls = new Map<string, { band: SVGGElement }>();
  private petalEls = new Map<string, PetalEntry>();
  private leafSlotEls = new Map<string, SVGGElement>();
  private glowPeriod = 1;

  /** Se llama cuando cambia el elemento bajo el cursor (null al salir). Solo resalta, no es confiable en touch. */
  onHover: (info: HoverInfo | null) => void = () => {};
  /** Se llama al tocar/clicar un elemento: dispara el detalle persistente (funciona igual en mouse y touch). */
  onSelect: (info: HoverInfo) => void = () => {};

  constructor(
    private container: HTMLElement,
    data: FigureData,
    options: Partial<MandalaOptions> = {},
  ) {
    this.opts = { ...defaultMandalaOptions, ...options, glow: { ...defaultMandalaOptions.glow, ...options.glow } };
    this.data = data;

    this.svg = svgEl('svg', { viewBox: `0 0 ${W} ${W}`, width: '100%', height: '100%' });
    this.svg.classList.add('sam-mandala', 'sam-paused');
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute(
      'aria-label',
      'Mandala: cada pétalo es un elemento de la colección',
    );
    this.styleEl = svgEl('style');
    this.svg.appendChild(this.styleEl);
    this.container.appendChild(this.svg);

    this.bindEvents();
    this.render();
  }

  // ---------- API pública ----------

  setData(data: FigureData) {
    this.data = data;
    this.render();
  }

  setOptions(options: Partial<MandalaOptions>) {
    this.opts = { ...this.opts, ...options, glow: { ...this.opts.glow, ...options.glow } };
    this.render();
  }

  setColorMode(mode: ColorMode) {
    this.opts.colorMode = mode;
    this.render();
  }

  setTheme(theme: 'light' | 'dark') {
    this.opts.theme = theme;
    this.render();
  }

  /**
   * Resalta un grupo (id) o todos (null). No reconstruye nada: solo clases/estilos puntuales.
   * El anillo seleccionado cambia su onda de luz por una "respiración" propia (pulso parejo, sin
   * esperar el turno de la onda general); el resto se pausa en vez de seguir viajando por detrás.
   */
  setFocus(groupId: string | null) {
    this.focus = groupId;
    for (const [gid, els] of this.ringEls) els.band.classList.toggle('sam-dim-band', this.focus !== null && this.focus !== gid);
    for (const el of this.leafSlotEls.values()) {
      const gid = el.dataset.ring ?? null;
      const isFocused = this.focus !== null && this.focus === gid;
      el.classList.toggle('sam-dim-leaf', this.focus !== null && !isFocused);
      if (isFocused) {
        el.style.setProperty('animation-name', 'sam-breathe');
        el.style.setProperty('animation-duration', `${BREATHE_PERIOD_SEC}s`);
        el.style.setProperty('animation-delay', '0s');
      } else {
        el.style.setProperty('animation-name', 'sam-glow');
        el.style.setProperty('animation-duration', `${this.glowPeriod.toFixed(3)}s`);
        el.style.setProperty('animation-delay', `${el.dataset.delay}s`);
      }
    }
    this.updatePetalDim();
  }

  start() {
    this.running = true;
    this.svg.classList.remove('sam-paused');
  }

  stop() {
    this.running = false;
    this.svg.classList.add('sam-paused');
  }

  destroy() {
    this.cleanup.forEach((f) => f());
    this.svg.remove();
  }

  // ---------- eventos ----------

  private bindEvents() {
    const onMove = (e: PointerEvent) => {
      const id = this.itemIdAt(e.target);
      if (id !== this.hoverId) this.setHover(id);
    };
    const onLeave = () => this.setHover(null);
    // El navegador sintetiza "click" también al tapear en touch: una sola vía para ambos.
    const onClick = (e: MouseEvent) => {
      const id = this.itemIdAt(e.target);
      if (!id) return;
      const entry = this.petalEls.get(id);
      if (entry) this.onSelect(this.infoFor(id, entry));
    };
    this.svg.addEventListener('pointermove', onMove);
    this.svg.addEventListener('pointerdown', onMove);
    this.svg.addEventListener('pointerleave', onLeave);
    this.svg.addEventListener('click', onClick);
    this.cleanup.push(() => {
      this.svg.removeEventListener('pointermove', onMove);
      this.svg.removeEventListener('pointerdown', onMove);
      this.svg.removeEventListener('pointerleave', onLeave);
      this.svg.removeEventListener('click', onClick);
    });
  }

  private itemIdAt(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null;
    const el = target.closest<SVGElement>('[data-item-id]');
    return el?.dataset.itemId ?? null;
  }

  private infoFor(id: string, entry: PetalEntry): HoverInfo {
    const r = this.svg.getBoundingClientRect();
    const petal = this.findPetalLayout(id);
    const vivid = this.opts.colorMode === 'vivid';
    const color = petal ? (vivid ? petal.vivid : petal.original) : '#888888';
    const innerColor = petal ? (vivid ? petal.vividInner : petal.originalInner) : '#888888';
    // posición aproximada del pétalo en px CSS, para quien quiera anclar algo cerca del cursor
    const box = entry.pos.getBoundingClientRect();
    return {
      item: petal?.item ?? ({} as Item),
      group: entry.ring.group,
      color,
      innerColor,
      x: box.left + box.width / 2 - r.left,
      y: box.top + box.height / 2 - r.top,
    };
  }

  private findPetalLayout(id: string): PetalLayout | undefined {
    return this.lastPetals.find((p) => p.item.id === id);
  }

  private lastPetals: PetalLayout[] = [];

  private setHover(id: string | null) {
    if (id === this.hoverId) return;
    if (this.hoverId) this.applyHoverVisual(this.hoverId, false);
    this.hoverId = id;
    if (id) this.applyHoverVisual(id, true);
    this.updatePetalDim();
    this.emitHover();
  }

  private applyHoverVisual(id: string, hovered: boolean) {
    const entry = this.petalEls.get(id);
    if (!entry) return;
    entry.inner.classList.toggle('sam-hovered', hovered);
    const scale = hovered ? this.opts.hoverScale : 1;
    for (const layer of entry.layers) {
      layer.group.setAttribute('transform', `translate(${layer.tx},0) scale(${layer.k * scale})`);
    }
    const layer0 = entry.layers[0]?.path;
    if (layer0) {
      if (hovered) {
        layer0.dataset.origStroke = layer0.getAttribute('stroke') ?? '';
        layer0.setAttribute('stroke', HOVER_INK);
      } else if (layer0.dataset.origStroke !== undefined) {
        layer0.setAttribute('stroke', layer0.dataset.origStroke);
      }
    }
    if (hovered) {
      // traer al frente dentro de su propio anillo (no por encima de anillos externos: ver plan).
      entry.pos.parentElement?.appendChild(entry.pos);
    }
  }

  private updatePetalDim() {
    for (const [id, entry] of this.petalEls) {
      const isFocusDimmed = this.focus !== null && this.focus !== entry.ring.group.id;
      const isHoverDimmed = !isFocusDimmed && id !== this.hoverId && this.hoverId !== null;
      entry.pos.classList.toggle('sam-dim-petal', isFocusDimmed);
      entry.pos.classList.toggle('sam-dim-hover', isHoverDimmed);
      entry.pos.style.setProperty('--sam-focus-dim', String(this.opts.focusDim));
      entry.pos.style.setProperty('--sam-hover-dim', String(this.opts.hoverDim));
    }
  }

  private emitHover() {
    if (!this.hoverId) return this.onHover(null);
    const entry = this.petalEls.get(this.hoverId);
    if (entry) this.onHover(this.infoFor(this.hoverId, entry));
  }

  // ---------- construcción (reemplaza todo el árbol SVG) ----------

  private render() {
    this.svg.replaceChildren(this.styleEl);
    this.ringEls.clear();
    this.petalEls.clear();
    this.leafSlotEls.clear();

    const o = this.opts;
    const vivid = o.colorMode === 'vivid';
    const theme = o.theme;
    const voidCore = VOID_CORE[theme][o.colorMode];
    const voidRays = VOID_RAYS[theme][o.colorMode];
    const ringBandVoid: readonly [string, number] =
      theme === 'light' ? [VOID_CORE.light.original, 0.62] : [voidCore, vivid ? 0.86 : 0.62];
    const inkColor = vivid ? INK_VIVID : INK_ORIGINAL;
    const inkW = (w: number) => (vivid ? w * 1.75 : w);

    // --- layout de anillos y pétalos: misma matemática que la versión en canvas ---
    // Un grupo mucho más grande que el resto (p. ej. 1 playlist nueva con 97 de 100 canciones en
    // un solo género) se partía en un único anillo carguísimo, casi ilegible. Si pasa de
    // MAX_ITEMS_PER_RING, se reparte en anillos concéntricos del mismo grupo (mismo color/foco),
    // cada uno con tantas canciones como cabrían cómodas en un anillo normal.
    const MAX_ITEMS_PER_RING = 48;
    const specs: Array<{ g: Group; items: Item[]; i: number }> = [];
    this.data.groups.forEach((g, i) => {
      const total = g.items.length;
      if (!total) return;
      const splitCount = Math.ceil(total / MAX_ITEMS_PER_RING);
      if (splitCount <= 1) {
        specs.push({ g, items: g.items, i });
        return;
      }
      const base = Math.floor(total / splitCount);
      const extra = total % splitCount;
      let offset = 0;
      for (let s = 0; s < splitCount; s++) {
        const size = base + (s < extra ? 1 : 0);
        specs.push({ g, items: g.items.slice(offset, offset + size), i });
        offset += size;
      }
    });
    const order = specs.sort((a, b) => a.items.length - b.items.length || a.i - b.i);
    const DSH: Shape[] = ['lotus', 'drop', 'leaf', 'scallop'];
    const rings: RingLayout[] = [];
    const petals: PetalLayout[] = [];
    let r0 = 70;
    let idx = 0;
    order.forEach(({ g, items }, ri) => {
      const n = items.length;
      if (!n) return;
      const th = n < 6 ? 58 : n < 15 ? 50 : 56;
      const r1 = r0 + th;
      const inner = n < o.innerRingMaxItems;
      const L = (r1 - r0) * 1.28;
      const mid = r0 + L * 0.5;
      const slotLen = (2 * Math.PI * mid) / n;
      const ring: RingLayout = {
        group: g,
        index: ri,
        r0,
        r1,
        n,
        shape: n < 15 ? (ri % 2 ? 'drop' : 'lotus') : DSH[ri % 4],
        dir: ri % 2 ? 1 : -1,
        inner,
        L,
        mid,
        w: inner ? Math.min(slotLen * o.innerPetalWidth, L * 0.95) : Math.min(slotLen * 1.02, L * 2.3),
        k: 0,
      };
      rings.push(ring);
      items.forEach((item, j) => {
        const [v, vi] = vividColors(item, g.color, idx++);
        petals.push({ item, ring, slot: j, a0: (360 * j) / n, vivid: v, vividInner: vi, original: item.palette[0], originalInner: contrastColor(item) });
      });
      r0 = r1 - 8;
    });

    this.lastPetals = petals;
    // Sin anillos (datos vacíos, p. ej. mientras se sincroniza Spotify) no hay nada que montar.
    if (!rings.length) return;

    rings.forEach((r, i) => (r.k = rings.length - 1 - i));

    const viewR = Math.max(...rings.map((r) => r.r1)) + 60;
    const fit = W / (2 * viewR);
    const off = -(C - viewR) * fit;

    const { css: glowCss, period: glowPeriod } = buildGlowKeyframes(o.glow, rings.length);
    this.glowPeriod = glowPeriod;
    this.styleEl.textContent = buildStyleSheet(glowCss, o.glow.max);

    const root = svgEl('g', { transform: `translate(${off} ${off}) scale(${fit})` });
    this.svg.appendChild(root);

    // --- fondo de rayos ---
    const R = Math.max(...rings.map((r) => r.r1)) + 40;
    const rays = 40;
    const bgDur = 360 / Math.max(o.backgroundSpinSpeed, 1e-6);
    const bg = svgEl('g', { style: spinStyle(bgDur, 'reverse') });
    for (let k = 0; k < rays; k++) {
      const a0 = (k * 360) / rays;
      const a1 = ((k + 1) * 360) / rays;
      const x0 = C + R * Math.cos(rad(a0));
      const y0 = C + R * Math.sin(rad(a0));
      const x1 = C + R * Math.cos(rad(a1));
      const y1 = C + R * Math.sin(rad(a1));
      bg.appendChild(svgEl('path', { d: `M${C},${C} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`, fill: k % 2 ? voidRays[0] : voidRays[1] }));
    }
    root.appendChild(bg);
    root.appendChild(svgEl('circle', { cx: C, cy: C, r: R, fill: 'none', stroke: inkColor, 'stroke-width': inkW(4) }));

    // --- bandas de cada anillo (de afuera hacia adentro) ---
    const [bandVoidC, bandRatio] = ringBandVoid;
    [...rings].reverse().forEach((rg) => {
      const band = svgEl('g', { class: 'sam-ring-band' });
      band.appendChild(svgEl('path', { d: annulusPathD(C, C, rg.r0 + 2, rg.r1 + 4), 'fill-rule': 'evenodd', fill: inkColor }));
      band.appendChild(svgEl('path', { d: annulusPathD(C, C, rg.r0 + 2, rg.r1), 'fill-rule': 'evenodd', fill: mix(rg.group.color, bandVoidC, bandRatio) }));
      root.appendChild(band);
      this.ringEls.set(rg.group.id, { band });
    });

    // --- hojas y pétalos, de afuera hacia adentro ---
    const ringDur = 360 / Math.max(o.ringRotationSpeed, 1e-6);
    [...rings].reverse().forEach((rg) => {
      const spin = svgEl('g', { style: spinStyle(ringDur, rg.dir === 1 ? 'normal' : 'reverse') });
      const baseColor = leafBaseColor(rg, vivid, theme, voidCore);
      const litColor = leafLitColor(rg, vivid, theme);
      const { n, L, mid, w } = rg;

      for (let j = 0; j < n; j++) {
        const delay = rg.k / Math.max(o.glow.speed, 1e-6);
        const slotWrap = svgEl('g', {
          class: 'sam-leaf-slot',
          style: `--sam-base:${baseColor};--sam-lit:${litColor};animation-name:sam-glow;animation-duration:${glowPeriod.toFixed(3)}s;animation-timing-function:linear;animation-iteration-count:infinite;animation-delay:${delay.toFixed(3)}s;`,
        });
        slotWrap.dataset.ring = rg.group.id;
        slotWrap.dataset.slot = String(j);
        slotWrap.dataset.delay = delay.toFixed(3);
        // Clave por instancia de anillo (rg.index), no solo por grupo: un grupo partido en varios
        // anillos (ver MAX_ITEMS_PER_RING) reusa índices de hoja 0..n en cada uno, y colisionarían.
        this.leafSlotEls.set(`${rg.index}:${j}`, slotWrap);

        if (rg.inner) {
          const slot = 360 / n;
          const gap = (2 * Math.PI * mid) / n - w * 1.25;
          const m = Math.max(1, Math.round(gap / (L * 0.55)));
          for (let i = 0; i < m; i++) {
            const ang = (360 * j) / n + (slot * (i + 1)) / (m + 1);
            const lw = Math.min((gap / m) * 0.72, L * 0.6);
            const ll = L * (i % 2 ? 0.82 : 0.98);
            const g = svgEl('g', { transform: `translate(${C} ${C}) rotate(${ang}) translate(${rg.r0 + L * 0.06},0)` });
            g.appendChild(svgEl('path', { d: petalPathD('leaf', ll, lw), class: 'sam-leaf-fill', stroke: inkColor, 'stroke-width': inkW(1.8) }));
            g.appendChild(svgEl('path', { d: `M${ll * 0.12},0 L${ll * 0.86},0`, fill: 'none', stroke: inkColor, 'stroke-width': inkW(1.2) }));
            slotWrap.appendChild(g);
          }
        } else {
          const ang = (360 * (j + 0.5)) / n;
          const g = svgEl('g', { transform: `translate(${C} ${C}) rotate(${ang}) translate(${rg.r0 + L * 0.1},0)` });
          g.appendChild(svgEl('path', { d: petalPathD('leaf', L * 1.2, w * 0.62), class: 'sam-leaf-fill', stroke: inkColor, 'stroke-width': inkW(1.8) }));
          g.appendChild(svgEl('path', { d: `M${L * 0.12},0 L${L * 1.08},0`, fill: 'none', stroke: inkColor, 'stroke-width': inkW(1.2) }));
          slotWrap.appendChild(g);
        }
        spin.appendChild(slotWrap);
      }

      for (const p of petals) {
        if (p.ring !== rg) continue;
        this.appendPetal(spin, p, vivid, voidCore, inkColor, inkW);
      }

      root.appendChild(spin);
    });

    // --- centro de puntos ---
    const cr = rings[0].r0 - 2;
    root.appendChild(svgEl('circle', { cx: C, cy: C, r: cr + 3, fill: voidCore }));

    const leavesDur = 360 / Math.max(o.centerSpinSpeed, 1e-6);
    const leavesSpin = svgEl('g', { style: spinStyle(leavesDur, 'reverse') });
    for (let k = 0; k < 12; k++) {
      const g = svgEl('g', { transform: `translate(${C} ${C}) rotate(${k * 30}) translate(${cr * 0.3} 0)` });
      appendDotLeaf(g, cr * 0.66, cr * 0.17, '#2de2e6', '#ffffff', '#f4d35e', 2.2);
      leavesSpin.appendChild(g);
    }
    root.appendChild(leavesSpin);

    const dotsSpin = svgEl('g', { style: spinStyle(leavesDur, 'normal') });
    const dotsCfg: Array<[number, number, string, number]> = [
      [cr * 0.9, 22, '#2de2e6', 2.4],
      [cr * 0.26, 10, '#f4d35e', 2.2],
    ];
    for (const [r, nn, c, dr] of dotsCfg) {
      for (let k = 0; k < nn; k++) {
        const a = (k * 360) / nn;
        const g = svgEl('g', { transform: `rotate(${a} ${C} ${C})` });
        g.appendChild(svgEl('circle', { cx: C + r, cy: C, r: dr, fill: c }));
        dotsSpin.appendChild(g);
      }
    }
    root.appendChild(dotsSpin);

    root.appendChild(svgEl('circle', { cx: C, cy: C, r: cr * 0.16, fill: '#ffffff', stroke: inkColor, 'stroke-width': inkW(2) }));
    root.appendChild(svgEl('circle', { cx: C, cy: C, r: cr * 0.07, fill: '#2de2e6' }));

    // reaplicar foco/hover (p. ej. tras un setOptions) ya que render() reconstruye todo el árbol.
    this.setFocus(this.focus);
    if (this.hoverId && this.petalEls.has(this.hoverId)) this.applyHoverVisual(this.hoverId, true);
    else this.hoverId = null;
  }

  private appendPetal(
    spin: SVGGElement,
    p: PetalLayout,
    vivid: boolean,
    voidCore: string,
    inkColor: string,
    inkW: (w: number) => number,
  ) {
    const rg = p.ring;
    const outerColor = vivid ? p.vivid : p.original;
    const innerColor = vivid ? p.vividInner : p.originalInner;
    const layersSpec: Array<[number, string]> = vivid
      ? [
          [1, rg.group.color],
          [0.78, voidCore],
          [0.72, outerColor],
          [0.42, innerColor],
        ]
      : [
          [1, rg.group.color],
          [0.7, outerColor],
          [0.42, innerColor],
        ];

    const pos = svgEl('g', { transform: `translate(${C} ${C}) rotate(${p.a0}) translate(${rg.r0},0)` });
    const inner = svgEl('g', { class: 'sam-petal' });
    inner.dataset.itemId = p.item.id;

    const layers: PetalLayerRef[] = [];
    layersSpec.forEach(([k, col], li) => {
      const tx = li ? rg.L * (1 - k) * 0.2 : 0;
      const group = svgEl('g', { transform: `translate(${tx},0) scale(${k})` });
      const path = svgEl('path', {
        d: petalPathD(rg.shape, rg.L, rg.w),
        fill: col,
        stroke: inkColor,
        'stroke-width': (inkW(2.2) / k).toFixed(3),
      });
      group.appendChild(path);
      if (rg.shape === 'leaf' && li === 0) {
        group.appendChild(svgEl('path', { d: veinsPathD(rg.L, rg.w), fill: 'none', stroke: inkColor, 'stroke-width': (inkW(1.3) / k).toFixed(3) }));
      }
      inner.appendChild(group);
      layers.push({ group, path, tx, k });
    });

    pos.appendChild(inner);
    spin.appendChild(pos);
    this.petalEls.set(p.item.id, { pos, inner, layers, ring: rg });

    // punto dorado entre elementos
    const ad = p.a0 + 180 / rg.n;
    const rr = rg.r0 + (rg.inner ? 5 : 7);
    const dotG = svgEl('g', { transform: `translate(${C} ${C}) rotate(${ad}) translate(${rr},0)` });
    dotG.appendChild(
      svgEl('circle', {
        cx: 0,
        cy: 0,
        r: rg.inner ? 2.6 : 3.6,
        fill: '#f4d35e',
        ...(rg.inner ? {} : { stroke: inkColor, 'stroke-width': inkW(1.2) }),
      }),
    );
    spin.appendChild(dotG);
  }
}

function buildStyleSheet(glowKeyframesCss: string, glowMax: number): string {
  return `
@property --sam-glow { syntax: '<number>'; inherits: true; initial-value: 0; }
${glowKeyframesCss}
@keyframes sam-breathe { 0%, 100% { --sam-glow: 0; } 50% { --sam-glow: ${glowMax}; } }
@keyframes sam-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.sam-mandala.sam-paused * { animation-play-state: paused !important; }
.sam-leaf-fill { fill: color-mix(in srgb, var(--sam-base) calc((1 - var(--sam-glow)) * 100%), var(--sam-lit) calc(var(--sam-glow) * 100%)); }
.sam-ring-band.sam-dim-band { opacity: 0.25; }
.sam-leaf-slot.sam-dim-leaf { opacity: 0.12; animation-play-state: paused; }
.sam-dim-petal { opacity: var(--sam-focus-dim, 0.15); pointer-events: none; }
.sam-dim-hover { opacity: var(--sam-hover-dim, 0.62); }
.sam-petal { cursor: pointer; }
@media (prefers-reduced-motion: reduce) {
  .sam-mandala [style*='animation-name'] { animation: none !important; }
}
`;
}
