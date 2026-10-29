<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ColorMode, FigureData, HoverInfo } from '@samotracia/figures';
import MandalaCanvas from './components/MandalaCanvas.vue';
import coreLore from './data/core-lore.json';
import { useTheme } from './composables/useTheme';

const data = coreLore as FigureData & { sourceUrl: string; capturedAt: string };
const { theme, setTheme } = useTheme();
const colorMode = ref<ColorMode>('vivid');
const focus = ref<string | null>(null);
const hover = ref<HoverInfo | null>(null);

const total = computed(() => data.groups.reduce((s, g) => s + g.items.length, 0));
const cardStyle = computed(() => {
  const h = hover.value;
  if (!h) return {};
  return { left: `${h.x + 18}px`, top: `${h.y}px` };
});
</script>

<template>
  <main class="wrap">
    <header class="head">
      <span class="eyebrow">Samotracia · Él</span>
      <h1>{{ data.title }}</h1>
      <p class="muted">{{ data.description }} · {{ total }} canciones · {{ data.groups.length }} géneros</p>
    </header>

    <div class="toolbar">
      <div class="seg" role="group" aria-label="Tema">
        <button type="button" :aria-pressed="theme === 'light'" @click="setTheme('light')">Claro</button>
        <button type="button" :aria-pressed="theme === 'dark'" @click="setTheme('dark')">Oscuro</button>
      </div>
      <div class="seg" role="group" aria-label="Colores">
        <button type="button" :aria-pressed="colorMode === 'vivid'" @click="colorMode = 'vivid'">Colores vivos</button>
        <button type="button" :aria-pressed="colorMode === 'original'" @click="colorMode = 'original'">Colores originales</button>
      </div>
      <div class="chips">
        <button type="button" :aria-pressed="focus === null" @click="focus = null">Todos</button>
        <button
          v-for="g in data.groups"
          :key="g.id"
          type="button"
          :aria-pressed="focus === g.id"
          @click="focus = focus === g.id ? null : g.id"
        >
          <i class="dot" :style="{ background: g.color }" />{{ g.name }} <span class="count">{{ g.items.length }}</span>
        </button>
      </div>
    </div>

    <section class="stage">
      <MandalaCanvas :data="data" :color-mode="colorMode" :theme="theme" :focus="focus" @hover="hover = $event" />
      <div v-if="hover" class="card" :style="cardStyle">
        <div class="swatch">
          <i :style="{ background: hover.color }" />
          <i v-for="c in hover.item.palette" :key="c" :style="{ background: c }" />
        </div>
        <div class="txt">
          <span class="eyebrow" :style="{ color: hover.group.color }">{{ hover.group.name }} · #{{ hover.item.position }}</span>
          <strong>{{ hover.item.title }}</strong>
          <span class="muted">{{ hover.item.subtitle }}</span>
          <a v-if="hover.item.sourceUrl" :href="hover.item.sourceUrl" target="_blank" rel="noopener">Buscar en Spotify ↗</a>
        </div>
      </div>
    </section>

    <footer class="muted">
      Datos: <a :href="data.sourceUrl" target="_blank" rel="noopener">playlist en Spotify</a>, leída el {{ data.capturedAt }}.
      Los géneros son una clasificación propia.
    </footer>
  </main>
</template>

<style scoped>
.wrap { max-width: 1080px; margin: 0 auto; padding: 32px max(16px, env(safe-area-inset-left)) 48px; display: flex; flex-direction: column; gap: 20px; }
.head { display: flex; flex-direction: column; gap: 4px; }
h1 { font-family: var(--display); font-weight: 800; font-size: clamp(40px, 8vw, 80px); line-height: 0.95; margin: 0; }
.eyebrow { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
.muted { color: var(--muted); margin: 0; }
a { color: var(--accent); }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; }
.seg, .chips { display: flex; flex-wrap: wrap; gap: 6px; }
.seg { border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
button { color: var(--ink); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.seg button { border: 0; }
button[aria-pressed='true'] { background: var(--ink); color: var(--bg); }
.chips button[aria-pressed='true'] { background: var(--line); color: var(--ink); border-color: var(--muted); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.count { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.stage { position: relative; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
.card { position: absolute; z-index: 2; width: min(280px, calc(100% - 24px)); transform: translateY(-50%); background: var(--bg); border: 1px solid var(--line); border-radius: 10px; padding: 10px; display: flex; gap: 12px; pointer-events: none; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); }
.swatch { width: 72px; height: 72px; flex: none; border-radius: 6px; overflow: hidden; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: 2fr 1fr; }
.swatch i:first-child { grid-column: 1 / 5; }
.txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: 13px; }
.txt strong { font-family: var(--display); font-size: 16px; line-height: 1.2; }
footer { font-size: 12px; }
</style>
