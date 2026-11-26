import { ref } from 'vue';
import type { FigureData, Group, Item } from '@samotracia/figures';
import { extractPalette } from '@samotracia/figures';
import coreLoreJson from '../data/core-lore.json';
import { getValidAccessToken, isAuthenticated, login, logout } from '../spotify/auth';
import { fetchMyPlaylists, fetchPlaylistTracks, parsePlaylistIdFromInput, type MyPlaylist, type RawTrack } from '../spotify/api';
import { fetchArtistTags } from '../lastfm/api';
import { guessGroupFromTags } from '../lastfm/classify';

interface PlaylistConfig {
  id: string;
  label: string;
}

interface GroupConfig {
  id: string;
  name: string;
  color: string;
}

const PLAYLISTS_KEY = 'samotracia-playlists';
const GROUPS_KEY = 'samotracia-groups';
const CLASSIFICATION_KEY = 'samotracia-classification';
const CACHE_KEY = 'samotracia-library-cache';
const PALETTE_CACHE_KEY = 'samotracia-palette-cache';
const LASTFM_CACHE_KEY = 'samotracia-lastfm-cache';
const UNCLASSIFIED_ID = 'unclassified';
const UNCLASSIFIED_COLOR = '#8a8a8a';
/** No volver a pedirle a Spotify los tracks si la última sincronización fue hace menos de esto. */
const SYNC_TTL_MS = 5 * 60 * 1000;
const FALLBACK_PALETTE = ['#8a8a8a', '#707070', '#5a5a5a', '#464646'];

