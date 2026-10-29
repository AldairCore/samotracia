# Plan del proyecto

> Versión 0.2 · 29 oct 2026 · Nombre del proyecto por definir (ver sección 7)

## 1. Visión

Un álbum de **figuras ilustradas** (pavo real, árbol, dalia, galaxia, eclipse…) que retrata los gustos de **Aldair, de su novia y de los dos juntos**: música, películas, series, comidas, lugares. Cada elemento de la figura (pluma, hoja, pétalo, estrella) es algo real: una canción, una película, un platillo, un viaje.

El proyecto gira alrededor de la **dualidad**: cómo dos personas se complementan y en qué se contrastan. Todo existe en tres lentes: **Él · Ella · Nosotros**. El detalle del concepto está en [`05-dualidad.md`](05-dualidad.md).

No hay perfiles ni cuentas: es un solo espacio compartido con dos voces.

## 2. Qué ya existe

| Pieza | Estado | Dónde |
|---|---|---|
| Prototipo **Core.Lore** (playlist de Aldair, 141 canciones) | Listo | `prototipos/core-lore/index.html` |
| Figuras probadas: pavo real, árbol, dalia, galaxia | Listas, solo para una voz | mismo archivo |
| Clasificación por géneros y subgéneros | Manual, por bloque de artista | prototipo |
| Colores de carátula por canción | Extraídos de miniaturas (48×48 px) | datos del prototipo |
| Figuras duales (dos voces en una figura) | Pendiente | Fase 1 |
| Portadas reales en la figura | Pendiente | Fase 2 |

## 3. Colecciones y figuras

Cada figura recibe siempre la misma estructura: **grupos → subgrupos → elementos con color y voz** (él, ella, coincidencia, nuestro).

| Colección | Elemento | Agrupación | Figura sugerida | Imagen |
|---|---|---|---|---|
| Música | canción | género → subgénero → artista | Pavo real | carátula |
| Películas | película | género → década o director | Galaxia binaria | póster |
| Series | serie / temporada | género → serie → temporada | Árbol de dos troncos | póster |
| Comidas | platillo o lugar | tipo de cocina → lugar | Dalia bicolor | foto propia |
| Lugares | viaje / lugar | país → ciudad → lugar | Eclipse o constelación | foto propia |
| Formas de querer | gesto | tipo de gesto | Por definir | ninguna |

## 4. Fases

Cada fase deja algo usable y tiene un criterio claro de salida.

### Fase 0 — Prototipo de una voz (hecho)
- Core.Lore con cuatro figuras.
- **Salida:** saber qué figuras gustan y qué datos hacen falta. ✅

### Fase 1 — Prototipo dual
- Una playlist de ella, clasificada igual que Core.Lore.
- Primer prototipo de la lente **Nosotros**: pavo real partido (opuesto) y galaxia binaria (complementaria).
- Cálculo de coincidencias por canción y por artista, y números de afinidad, complemento y contraste.
- **Salida:** ver las dos playlists en las tres lentes y decidir qué figuras duales funcionan.

### Fase 2 — App de música con dos voces
- App web Vue 3 + TypeScript. Cada quien inicia sesión con **su** Spotify (OAuth PKCE) solo para importar **sus** playlists.
- Portadas reales mostradas en vivo desde Spotify, con enlace a Spotify.
- Selector de lente Él · Ella · Nosotros y los dos modos de dualidad.
- Datos guardados como JSON en el navegador o en un archivo exportable.
- **Salida:** elegir una playlist de cada quien y ver las tres lentes con portadas en menos de un minuto.

### Fase 3 — Backend y más colecciones
- Spring Boot + PostgreSQL para guardar el espacio compartido.
- Películas y series con TMDB, más importación de Letterboxd y Trakt.
- Comidas y lugares con captura manual y fotos propias, marcadas como de él, de ella o nuestras.
- Acceso al espacio con un enlace privado y un código, sin cuentas.
- **Salida:** tres colecciones guardadas, cada una visible en las tres lentes.

### Fase 4 — El álbum
- Portada del álbum con todas las colecciones como páginas.
- Exportar cada figura como imagen (PNG/SVG) para imprimir o regalar.
- Línea de tiempo: cómo crece lo "nuestro" desde el primer día.

## 5. Decisiones abiertas

- [ ] Nombre del proyecto (sección 7).
- [ ] Color base de cada voz y color de lo nuestro.
- [ ] Spring Boot propio o Supabase para la Fase 3 (ver `02-arquitectura-y-stack.md`).
- [ ] Canvas 2D, o pasar a SVG/PixiJS para exportar mejor.
- [ ] Qué colección sigue después de música.

## 6. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Spotify endurece su API (ya pasó en feb 2026) | No se pueden leer playlists | Capa de importadores separada; respaldo con exportación CSV |
| Spotify en modo desarrollo exige Premium al dueño de la app, permite 5 usuarios y solo lee playlists propias | Ella necesita iniciar sesión con su Spotify y estar registrada en la app | Suficiente para dos personas; registrarla como usuaria en el dashboard |
| Derechos de imágenes | No se pueden redistribuir copias | Mostrar en vivo desde la fuente, con atribución |
| La lente "opuesta" se lea como incompatibilidad | Mala experiencia | Lenguaje de "contraste", nunca de "diferencia" o "error" (ver `05-dualidad.md`) |
| Proyecto personal sin fecha se estanca | Abandono | Fases cortas con salida clara |

## 7. Nombre

Opciones en discusión:

| Nombre | Idea |
|---|---|
| **Ome** | "Dos" en náhuatl; Ometéotl es la deidad mexica de la dualidad, a la vez masculina y femenina |
| **Contrapunto** | Dos melodías independientes que suenan juntas y forman armonía |
| **Díada** | Una unidad formada por dos |
| **Eclipse** | Dos cuerpos opuestos que, al alinearse, crean algo que ninguno hace solo |
| **Binaria** | Dos estrellas que orbitan juntas |
