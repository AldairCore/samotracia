/**
 * Mapea tags de Last.fm a los 9 grupos ya existentes en core-lore.json (no crea grupos nuevos:
 * ver docs/06-pendientes.md, eso queda para una "mandala gemela" de clasificación dinámica).
 * El orden importa: va de lo más específico a lo más genérico para que, por ejemplo, un tag
 * genérico como "rock" no le robe canciones a "Rock alternativo mexicano" o "Cine y rock
 * psicodélico" si el tag más específico también aplica.
 */
const GROUP_KEYWORDS: Array<{ id: string; keywords: string[] }> = [
  { id: 'g9', keywords: ['rock mexicano', 'mexican rock', 'rock en español', 'rock alternativo mexicano'] },
  { id: 'g8', keywords: ['mexican hip hop', 'rap mexicano', 'trap mexicano', 'mexican rap', 'hip hop mexicano'] },
  { id: 'g7', keywords: ['latin alternative', 'latin electronic', 'electropop latino', 'puerto rico'] },
  { id: 'g4', keywords: ['soundtrack', 'video game music', 'game music', 'score'] },
  { id: 'g3', keywords: ['psychedelic rock', 'psychedelic', 'progressive rock', 'prog rock', 'classic rock'] },
  { id: 'g5', keywords: ['metal', 'metalcore', 'deathcore', 'nu metal', 'industrial metal', 'hardcore'] },
  { id: 'g2', keywords: ['dark pop', 'indie pop', 'synthpop', 'dream pop', 'electropop'] },
  { id: 'g1', keywords: ['trip-hop', 'trip hop', 'alternative hip hop', 'experimental hip hop'] },
  { id: 'g6', keywords: ['experimental electronic', 'idm', 'ambient', 'experimental', 'electronic'] },
];

/** Primer grupo cuyas palabras clave coinciden con algún tag; `null` si ninguno aplica. */
export function guessGroupFromTags(tags: string[]): string | null {
  for (const { id, keywords } of GROUP_KEYWORDS) {
    if (tags.some((tag) => keywords.some((kw) => tag.includes(kw)))) return id;
  }
  return null;
}
