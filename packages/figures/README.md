# packages/figures

Figuras en TypeScript sobre Canvas 2D, independientes de Vue: `dense` (mandala), `mandala` (mandala por anillos), `sun` (Piedra del Sol), `rose` (rosetón), `dream` (atrapasueños), `kal` (caleidoscopio).

Punto de partida: el código de dibujo dentro de `prototipos/core-lore/index.html` (busca `drawDense`, `drawMandalaStyled`, `drawSun`, `drawRose`, `drawDream`, `drawKal`; la función `sectorAlloc` reparte elementos por sectores y anillos). La primera tarea es separarlo en un módulo por figura que reciba `FigureData`.

## Lenguaje del mandala

Cada anillo es un grupo y cada motivo un elemento. Motivos disponibles: `lobe`, `ray`, `drop`, `scale`, `petal`, `heart`, `leaf`. Los huecos entre motivos se llenan con ornamentos decorativos que no representan datos.
