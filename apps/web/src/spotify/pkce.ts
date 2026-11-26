/** Helpers de PKCE (RFC 7636) para el login de Spotify sin backend ni client secret. */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** Cadena aleatoria usada como `code_verifier` y, por separado, como `state` anti-CSRF. */
export function randomString(length = 64): string {
  return base64UrlEncode(randomBytes(length)).slice(0, length);
}

export async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
