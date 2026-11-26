<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ColorMode, HoverInfo } from '@samotracia/figures';
import MandalaCanvas from './components/MandalaCanvas.vue';
import { useTheme } from './composables/useTheme';
import { useSpotifyLibrary } from './composables/useSpotifyLibrary';

const {
  library: data,
  status,
  lastSyncedAt,
  loading,
  error,
  isAuthenticated,
  playlists,
  groups,
  login,
  logout,
  refresh,
  addPlaylist,
  removePlaylist,
  assignGroup,
  exportSnapshot,
  importSnapshot,
} = useSpotifyLibrary();

const { theme, setTheme } = useTheme();
const colorMode = ref<ColorMode>('vivid');
const focus = ref<string | null>(null);
const selected = ref<HoverInfo | null>(null);
const coverFailed = ref(false);
const hover = ref<HoverInfo | null>(null);
/** La etiqueta de hover solo tiene sentido con mouse: en touch no hay "encima" sostenido. */
const supportsHover = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches;
const newPlaylistInput = ref('');
const playlistError = ref<string | null>(null);
const exportText = ref('');
const importText = ref('');
const transferMessage = ref<string | null>(null);

watch(selected, () => {
  coverFailed.value = false;
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') selected.value = null;
}

onMounted(() => {
  if (isAuthenticated.value) refresh();
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

const total = computed(() => data.value.groups.reduce((s, g) => s + g.items.length, 0));
const hoverLabelStyle = computed(() => {
  const h = hover.value;
  if (!h) return {};
  return { left: `${h.x}px`, top: `${h.y - 16}px` };
});
const hoverLabel = computed(() => {
  const h = hover.value;
  if (!h) return '';
  return h.item.subtitle ? `${h.item.subtitle} - ${h.item.title}` : h.item.title;
});

const relativeSync = computed(() => {
  if (!lastSyncedAt.value) return '';
  const minutes = Math.round((Date.now() - new Date(lastSyncedAt.value).getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.round(minutes / 60)} h`;
});

const statusLabel = computed(() => {
  if (loading.value) return 'Sincronizando…';
  if (status.value === 'live') return `En vivo · ${relativeSync.value}`;
  if (status.value === 'cached') return `Datos guardados · ${relativeSync.value}`;
  if (status.value === 'imported') return `Datos importados · ${relativeSync.value}`;
  return 'Sin sincronizar';
});

const unclassifiedItems = computed(() => data.value.groups.find((g) => g.id === 'unclassified')?.items ?? []);
const assignableGroups = computed(() => groups.value.filter((g) => g.id !== 'unclassified'));

function onAddPlaylist() {
  playlistError.value = null;
  if (!addPlaylist(newPlaylistInput.value)) {
    playlistError.value = 'URL o ID de playlist no válido, o ya está agregada.';
    return;
  }
  newPlaylistInput.value = '';
  refresh(true);
}

function onRemovePlaylist(id: string) {
  removePlaylist(id);
  refresh(true);
}

function onReassign(event: Event, itemId: string) {
  const select = event.target as HTMLSelectElement;
  if (!select.value) return;
  assignGroup(itemId, select.value);
  select.value = '';
}

async function onExport() {
  exportText.value = exportSnapshot();
  try {
    await navigator.clipboard.writeText(exportText.value);
    transferMessage.value = 'Copiado al portapapeles.';
  } catch {
    transferMessage.value = 'No se pudo copiar solo: selecciona el texto de abajo y cópialo a mano.';
  }
}

function onImport() {
  transferMessage.value = importSnapshot(importText.value)
    ? 'Datos importados.'
    : 'No se pudo leer ese texto — revisa que esté completo.';
  if (transferMessage.value === 'Datos importados.') importText.value = '';
}
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
      <div class="seg" role="group" aria-label="Spotify">
        <button v-if="!isAuthenticated" type="button" @click="login">Conectar con Spotify</button>
        <template v-else>
          <button type="button" :disabled="loading" @click="refresh(true)">{{ loading ? 'Sincronizando…' : 'Actualizar' }}</button>
          <button type="button" @click="logout">Cerrar sesión</button>
        </template>
      </div>
      <span v-if="isAuthenticated || status === 'imported'" class="muted sync-status">{{ statusLabel }}</span>
      <span v-if="error" class="error">{{ error }}</span>
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

    <div v-if="isAuthenticated" class="playlists">
      <span v-for="p in playlists" :key="p.id" class="chip">
        {{ p.label }}
        <button type="button" class="chip-remove" :aria-label="`Quitar ${p.label}`" @click="onRemovePlaylist(p.id)">✕</button>
      </span>
      <input v-model="newPlaylistInput" type="text" placeholder="URL o ID de otra playlist tuya" @keyup.enter="onAddPlaylist" />
      <button type="button" @click="onAddPlaylist">Agregar</button>
      <span v-if="playlistError" class="error">{{ playlistError }}</span>
    </div>

    <details class="transfer">
      <summary>Transferir datos a otro dispositivo</summary>
      <p class="muted">
        Para cuando Spotify solo es alcanzable desde este dispositivo (p. ej. el celular): copia aquí los datos ya
        sincronizados y pégalos en la app abierta en el otro dispositivo, sin que ese otro necesite hablar con Spotify.
        Pega el texto directo (de un chat, nota o WhatsApp); si pasó por un PDF o algo que lo repartió en líneas, también
        se intenta reparar.
      </p>
      <div class="transfer-row">
        <button type="button" @click="onExport">Copiar datos de aquí</button>
        <textarea v-if="exportText" :value="exportText" readonly rows="3" @click="($event.target as HTMLTextAreaElement).select()" />
      </div>
      <div class="transfer-row">
        <textarea v-model="importText" rows="3" placeholder="Pega aquí los datos copiados del otro dispositivo" />
        <button type="button" :disabled="!importText.trim()" @click="onImport">Cargar aquí</button>
      </div>
      <p v-if="transferMessage" class="muted">{{ transferMessage }}</p>
    </details>

    <section class="stage">
      <div class="canvas-wrap">
        <MandalaCanvas
          :data="data"
          :color-mode="colorMode"
          :theme="theme"
          :focus="focus"
          @select="selected = $event"
          @hover="hover = $event"
        />
        <span v-if="supportsHover && hover" class="hover-label" :style="hoverLabelStyle">{{ hoverLabel }}</span>
      </div>
    </section>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="selected.item.title">
        <button type="button" class="modal-close" aria-label="Cerrar" @click="selected = null">✕</button>
        <div class="modal-cover">
          <img
            v-if="selected.item.imageUrl && !coverFailed"
            :src="selected.item.imageUrl"
            :alt="selected.item.title"
            @error="coverFailed = true"
          />
          <div v-else class="modal-cover-fallback" :style="{ background: selected.color }" />
        </div>
        <div class="modal-palette">
          <i v-for="c in selected.item.palette" :key="c" :style="{ background: c }" />
        </div>
        <div class="modal-body">
          <span class="eyebrow" :style="{ color: selected.group.color }">{{ selected.group.name }} · #{{ selected.item.position }}</span>
          <strong>{{ selected.item.title }}</strong>
          <span class="muted">{{ selected.item.subtitle }}</span>
          <a v-if="selected.item.sourceUrl" :href="selected.item.sourceUrl" target="_blank" rel="noopener">Abrir en Spotify ↗</a>
        </div>
      </div>
    </div>

    <section v-if="unclassifiedItems.length" class="unclassified">
      <h2 class="eyebrow">Sin clasificar ({{ unclassifiedItems.length }})</h2>
      <div v-for="item in unclassifiedItems" :key="item.id" class="unclassified-row">
        <span>{{ item.title }} — {{ item.subtitle }}</span>
        <select @change="onReassign($event, item.id)">
          <option value="" disabled selected>Asignar a grupo…</option>
          <option v-for="g in assignableGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
    </section>

    <footer class="muted">
      <template v-if="status === 'live'">En vivo desde Spotify · sincronizado {{ relativeSync }}.</template>
      <template v-else-if="status === 'cached'">Datos guardados · última sincronización {{ relativeSync }}.</template>
      <template v-else-if="status === 'imported'">Datos importados de otro dispositivo · sincronizados {{ relativeSync }}.</template>
      <template v-else>Datos de muestra (playlist original) · conéctate con Spotify para ver tu playlist actual.</template>
      <template v-if="playlists.length && status !== 'static'">
        · Fuentes:
        <template v-for="(p, i) in playlists" :key="p.id">
          <a :href="`https://open.spotify.com/playlist/${p.id}`" target="_blank" rel="noopener">{{ p.label }}</a
          ><template v-if="i < playlists.length - 1">, </template>
        </template>
      </template>
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
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.seg, .chips { display: flex; flex-wrap: wrap; gap: 6px; }
.seg { border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
button { color: var(--ink); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
button:disabled { opacity: 0.6; cursor: default; }
.seg button { border: 0; }
button[aria-pressed='true'] { background: var(--ink); color: var(--bg); }
.chips button[aria-pressed='true'] { background: var(--line); color: var(--ink); border-color: var(--muted); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.count { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.sync-status { font-family: var(--mono); font-size: 11px; }
.error { font-family: var(--mono); font-size: 11px; color: #e4585a; }
.playlists { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 999px; padding: 4px 6px 4px 12px; font-size: 13px; }
.chip-remove { border: 0; background: transparent; padding: 2px 4px; border-radius: 50%; font-size: 11px; color: var(--muted); }
.chip-remove:hover { color: var(--ink); }
.playlists input { background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; color: var(--ink); font-size: 13px; min-width: 220px; }
.stage { position: relative; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
.canvas-wrap { position: relative; width: min(100%, 78vh); aspect-ratio: 1; margin: 0 auto; }
.hover-label {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -100%);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 10px;
  font-family: var(--mono);
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
}
.modal-backdrop { position: fixed; inset: 0; z-index: 10; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal { position: relative; width: min(340px, 100%); background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
.modal-close { position: absolute; top: 10px; right: 10px; border: 0; background: transparent; color: var(--muted); font-size: 14px; padding: 6px; border-radius: 50%; line-height: 1; }
.modal-close:hover { color: var(--ink); }
.modal-cover { width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: var(--panel); }
.modal-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.modal-cover-fallback { width: 100%; height: 100%; }
.modal-palette { display: flex; height: 14px; border-radius: 4px; overflow: hidden; }
.modal-palette i { flex: 1; }
.modal-body { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.modal-body strong { font-family: var(--display); font-size: 20px; line-height: 1.2; }
.unclassified { display: flex; flex-direction: column; gap: 8px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
.unclassified-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
.unclassified-row select { background: var(--bg); border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; color: var(--ink); font-size: 13px; }
.transfer { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; font-size: 13px; }
.transfer summary { cursor: pointer; font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.transfer-row { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.transfer textarea { width: 100%; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; color: var(--ink); font-family: var(--mono); font-size: 11px; resize: vertical; }
footer { font-size: 12px; }
</style>
