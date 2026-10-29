# packages/figures

Figuras en TypeScript sobre Canvas 2D, independientes de Vue: `mandala`, `vinyl`, `peacock`, `tree`, `dahlia`, `galaxy`.

Punto de partida: el código de dibujo dentro de `prototipos/core-lore/index.html` (busca `drawMandalaStyled`, `drawPeacock`, `drawTree`, `drawDahlia`, `drawGalaxy`). La primera tarea es separarlo en un módulo por figura que reciba `FigureData`.

## Lenguaje del mandala

Cada anillo es un grupo y cada motivo un elemento. Motivos disponibles: `lobe`, `ray`, `drop`, `scale`, `petal`, `heart`, `leaf`. Los huecos entre motivos se llenan con ornamentos decorativos que no representan datos.
