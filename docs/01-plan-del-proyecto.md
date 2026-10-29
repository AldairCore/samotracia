# Plan del proyecto — Álbum de diagramas

> Versión 0.1 · 29 oct 2026 · Autor: Aldair

## 1. Visión

Un álbum personal de **figuras ilustradas** (pavo real, árbol, dalia, galaxia…) donde cada figura retrata una parte de mis gustos: música, películas, series, comidas, lugares de vacaciones. Cada elemento de la figura (pluma, hoja, pétalo, estrella) es un elemento real de la colección: una canción, una película, un platillo, un viaje.

1. **Etapa personal:** primero lo construyo con mis propios datos para probar ideas, figuras y fuentes de datos.
2. **Etapa en pareja:** después lo hago con mi pareja: dos colecciones lado a lado o fusionadas, donde lo que compartimos se nota en la figura.

## 2. Qué ya existe

| Pieza | Estado | Dónde |
|---|---|---|
| Prototipo **Core.Lore** (playlist de Spotify, 141 canciones) | Listo | `prototipos/core-lore/index.html` |
| Figuras probadas: pavo real, árbol, dalia, galaxia | Listas en el prototipo | mismo archivo |
| Clasificación por géneros y subgéneros | Manual, por bloque de artista | `docs/` + prototipo |
| Colores de carátula por canción | Extraídos de miniaturas (48×48 px) | datos embebidos en el prototipo |
| Portadas reales en la figura | Pendiente | Fase 1 |

## 3. Colecciones y figuras

Cada colección tiene una figura "natural", pero todas las figuras deben poder dibujar cualquier colección. Una figura recibe siempre la misma estructura: **grupos → subgrupos → elementos con color**.

| Colección | Elemento | Agrupación | Figura sugerida | Imagen del elemento |
|---|---|---|---|---|
| Música | canción | género → subgénero → artista | Pavo real | carátula del álbum |
| Películas | película | género → década o director | Galaxia | póster |
| Series | serie / temporada | género → serie → temporada | Árbol | póster |
| Comidas | platillo o lugar | tipo de cocina → lugar | Dalia | foto propia |
| Vacaciones | viaje / lugar | país → ciudad → lugar | Constelación o mapa | foto propia |

## 4. Fases

Las fases están pensadas para que cada una deje algo usable y no dependa de terminar todo.

### Fase 0 — Prototipo (hecho)
- Página HTML con las cuatro figuras y datos de Core.Lore.
- **Criterio de salida:** saber qué figuras gustan y qué datos hacen falta. ✅

### Fase 1 — "Mi música" con portadas reales
- App web en Vue 3 + TypeScript que inicia sesión con Spotify (OAuth PKCE), lee **mis** playlists y dibuja cualquiera de ellas.
- Portadas reales mostradas en vivo desde Spotify (sin guardar copias), con enlace a Spotify en cada elemento.
- Extracción de colores dominantes de cada carátula.
- Clasificación de géneros: géneros del artista (si la API los entrega) + ajuste manual editable.
- Sin base de datos: los datos se guardan como JSON en el navegador o en un archivo exportable.
- **Criterio de salida:** elijo una playlist mía y veo el pavo real con portadas en menos de un minuto.

### Fase 2 — Más colecciones y un backend
- Backend Spring Boot + PostgreSQL para guardar colecciones, elementos, grupos y colores.
- Colección Películas/Series con TMDB (pósters) e importación de Letterboxd/Trakt.
- Colecciones Comidas y Vacaciones con captura manual y fotos propias.
- **Criterio de salida:** tengo al menos 3 colecciones guardadas y puedo cambiar de figura en cada una.

### Fase 3 — Modo pareja
- Cuentas de usuario y una "pareja" que comparte colecciones.
- Vistas comparadas: dos figuras lado a lado; figura fusionada donde los elementos en común se resaltan; estadística de coincidencias.
- Compartir una figura con un enlace de solo lectura.
- **Criterio de salida:** mi pareja crea su colección de música y vemos el pavo real compartido.

### Fase 4 — El "álbum"
- Portada del álbum con todas las colecciones como páginas.
- Exportar cada figura como imagen (PNG/SVG) para imprimir o compartir.
- Historial: cómo cambió una colección en el tiempo.

## 5. Decisiones abiertas

- [ ] ¿Nombre final del proyecto?
- [ ] ¿Spring Boot propio o Supabase para la Fase 2? (ver `02-arquitectura-y-stack.md`)
- [ ] ¿Las figuras se dibujan solo en Canvas 2D o se pasa a SVG/PixiJS para exportar mejor?
- [ ] ¿Qué colección sigue después de música: películas o comidas?
- [ ] ¿Dónde se publica: solo local, o en internet con dominio propio?

## 6. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Spotify endurece su API (ya pasó en feb 2026) | La Fase 1 deja de leer datos | Capa de "importadores" separada; respaldo con exportaciones manuales (CSV) |
| Spotify en modo desarrollo exige Premium al dueño de la app y permite 5 usuarios | Límite para compartir | Suficiente para mí y mi pareja; no planear uso público |
| Derechos de imágenes (portadas, pósters) | No se pueden redistribuir copias | Mostrar siempre en vivo desde la fuente, con atribución y enlace |
| Proyecto personal sin fecha se estanca | Abandono | Fases cortas con criterio de salida claro |
