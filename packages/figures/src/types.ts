/** Voz a la que pertenece un elemento (ver docs/05-dualidad.md). */
export type Voice = 'A' | 'B' | 'MATCH' | 'AB';

/** Un elemento de una colección: canción, película, platillo, lugar… */
export interface Item {
  id: string;
  position: number;
  title: string;
  subtitle?: string;
  /** Colores extraídos de la imagen: [promedio, dominante 1, dominante 2, dominante 3]. */
  palette: string[];
  imageUrl?: string;
  sourceUrl?: string;
  voice?: Voice;
}

/** Un grupo (género, tipo de cocina, país…). */
export interface Group {
  id: string;
  name: string;
  color: string;
  items: Item[];
}

/** Contrato que reciben todas las figuras. */
export interface FigureData {
  title: string;
  description?: string;
  groups: Group[];
}

export type ColorMode = 'vivid' | 'original';

/** Elemento bajo el cursor, con su posición en coordenadas del canvas (px CSS). */
export interface HoverInfo {
  item: Item;
  group: Group;
  /** Colores usados al dibujar (vivo o original). */
  color: string;
  innerColor: string;
  x: number;
  y: number;
}
