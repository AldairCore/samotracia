import { computed, ref } from 'vue';
import { codeChallengeFromVerifier, randomString } from './pkce';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = 'playlist-read-private playlist-read-collaborative';
const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

const AUTH_STORAGE_KEY = 'samotracia-spotify-auth';
const PKCE_STORAGE_KEY = 'samotracia-spotify-pkce';
/** Margen antes de que expire el token para refrescarlo por adelantado. */
const EXPIRY_MARGIN_MS = 60_000;

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

const auth = ref<StoredAuth | null>(readStoredAuth());

function persist(next: StoredAuth | null) {
  auth.value = next;
  if (next) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
}

export const isAuthenticated = computed(() => !!auth.value?.refreshToken);

/** Redirige a Spotify para autorizar la app (Authorization Code + PKCE). */
export async function login() {
  const verifier = randomString(64);
  const state = randomString(16);
  const challenge = await codeChallengeFromVerifier(verifier);
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify({ verifier, state }));

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });
  window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
}

export function logout() {
  persist(null);
}

/**
 * Si la URL actual viene de la redirección de Spotify (`/callback?code=...`), intercambia
 * el código por tokens. No hace nada si no hay `code` en la URL.
 */
export async function handleRedirectCallback(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  if (!code) return;

  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
  if (!raw) return;
  const { verifier, state } = JSON.parse(raw) as { verifier: string; state: string };
  if (returnedState !== state) return;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return;
  const json = await res.json();
  persist({
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000 - EXPIRY_MARGIN_MS,
  });
}

async function refreshAccessToken(refreshToken: string): Promise<StoredAuth | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return null;
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000 - EXPIRY_MARGIN_MS,
  };
}

/** Devuelve un access token vigente, refrescándolo si hace falta; `null` si no hay sesión. */
export async function getValidAccessToken(): Promise<string | null> {
  const current = auth.value;
  if (!current) return null;
  if (Date.now() < current.expiresAt) return current.accessToken;

  const refreshed = await refreshAccessToken(current.refreshToken);
  if (!refreshed) {
    persist(null);
    return null;
  }
  persist(refreshed);
  return refreshed.accessToken;
}
