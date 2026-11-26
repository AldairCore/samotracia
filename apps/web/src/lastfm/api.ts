const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

interface TopTagsResponse {
  toptags?: { tag?: { name: string }[] };
}

/** Tags de un artista en Last.fm (minúsculas), de más a menos frecuentes. `[]` si no hay API key o falla. */
export async function fetchArtistTags(artist: string): Promise<string[]> {
  if (!API_KEY || !artist) return [];

  const params = new URLSearchParams({
    method: 'artist.gettoptags',
    artist,
    autocorrect: '1',
    api_key: API_KEY,
    format: 'json',
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const json: TopTagsResponse = await res.json();
    return (json.toptags?.tag ?? []).map((t) => t.name.toLowerCase());
  } catch {
    return [];
  }
}
