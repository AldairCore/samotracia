import { contrastColor, mix, vividColors, vividGroup } from './color';
import type { ColorMode, FigureData, Group, HoverInfo, Item } from './types';

/**
 * Mandala de Samotracia.
 *
 * Cada anillo es un grupo (del más pequeño al centro al más grande afuera) y cada pétalo un elemento.
 * El pétalo tiene capas: color del grupo, anillo negro (modo vivo), color del elemento y su complementario.
 * Entre pétalos hay hojas apagadas (ornamento, no datos) que se encienden con una onda de luz
 * que viaja de afuera hacia el centro.
 *
 * Todos los números que se fueron afinando en el prototipo viven en MandalaOptions.
 */
export interface MandalaOptions {
  colorMode: ColorMode;
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

interface Ring {
  group: Group;
  index: number;
  r0: number;
  r1: number;
  n: number;
  shape: Shape;
  dir: 1 | -1;
  inner: boolean;
  // derivados
  L: number;
  mid: number;
  w: number;
}

interface Petal {
  item: Item;
  ring: Ring;
  slot: number;
  a0: number;
  vivid: string;
  vividInner: string;
  original: string;
  originalInner: string;
  // posición actual (lógica) para detectar el cursor
  hx: number;
  hy: number;
}

const W = 1000;
const C = 500;
const INK_ORIGINAL = '#140c18';
const INK_VIVID = '#050307';
const HOVER_INK = '#ece7f2';
const rad = (d: number) => (d * Math.PI) / 180;

export class MandalaFigure {
  private ctx: CanvasRenderingContext2D;
  private opts: MandalaOptions;
  private rings: Ring[] = [];
  private petals: Petal[] = [];
  private viewR = 500;
  private fit = 1;
  private off = 0;
  private scale = 1;
  private hover: Petal | null = null;
  private focus: string | null = null;
  private raf = 0;
  private running = false;
  private visible = true;
  private startTime = performance.now();
  private reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private cleanup: Array<() => void> = [];

  /** Se llama cuando cambia el elemento bajo el cursor (null al salir). */
  onHover: (info: HoverInfo | null) => void = () => {};

  constructor(
    private canvas: HTMLCanvasElement,
    data: FigureData,
    options: Partial<MandalaOptions> = {},
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
    this.opts = { ...defaultMandalaOptions, ...options, glow: { ...defaultMandalaOptions.glow, ...options.glow } };
    this.setData(data);
    this.bindEvents();
    this.resize();
  }

  // ---------- API pública ----------

  setData(data: FigureData) {
    const order = data.groups.map((g, i) => ({ g, i })).sort((a, b) => a.g.items.length - b.g.items.length || a.i - b.i);
    const DSH: Shape[] = ['lotus', 'drop', 'leaf', 'scallop'];
    this.rings = [];
    this.petals = [];
    let r0 = 70;
    let idx = 0;
    order.forEach(({ g }, ri) => {
      const n = g.items.length;
      if (!n) return;
      const th = n < 6 ? 58 : n < 15 ? 50 : 56;
      const r1 = r0 + th;
      const inner = n < this.opts.innerRingMaxItems;
      const L = (r1 - r0) * 1.28;
      const mid = r0 + L * 0.5;
      const slotLen = (2 * Math.PI * mid) / n;
      const ring: Ring = {
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
        w: inner ? Math.min(slotLen * this.opts.innerPetalWidth, L * 0.95) : Math.min(slotLen * 1.02, L * 2.3),
      };
      this.rings.push(ring);
      g.items.forEach((item, j) => {
        const [vivid, vividInner] = vividColors(item, g.color, idx++);
        this.petals.push({
          item,
          ring,
          slot: j,
          a0: (360 * j) / n,
          vivid,
          vividInner,
          original: item.palette[0],
          originalInner: contrastColor(item),
          hx: 0,
          hy: 0,
        });
      });
      r0 = r1 - 8;
    });
    this.viewR = Math.max(...this.rings.map((r) => r.r1)) + 60;
    this.fit = W / (2 * this.viewR);
    this.off = -(C - this.viewR) * this.fit;
    this.hover = null;
    this.requestDraw();
  }

  setOptions(options: Partial<MandalaOptions>) {
    this.opts = { ...this.opts, ...options, glow: { ...this.opts.glow, ...options.glow } };
    this.setData({ title: '', groups: this.rings.map((r) => r.group) });
  }

  setColorMode(mode: ColorMode) {
    this.opts.colorMode = mode;
    this.requestDraw();
  }

  /** Resalta un grupo (id) o todos (null). */
  setFocus(groupId: string | null) {
    this.focus = groupId;
    this.requestDraw();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.io?.disconnect();
    this.ro?.disconnect();
    this.cleanup.forEach((f) => f());
  }

