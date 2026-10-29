# Plan del proyecto

> Versión 0.3 · 29 oct 2026 · Proyecto **Samotracia**

## 1. Visión

Un álbum de **figuras ilustradas** (mandala, Piedra del Sol, rosetón, atrapasueños, papel picado, caleidoscopio, sigilo…) que retrata los gustos de **Aldair, de su novia y de los dos juntos**: música, películas, series, comidas, lugares. Cada elemento de la figura (un motivo, un vidrio, una cuenta, un recorte) es algo real: una canción, una película, un platillo, un viaje.

El proyecto gira alrededor de la **dualidad**: cómo dos personas se complementan y en qué se contrastan. Todo existe en tres lentes: **Él · Ella · Harmonía**. El detalle del concepto está en [`05-dualidad.md`](05-dualidad.md).

No hay perfiles ni cuentas: es un solo espacio compartido con dos voces.

## 2. Qué ya existe

| Pieza | Estado | Dónde |
|---|---|---|
| Prototipo **Core.Lore** (playlist de Aldair, 141 canciones) | Listo | `prototipos/core-lore/index.html` |
| Figuras probadas: mandala, Piedra del Sol, rosetón, atrapasueños, papel picado, caleidoscopio, sigilo | Listas, solo para una voz, en estilo plano con contornos | mismo archivo |
| Figuras descartadas: pavo real, árbol, dalia, galaxia, vinilo | Se sustituyeron por las de arriba | historial de git |
| Clasificación por géneros y subgéneros | Manual, por bloque de artista | prototipo |
| Colores de carátula por canción | Extraídos de miniaturas (48×48 px) | datos del prototipo |
| Figuras duales (dos voces en una figura) | Pendiente | Fase 1 |
| Portadas reales en la figura | Pendiente | Fase 2 |

## 3. Colecciones y figuras

Cada figura recibe siempre la misma estructura: **grupos → subgrupos → elementos con color y voz** (él, ella, coincidencia, nuestro).

| Colección | Elemento | Agrupación | Figura sugerida | Imagen |
|---|---|---|---|---|
| Música | canción | género → subgénero → artista | Mandala o sigilo | carátula |
| Películas | película | género → década o director | Rosetón | póster |
| Series | serie / temporada | género → serie → temporada | Caleidoscopio | póster |
| Comidas | platillo o lugar | tipo de cocina → lugar | Papel picado | foto propia |
| Lugares | viaje / lugar | país → ciudad → lugar | Piedra del Sol o atrapasueños | foto propia |
| Formas de querer | gesto | tipo de gesto | Por definir | ninguna |

## 4. Fases

Cada fase deja algo usable y tiene un criterio claro de salida.

### Fase 0 — Prototipo de una voz (hecho)
- Core.Lore con cuatro figuras.
- **Salida:** saber qué figuras gustan y qué datos hacen falta. ✅

### Fase 1 — Prototipo dual
- Una playlist de ella, clasificada igual que Core.Lore.
- Primer prototipo de la lente **Harmonía**: mandala de anillos alternados (complementaria) y sigilo con dos estrellas (opuesta).
- Cálculo de coincidencias por canción y por artista, y números de afinidad, complemento y contraste.
- **Salida:** ver las dos playlists en las tres lentes y decidir qué figuras duales funcionan.

### Fase 2 — App de música con dos voces
- App web Vue 3 + TypeScript. Cada quien inicia sesión con **su** Spotify (OAuth PKCE) solo para importar **sus** playlists.
- Portadas reales mostradas en vivo desde Spotify, con enlace a Spotify.
- Selector de lente Él · Ella · Harmonía y los dos modos de dualidad.
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

- [x] Nombre del proyecto: **Samotracia**; la vista conjunta se llama **Harmonía** (sección 7).
- [ ] Color base de cada voz y color de lo nuestro.
- [x] Estilo visual: ilustración plana con contornos oscuros y colores sólidos, sin brillos ni degradados (inspirado en mandalas).
- [ ] Backend para la Fase 3: NestJS (recomendado), Spring Boot o Supabase (ver `02-arquitectura-y-stack.md`).
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

**Samotracia** es el nombre del proyecto, y **Harmonía** es la lente donde se ven los dos juntos.

Según la tradición de Samotracia, en esa isla del Egeo el príncipe Cadmo conoció a Harmonía. Ella era la diosa de la armonía, hija de Ares (la guerra) y Afrodita (el amor): nació de dos opuestos. Su boda fue la primera de mortales a la que asistieron todos los dioses. Al final de su vida, cuando Cadmo fue convertido en serpiente, Harmonía pidió compartir su destino para no separarse.

- **Samotracia** es la isla: el espacio que comparten los dos.
- **Él** y **Ella** son las dos voces que llegan a la isla.
- **Harmonía** es lo que nace cuando se encuentran.

Otros nombres que se consideraron: Ome, Yanantin, Aun, Symbolon, Arrebol, Flor y Canto, Baucis, Alcíone.
