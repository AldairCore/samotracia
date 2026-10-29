# packages/figures

Figuras en TypeScript sobre Canvas 2D, sin dependencia de Vue. Todas reciben `FigureData` (`src/types.ts`).

## Hechas
- `MandalaFigure` (`src/mandala.ts`): anillos por grupo, pétalos en capas, hojas que se encienden por anillos, hover que aísla, foco por grupo, colores vivos u originales.

```ts
import { MandalaFigure } from '@samotracia/figures';

const fig = new MandalaFigure(canvas, data, { glow: { speed: 1.38 } });
fig.onHover = (info) => console.log(info?.item.title);
fig.start();
```

Optimizaciones: colores calculados una sola vez por elemento, pausa cuando el canvas no está en pantalla o la pestaña está oculta, resolución limitada a 2× y sin animación si el sistema pide movimiento reducido.

## Por portar
Del prototipo `prototipos/core-lore/index.html`: `drawSun` (Piedra del Sol), `drawRose` (rosetón), `drawDream` (atrapasueños), `drawKal` (caleidoscopio), `drawMandalaStyled` (mandala por anillos). La función `sectorAlloc` del prototipo reparte elementos por sectores y anillos y sirve para varias de ellas.

## Utilidades de color (`src/color.ts`)
`vividColors`, `vividGroup`, `contrastColor`, `mix`, `hexToHsl`, `hslToHex`.