const legacyData = coreLoreJson as FigureData & { sourceUrl: string; capturedAt: string };

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function firstArtist(subtitle: string): string {
  return subtitle.split(',')[0] ?? subtitle;
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultGroups(): GroupConfig[] {
  const fromLegacy = legacyData.groups.map((g) => ({ id: g.id, name: g.name, color: g.color }));
  return [...fromLegacy, { id: UNCLASSIFIED_ID, name: 'Sin clasificar', color: UNCLASSIFIED_COLOR }];
}

function defaultPlaylists(): PlaylistConfig[] {
  return [{ id: '1PY1BZG7npaDTSOkf6c1wD', label: 'Core.Lore' }];
}

/**
 * core-lore.json no tiene IDs reales de Spotify (su sourceUrl es una búsqueda, no el track).
 * Para no perder la clasificación manual ya hecha, la primera vez que aparece una canción se
 * empareja por título + artista normalizados contra este índice construido desde el JSON viejo.
 */
function buildLegacyIndex() {
  const exact = new Map<string, string>();
  const byFirstArtist = new Map<string, string>();
  for (const group of legacyData.groups) {
    for (const item of group.items) {
      const title = normalize(item.title);
      const subtitle = normalize(item.subtitle ?? '');
      exact.set(`${title}|${subtitle}`, group.id);
      byFirstArtist.set(`${title}|${normalize(firstArtist(item.subtitle ?? ''))}`, group.id);
    }
  }
  return { exact, byFirstArtist };
}

const legacyIndex = buildLegacyIndex();

// --- Estado reactivo a nivel de módulo: un solo singleton compartido (igual que useTheme). ---
const playlists = ref<PlaylistConfig[]>(readJson(PLAYLISTS_KEY, defaultPlaylists()));
const groups = ref<GroupConfig[]>(readJson(GROUPS_KEY, defaultGroups()));
const classification = ref<Record<string, string>>(readJson(CLASSIFICATION_KEY, {}));
const paletteCache = ref<Record<string, string[]>>(readJson(PALETTE_CACHE_KEY, {}));
/** Tags de Last.fm por artista (clave normalizada), para no volver a pedirlos en cada sync. */
const lastfmTagsCache = ref<Record<string, string[]>>(readJson(LASTFM_CACHE_KEY, {}));

const initialCache = readJson<{ data: FigureData; syncedAt: string } | null>(CACHE_KEY, null);
const library = ref<FigureData>(initialCache?.data ?? legacyData);
const lastSyncedAt = ref<string | null>(initialCache?.syncedAt ?? null);
const status = ref<'static' | 'cached' | 'live' | 'imported'>(initialCache ? 'cached' : 'static');
const loading = ref(false);
const error = ref<string | null>(null);

function persistPlaylists() {
  writeJson(PLAYLISTS_KEY, playlists.value);
}
function persistClassification() {
  writeJson(CLASSIFICATION_KEY, classification.value);
}
function persistPalette() {
  writeJson(PALETTE_CACHE_KEY, paletteCache.value);
}
function persistLastfmCache() {
  writeJson(LASTFM_CACHE_KEY, lastfmTagsCache.value);
}
function persistCache() {
  writeJson(CACHE_KEY, { data: library.value, syncedAt: lastSyncedAt.value });
}

/** Tags de Last.fm del artista, con caché; `[]` si ya se sabía que no hay o falló. */
async function tagsFor(artist: string): Promise<string[]> {
  const key = normalize(artist);
  const cached = lastfmTagsCache.value[key];
  if (cached) return cached;
  const tags = await fetchArtistTags(artist);
  lastfmTagsCache.value[key] = tags;
  return tags;
}

/**
 * Clasificación manual > emparejar con core-lore.json (canciones ya conocidas) > Last.fm
 * (canciones nuevas, por tags del artista) > "Sin clasificar" para que la asignes a mano.
 */
async function groupIdFor(track: RawTrack): Promise<string> {
  const existing = classification.value[track.spotifyId];
  if (existing) return existing;

  const title = normalize(track.title);
  const legacyGuess =
    legacyIndex.exact.get(`${title}|${normalize(track.artists)}`) ??
    legacyIndex.byFirstArtist.get(`${title}|${normalize(firstArtist(track.artists))}`);

  const tags = legacyGuess ? null : await tagsFor(firstArtist(track.artists));
  const guess = legacyGuess ?? (tags && guessGroupFromTags(tags)) ?? UNCLASSIFIED_ID;

  classification.value[track.spotifyId] = guess;
  return guess;
}

async function paletteFor(track: RawTrack): Promise<string[]> {
  if (!track.imageUrl) return FALLBACK_PALETTE;
  const cachedPalette = paletteCache.value[track.imageUrl];
  if (cachedPalette) return cachedPalette;
  const palette = await extractPalette(track.imageUrl);
  paletteCache.value[track.imageUrl] = palette;
  return palette;
}

function buildFigureData(tracksByGroup: Map<string, Item[]>): FigureData {
  const orderedGroups: Group[] = groups.value
    .map((g) => ({ id: g.id, name: g.name, color: g.color, items: tracksByGroup.get(g.id) ?? [] }))
    .filter((g) => g.items.length > 0);

  return { title: legacyData.title, description: legacyData.description, groups: orderedGroups };
}

/** Reagrupa lo que ya está cargado según `classification`, sin volver a pedirle nada a Spotify. */
function rebuildFromClassification() {
  const allItems = library.value.groups.flatMap((g) => g.items);
  const tracksByGroup = new Map<string, Item[]>();
  for (const item of allItems) {
    const groupId = classification.value[item.id] ?? UNCLASSIFIED_ID;
    const bucket = tracksByGroup.get(groupId) ?? [];
    bucket.push(item);
    tracksByGroup.set(groupId, bucket);
  }
  library.value = buildFigureData(tracksByGroup);
  persistCache();
}

/** Trae las playlists configuradas desde Spotify y reconstruye la colección. */
export async function refresh(force = false): Promise<void> {
  if (!isAuthenticated.value || loading.value) return;
  if (!force && lastSyncedAt.value && Date.now() - new Date(lastSyncedAt.value).getTime() < SYNC_TTL_MS) return;

  loading.value = true;
  error.value = null;
  try {
    const token = await getValidAccessToken();
    if (!token) {
      error.value = 'La sesión de Spotify expiró. Conéctate de nuevo.';
      return;
    }

    const seen = new Set<string>();
    const rawTracks: RawTrack[] = [];
    for (const playlist of playlists.value) {
      const tracks = await fetchPlaylistTracks(playlist.id, token);
      for (const track of tracks) {
        if (seen.has(track.spotifyId)) continue;
        seen.add(track.spotifyId);
        rawTracks.push(track);
      }
    }

    const tracksByGroup = new Map<string, Item[]>();
    let position = 0;
    for (const track of rawTracks) {
      position++;
      const groupId = await groupIdFor(track);
      const palette = await paletteFor(track);
      const item: Item = {
        id: track.spotifyId,
        position,
        title: track.title,
        subtitle: track.artists,
        palette,
        imageUrl: track.imageUrl,
        sourceUrl: track.sourceUrl,
      };
      const bucket = tracksByGroup.get(groupId) ?? [];
      bucket.push(item);
      tracksByGroup.set(groupId, bucket);
    }

    library.value = buildFigureData(tracksByGroup);
    lastSyncedAt.value = new Date().toISOString();
    status.value = 'live';

    persistClassification();
    persistPalette();
    persistLastfmCache();
    persistCache();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo sincronizar con Spotify.';
  } finally {
    loading.value = false;
  }
}

/** Playlists de Spotify del usuario (públicas y privadas), para elegir cuáles alimentan el mandala. */
export async function listMyPlaylists(): Promise<MyPlaylist[]> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('La sesión de Spotify expiró. Conéctate de nuevo.');
  return fetchMyPlaylists(token);
}

