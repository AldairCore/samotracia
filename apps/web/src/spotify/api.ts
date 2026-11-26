export interface RawTrack {
  spotifyId: string;
  title: string;
  artists: string;
  imageUrl?: string;
  sourceUrl?: string;
}

interface SpotifyTrackJson {
  id: string;
  type: string;
  /** Flags booleanos que trae la API además de `type`: lo usamos por ser menos ambiguo. */
  track: boolean;
  episode: boolean;
  name: string;
  artists?: { name: string }[];
  album?: { images?: { url: string }[] };
  external_urls?: { spotify?: string };
}

interface PlaylistItemsResponse {
  /** Desde la migración de feb-2026 cada entrada trae `item`, ya no `track` (ver docs/03). */
  items?: { item: SpotifyTrackJson | null }[];
  next: string | null;
}

export interface MyPlaylist {
  id: string;
  name: string;
  trackCount: number;
}

interface MyPlaylistsResponse {
  /** Desde la migración de feb-2026 el conteo de canciones viene en `items.total`, no `tracks.total`. */
  items?: ({ id: string; name: string; items?: { total?: number }; owner?: { id?: string }; collaborative?: boolean } | null)[];
  next: string | null;
}

/** Id de Spotify del usuario autenticado, para distinguir sus playlists de las que solo sigue. */
async function fetchMyUserId(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const json: { id?: string } = await res.json();
  return json.id ?? null;
}

/**
 * Playlists del usuario autenticado que de verdad se pueden leer: en modo desarrollo, Spotify solo
 * devuelve canciones de playlists donde el usuario es dueño o colaborador (ver docs/03). Las que
 * solo sigue (de otra cuenta, no colaborativas) se descartan aquí para no ofrecer algo que al
 * agregarlo va a fallar con 403.
 */
export async function fetchMyPlaylists(accessToken: string): Promise<MyPlaylist[]> {
  const myId = await fetchMyUserId(accessToken);
  const playlists: MyPlaylist[] = [];
  let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Spotify respondió ${res.status} al leer tus playlists`);
    const json: MyPlaylistsResponse = await res.json();
    for (const p of json.items ?? []) {
      if (!p) continue;
      const isMine = p.collaborative || (myId !== null && p.owner?.id === myId);
      if (!isMine) continue;
      playlists.push({ id: p.id, name: p.name, trackCount: p.items?.total ?? 0 });
    }
    url = json.next ?? null;
  }

  return playlists;
}

/** Acepta una URL completa de playlist de Spotify o el ID a secas. */
export function parsePlaylistIdFromInput(value: string): string | null {
  const trimmed = value.trim();
  const urlMatch = trimmed.match(/playlist[/:]([a-zA-Z0-9]{10,})/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

async function fetchWithRetry(url: string, accessToken: string, playlistId: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) return res;
    if (attempt < 3 && RETRYABLE_STATUS.has(res.status)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      continue;
    }
    const body = await res.text().catch(() => '');
    throw new Error(`Spotify respondió ${res.status} al leer la playlist ${playlistId}${body ? `: ${body}` : ''}`);
  }
}

/** Trae todas las canciones de una playlist (pagina sola), ignorando episodios de podcast. */
export async function fetchPlaylistTracks(playlistId: string, accessToken: string): Promise<RawTrack[]> {
  const tracks: RawTrack[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`;
  let firstPageRaw: unknown = null;

  while (url) {
    const res = await fetchWithRetry(url, accessToken, playlistId);
    const json: PlaylistItemsResponse = await res.json();
    if (firstPageRaw === null) firstPageRaw = json;

    for (const entry of json.items ?? []) {
      const track = entry?.item;
      // Solo se descartan episodios de podcast; si no viniera el flag, se prefiere incluir
      // la canción a perderla en silencio.
      if (!track || track.episode) continue;
      tracks.push({
        spotifyId: track.id,
        title: track.name,
        artists: (track.artists ?? []).map((a) => a.name).join(', '),
        imageUrl: track.album?.images?.[0]?.url,
        sourceUrl: track.external_urls?.spotify,
      });
    }
    url = json.next ?? null;
  }

  if (tracks.length === 0) {
    const preview = JSON.stringify(firstPageRaw).slice(0, 2500);
    throw new Error(`Spotify no devolvió canciones usables para ${playlistId}. Respuesta: ${preview}`);
  }

  return tracks;
}
