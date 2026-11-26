# Pendientes

Estado al 29 oct 2026. Lo hecho está en el historial de git; aquí solo lo que falta.

## Figuras
- [x] Mandala portado a `packages/figures/src/mandala.ts`, con parámetros en `MandalaOptions`.
- [ ] Portar las demás figuras del prototipo: Piedra del Sol (`drawSun`), rosetón (`drawRose`), atrapasueños (`drawDream`), caleidoscopio (`drawKal`) y mandala por anillos (`drawMandalaStyled`).
- [ ] Extraer lo común a una clase base `Figure` (canvas, resize, pausa fuera de pantalla, hover, foco, modo de color) cuando haya una segunda figura.
- [ ] Selector de figura en la app.
- [ ] Exportar la figura como PNG.

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
- [ ] Clasificación de géneros editable en la app: hoy solo existe lo mínimo (reasignar una canción "Sin clasificar" a un grupo existente); falta mover canciones ya clasificadas, crear/renombrar grupos y editar su color desde la UI.
- [ ] Playlist de ella: falta que exista; cuando la tenga se agrega con el mismo mecanismo de "agregar playlist" (hoy pensado para varias playlists de una sola voz, falta decidir cómo distinguir voz A de voz B).

## Repositorio
- [x] Subir a GitHub: https://github.com/AldairCore/samotracia.
- [ ] Crear issues/milestones por fase.

## Decisiones abiertas
- [ ] Backend para la Fase 3: NestJS + Prisma (recomendado), Spring Boot o Supabase.
- [ ] Color base de cada voz y de lo nuestro.
- [ ] Qué colección sigue después de música.