export function addPlaylist(input: string, label?: string): boolean {
  const id = parsePlaylistIdFromInput(input);
  if (!id || playlists.value.some((p) => p.id === id)) return false;
  playlists.value.push({ id, label: label?.trim() || `Playlist ${playlists.value.length + 1}` });
  persistPlaylists();
  return true;
}

export function removePlaylist(id: string) {
  playlists.value = playlists.value.filter((p) => p.id !== id);
  persistPlaylists();
}

export function assignGroup(itemId: string, groupId: string) {
  classification.value[itemId] = groupId;
  persistClassification();
  rebuildFromClassification();
}

interface LibrarySnapshot {
  data: FigureData;
  syncedAt: string | null;
  exportedAt: string;
}

/**
 * Para cuando Spotify solo es alcanzable desde un dispositivo (p. ej. el celular, si la red de la
 * PC bloquea Spotify): exporta la colección ya sincronizada como texto para copiar/pegar a mano
 * en otro dispositivo, sin que ese otro dispositivo necesite hablar con Spotify.
 */
export function exportSnapshot(): string {
  const snapshot: LibrarySnapshot = { data: library.value, syncedAt: lastSyncedAt.value, exportedAt: new Date().toISOString() };
  return JSON.stringify(snapshot);
}

/**
 * Intenta reparar un pegado que pasó por un lector de PDF u otro visor que reparte el texto en
 * líneas: ahí los saltos de línea son puro reflow visual, no datos, y rompen el JSON porque un
 * salto de línea crudo dentro de un string no es válido. Se quitan todos: fuera de comillas son
 * espacio en blanco insignificante para JSON, y dentro de comillas el espacio real que separaba
 * palabras ya sobrevive como espacio antes del salto (el propio lector lo deja ahí al cortar).
 */
function stripPdfLineWraps(text: string): string {
  return text.replace(/\r?\n/g, '');
}

export function importSnapshot(json: string): boolean {
  const trimmed = json.trim();
  let snapshot: LibrarySnapshot;
  try {
    snapshot = JSON.parse(trimmed);
  } catch {
    try {
      snapshot = JSON.parse(stripPdfLineWraps(trimmed));
    } catch {
      return false;
    }
  }
  if (!snapshot?.data?.groups || !Array.isArray(snapshot.data.groups)) return false;

  library.value = snapshot.data;
  lastSyncedAt.value = snapshot.syncedAt;
  status.value = 'imported';
  persistCache();
  return true;
}

export function useSpotifyLibrary() {
  return {
    library,
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
    listMyPlaylists,
    addPlaylist,
    removePlaylist,
    assignGroup,
    exportSnapshot,
    importSnapshot,
  };
}