  // ---------- ciclo de dibujo ----------

  private loop = () => {
    if (!this.running) return;
    if (this.visible && !document.hidden) this.draw();
    if (!this.reduceMotion) this.raf = requestAnimationFrame(this.loop);
  };

  private requestDraw() {
    if (this.reduceMotion || !this.running) requestAnimationFrame(() => this.draw());
  }

  private resize() {
    const cssW = this.canvas.clientWidth || 600;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssW * dpr);
    this.scale = this.canvas.width / W;
    this.requestDraw();
  }

  private bindEvents() {
    const onMove = (e: PointerEvent) => {
      const p = this.pick(e);
      if (p !== this.hover) {
        this.hover = p;
        this.emitHover();
        this.requestDraw();
      }
    };
    const onLeave = () => {
      this.hover = null;
      this.emitHover();
      this.requestDraw();
    };
    this.canvas.addEventListener('pointermove', onMove);
    this.canvas.addEventListener('pointerdown', onMove);
    this.canvas.addEventListener('pointerleave', onLeave);
    this.cleanup.push(() => {
      this.canvas.removeEventListener('pointermove', onMove);
      this.canvas.removeEventListener('pointerdown', onMove);
      this.canvas.removeEventListener('pointerleave', onLeave);
    });
    // pausa cuando no se ve
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(this.canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
  }

  private pick(e: PointerEvent): Petal | null {
    const r = this.canvas.getBoundingClientRect();
    const x = (((e.clientX - r.left) / r.width) * W - this.off) / this.fit;
    const y = (((e.clientY - r.top) / r.height) * W - this.off) / this.fit;
    let best: Petal | null = null;
    let bd = ((r.width < 600 ? 34 : 24) / this.fit) ** 2;
    for (const p of this.petals) {
      if (this.focus && p.ring.group.id !== this.focus) continue;
      const d = (p.hx - x) ** 2 + (p.hy - y) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  private emitHover() {
    const p = this.hover;
    if (!p) return this.onHover(null);
    const r = this.canvas.getBoundingClientRect();
    const vivid = this.opts.colorMode === 'vivid';
    this.onHover({
      item: p.item,
      group: p.ring.group,
      color: vivid ? p.vivid : p.original,
      innerColor: vivid ? p.vividInner : p.originalInner,
      x: ((p.hx * this.fit + this.off) / W) * r.width,
      y: ((p.hy * this.fit + this.off) / W) * r.height,
    });
  }

  // ---------- primitivas ----------

  private get vivid() {
    return this.opts.colorMode === 'vivid';
  }

  private fill(c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fill();
  }

  /** Contorno de tinta: en modo vivo es más grueso y casi negro. */
  private ink(width: number) {
    const ctx = this.ctx;
    ctx.lineWidth = this.vivid ? width * 1.75 : width;
    ctx.strokeStyle = this.vivid ? INK_VIVID : INK_ORIGINAL;
    ctx.stroke();
  }

  private petalPath(shape: Shape, L: number, w: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (shape === 'drop') {
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * 0.3, -w * 0.62, L * 1.04, -w * 0.66, L, 0);
      ctx.bezierCurveTo(L * 1.04, w * 0.66, L * 0.3, w * 0.62, 0, 0);
    } else if (shape === 'leaf') {
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(L * 0.5, -w * 0.75, L, 0);
      ctx.quadraticCurveTo(L * 0.5, w * 0.75, 0, 0);
    } else if (shape === 'scallop') {
      const rr = Math.min(w / 2, L * 0.6);
      ctx.moveTo(0, -w * 0.42);
      ctx.lineTo(L - rr, -w * 0.5);
      ctx.arc(L - rr, 0, rr, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, w * 0.42);
      ctx.closePath();
    } else {
      ctx.moveTo(0, -w * 0.3);
      ctx.bezierCurveTo(L * 0.25, -w * 0.62, L * 0.72, -w * 0.5, L, 0);
      ctx.bezierCurveTo(L * 0.72, w * 0.5, L * 0.25, w * 0.62, 0, w * 0.3);
      ctx.closePath();
    }
  }

  /** Hoja de puntos (centro del mandala). */
  private dotLeaf(L: number, hw: number, c0: string, c1: string, c2: string, dr: number) {
    const ctx = this.ctx;
    const halfW = (t: number, h: number) => h * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.85);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) ctx.lineTo(L * (i / 24), -halfW(i / 24, hw));
    for (let i = 24; i >= 0; i--) ctx.lineTo(L * (i / 24), halfW(i / 24, hw));
    ctx.closePath();
    this.fill(INK_VIVID);
    const dot = (x: number, y: number, r: number, c: string) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      this.fill(c);
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

  /** Brillo (0–1) de una hoja: onda por anillos de afuera hacia adentro + hojas junto al elemento bajo el cursor. */
  private leafGlow(T: number, ring: Ring, slot: number) {
    const g = this.opts.glow;
    let b = 0;
    if (g.enabled) {
      const N = this.rings.length;
      const k = N - 1 - ring.index;
      const ph = ((T * g.speed) % (N + g.pause)) - 1.5;
      const d = ph - k;
      if (Math.abs(d) < g.width) b = g.max * (0.5 + 0.5 * Math.cos((Math.PI * d) / g.width)) ** 1.6;
    }
    const h = this.hover;
    if (h && h.ring === ring) {
      const n = ring.n;
      if (slot === h.slot || slot === (h.slot - 1 + n) % n) b = 1;
    }
    return b;
  }

  private leafColor(ring: Ring, glow: number) {
    const gc = ring.group.color;
    const base = this.vivid ? mix(gc, INK_VIVID, 0.55) : mix(gc, INK_ORIGINAL, 0.35);
    if (glow < 0.02) return base;
    return mix(base, this.vivid ? vividGroup(gc) : gc, glow);
  }

  private drawPetal(p: Petal, rot: number, s: number, alpha: number, hovered: boolean) {
    const ctx = this.ctx;
    const { ring } = p;
    const { L, w, shape } = ring;
    const gc = ring.group.color;
    const outer = this.vivid ? p.vivid : p.original;
    const inner = this.vivid ? p.vividInner : p.originalInner;
    const layers: Array<[number, string]> = this.vivid
      ? [[1, gc], [0.78, INK_VIVID], [0.72, outer], [0.42, inner]]
      : [[1, gc], [0.7, outer], [0.42, inner]];
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(rad(p.a0 + rot));
    ctx.translate(ring.r0, 0);
    ctx.globalAlpha = alpha;
    layers.forEach(([k, col], li) => {
      ctx.save();
      ctx.translate(li ? L * (1 - k) * 0.2 : 0, 0);
      ctx.scale(k * s, k * s);
      this.petalPath(shape, L, w);
      this.fill(col);
      if (hovered && !li) {
        ctx.lineWidth = 3.4 / (k * s);
        ctx.strokeStyle = HOVER_INK;
        ctx.stroke();
      } else this.ink(2.2 / (k * s));
      if (shape === 'leaf' && li === 0) {
        ctx.beginPath();
        ctx.moveTo(L * 0.05, 0);
        ctx.lineTo(L * 0.95, 0);
        for (let v = 1; v < 5; v++) {
          const x = (L * v) / 5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x + L * 0.08, -w * 0.22);
          ctx.moveTo(x, 0);
          ctx.lineTo(x + L * 0.08, w * 0.22);
        }
        this.ink(1.3 / (k * s));
      }
      ctx.restore();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ---------- dibujo principal ----------

  private draw() {
    const ctx = this.ctx;
    const o = this.opts;
    const T = this.reduceMotion ? 0 : (performance.now() - this.startTime) / 1000;
    const dimGroup = (g: Group) => this.focus !== null && this.focus !== g.id;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.scale * this.fit, 0, 0, this.scale * this.fit, this.scale * this.off, this.scale * this.off);

    // fondo de rayos
    const R = Math.max(...this.rings.map((r) => r.r1)) + 40;
    const rays = 40;
    const bgRot = -T * o.backgroundSpinSpeed;
    for (let k = 0; k < rays; k++) {
      ctx.fillStyle = this.vivid ? (k % 2 ? '#07050a' : '#120c18') : k % 2 ? '#1f1628' : '#2a1d35';
      ctx.beginPath();
      ctx.moveTo(C, C);
      ctx.arc(C, C, R, rad(bgRot + (k * 360) / rays), rad(bgRot + ((k + 1) * 360) / rays));
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(C, C, R, 0, Math.PI * 2);
    this.ink(4);

    // bandas de cada anillo
    [...this.rings].reverse().forEach((rg) => {
      ctx.globalAlpha = dimGroup(rg.group) ? 0.25 : 1;
      ctx.beginPath();
      ctx.arc(C, C, rg.r1 + 4, 0, Math.PI * 2);
      this.fill(this.vivid ? INK_VIVID : INK_ORIGINAL);
      ctx.beginPath();
      ctx.arc(C, C, rg.r1, 0, Math.PI * 2);
      ctx.arc(C, C, rg.r0 + 2, 0, Math.PI * 2, true);
      this.fill(mix(rg.group.color, INK_VIVID, this.vivid ? 0.86 : 0.62));
      ctx.globalAlpha = 1;
    });

    const hovering = this.hover !== null;
    // hojas y pétalos, de afuera hacia adentro
    [...this.rings].reverse().forEach((rg) => {
      const rot = rg.dir * T * o.ringRotationSpeed;
      const { n, L, mid, w } = rg;
      const dimR = dimGroup(rg.group);

      for (let j = 0; j < n; j++) {
        if (rg.inner) {
          const slot = 360 / n;
          const gap = (2 * Math.PI * mid) / n - w * 1.25;
          const m = Math.max(1, Math.round(gap / (L * 0.55)));
          for (let i = 0; i < m; i++) {
            ctx.save();
            ctx.translate(C, C);
            ctx.rotate(rad((360 * j) / n + rot) + (rad(slot) * (i + 1)) / (m + 1));
            ctx.translate(rg.r0 + L * 0.06, 0);
            ctx.globalAlpha = dimR ? 0.12 : 1;
            const lw = Math.min((gap / m) * 0.72, L * 0.6);
            const ll = L * (i % 2 ? 0.82 : 0.98);
            this.petalPath('leaf', ll, lw);
            this.fill(this.leafColor(rg, this.leafGlow(T, rg, j)));
            this.ink(1.8);
            ctx.beginPath();
            ctx.moveTo(ll * 0.12, 0);
            ctx.lineTo(ll * 0.86, 0);
            this.ink(1.2);
            ctx.restore();
          }
        } else {
          ctx.save();
          ctx.translate(C, C);
          ctx.rotate(rad((360 * (j + 0.5)) / n + rot));
          ctx.translate(rg.r0 + L * 0.1, 0);
          ctx.globalAlpha = dimR ? 0.12 : 1;
          this.petalPath('leaf', L * 1.2, w * 0.62);
          this.fill(this.leafColor(rg, this.leafGlow(T, rg, j)));
          this.ink(1.8);
          ctx.beginPath();
          ctx.moveTo(L * 0.12, 0);
          ctx.lineTo(L * 1.08, 0);
          this.ink(1.2);
          ctx.restore();
        }
      }

      for (const p of this.petals) {
        if (p.ring !== rg) continue;
        const a = rad(p.a0 + rot);
        p.hx = C + Math.cos(a) * mid;
        p.hy = C + Math.sin(a) * mid;
        const alpha = dimGroup(rg.group) ? o.focusDim : hovering && this.hover !== p ? o.hoverDim : 1;
        this.drawPetal(p, rot, 1, alpha, false);
        // punto dorado entre elementos
        const ad = rad(p.a0 + 180 / n + rot);
        const rr = rg.r0 + (rg.inner ? 5 : 7);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(C + Math.cos(ad) * rr, C + Math.sin(ad) * rr, rg.inner ? 2.6 : 3.6, 0, Math.PI * 2);
        this.fill('#f4d35e');
        if (!rg.inner) this.ink(1.2);
        ctx.globalAlpha = 1;
      }
    });

    // elemento bajo el cursor, encima de todo
    if (this.hover) {
      const rot = this.hover.ring.dir * T * o.ringRotationSpeed;
      this.drawPetal(this.hover, rot, o.hoverScale, 1, true);
    }

    // centro de puntos
    const cr = this.rings[0].r0 - 2;
    const crot = -T * o.centerSpinSpeed;
    ctx.beginPath();
    ctx.arc(C, C, cr + 3, 0, Math.PI * 2);
    this.fill(this.vivid ? INK_VIVID : INK_ORIGINAL);
    for (let k = 0; k < 12; k++) {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(rad(crot + k * 30));
      ctx.translate(cr * 0.3, 0);
      this.dotLeaf(cr * 0.66, cr * 0.17, '#2de2e6', '#ffffff', '#f4d35e', 2.2);
      ctx.restore();
    }
    const dots: Array<[number, number, string, number]> = [
      [cr * 0.9, 22, '#2de2e6', 2.4],
      [cr * 0.26, 10, '#f4d35e', 2.2],
    ];
    for (const [r, nn, c, dr] of dots) {
      for (let k = 0; k < nn; k++) {
        const a = rad((k * 360) / nn - crot);
        ctx.beginPath();
        ctx.arc(C + Math.cos(a) * r, C + Math.sin(a) * r, dr, 0, Math.PI * 2);
        this.fill(c);
      }
    }
    ctx.beginPath();
    ctx.arc(C, C, cr * 0.16, 0, Math.PI * 2);
    this.fill('#ffffff');
    this.ink(2);
    ctx.beginPath();
    ctx.arc(C, C, cr * 0.07, 0, Math.PI * 2);
    this.fill('#2de2e6');

  }
}
