# Pendientes

Estado al 29 oct 2026. Lo hecho está en el historial de git; aquí solo lo que falta.

## Figuras
- [x] Mandala portado a `packages/figures/src/mandala.ts`, con parámetros en `MandalaOptions`.
- [ ] Portar las demás figuras del prototipo: Piedra del Sol (`drawSun`), rosetón (`drawRose`), atrapasueños (`drawDream`), caleidoscopio (`drawKal`) y mandala por anillos (`drawMandalaStyled`).
- [ ] Extraer lo común a una clase base `Figure` (canvas, resize, pausa fuera de pantalla, hover, foco, modo de color) cuando haya una segunda figura.
- [ ] Selector de figura en la app.
- [ ] Exportar la figura como PNG.
- [x] Mandala pasado de `<canvas>` a SVG (vectorial): ya no pierde nitidez con zoom de pellizco en el celular. Rotación y onda de luz vía CSS (`@keyframes`/`@property`), hit-testing por DOM nativo. Al seleccionar un género ese anillo respira con pulso propio y los demás se pausan y dejan de ser clicables.
- [x] Un grupo mucho más grande que el resto (p. ej. una playlist nueva muy desbalanceada) ya no se aprieta en un solo anillo ilegible: si pasa de `MAX_ITEMS_PER_RING` (48) se reparte en varios anillos concéntricos del mismo color/grupo, repartidos lo más parejo posible.

## Dualidad (Harmonía)
- [ ] Conseguir una playlist de ella y clasificarla igual que Core.Lore.
- [ ] Lentes Él · Ella · Harmonía en la app.
- [ ] Mandala complementario: anillos alternados de cada voz, lo nuestro al centro.
- [ ] Mandala opuesto: dos medios mandalas en espejo.
- [ ] Coincidencias por canción y por artista; métricas de afinidad, complemento y contraste.

## Interfaz
- [x] Modo claro y oscuro general de la app, incluido el mandala (fondo, bandas de anillo y onda de hojas sensibles al tema; contornos siempre oscuros).

## Datos
- [x] Importar desde Spotify con OAuth PKCE (ver `docs/03-fuentes-de-datos.md`), sin backend: login en el navegador, token en `localStorage`. Soporta varias playlists propias a la vez (se pegan por URL o ID).
- [x] Extraer colores de la carátula en la app (canvas, `packages/figures/src/palette.ts`) en lugar del JSON fijo, con caché por URL de imagen.
- [x] Portadas reales mostradas en vivo desde Spotify en la ficha.
- [x] Transferir datos ya sincronizados a un dispositivo sin acceso a Spotify (copiar/pegar texto, ver "Transferir datos" en la app) — útil si una red bloquea Spotify (p. ej. filtros tipo Sophos categorizan `*.spotify.com` como "Streaming Media").
- [x] Canciones nuevas (que no calzan con `core-lore.json`) se sugieren con Last.fm (`apps/web/src/lastfm/`): tags del artista contra palabras clave de los 9 grupos fijos de hoy; si no calza ninguno, cae en "Sin clasificar" para reasignar a mano. No toca las 141 canciones ya clasificadas. Ver `docs/03-fuentes-de-datos.md`.
- [ ] Decidido no construir por ahora: crear/renombrar/recolorear grupos a mano desde la UI — se prefiere mantener los 9 grupos fijos (así no se mueven los anillos del mandala) y dejar que Last.fm ayude a ubicar canciones nuevas en esos mismos grupos.
- [ ] "Mandala gemela": una segunda figura con clasificación completamente dinámica por Last.fm (sin los 9 grupos fijos, puede crear grupos nuevos tipo Jazz si aparecen) — experimento aparte, no reemplaza la actual.
- [ ] Playlist de ella: falta que exista; cuando la tenga se agrega con el mismo mecanismo de "agregar playlist" (hoy pensado para varias playlists de una sola voz, falta decidir cómo distinguir voz A de voz B).

## Repositorio
- [x] Subir a GitHub: https://github.com/AldairCore/samotracia.
- [ ] Crear issues/milestones por fase.

## Decisiones abiertas
- [ ] Backend para la Fase 3: NestJS + Prisma (recomendado), Spring Boot o Supabase.
- [ ] Color base de cada voz y de lo nuestro.
- [ ] Qué colección sigue después de música.
