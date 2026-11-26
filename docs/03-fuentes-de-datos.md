# Fuentes de datos y aplicaciones conectadas

Estado verificado el 29 oct 2026. Las APIs cambian; revisa la documentación oficial antes de cada fase.

## Por colección

| Colección | Fuente principal | Qué aporta | Notas |
|---|---|---|---|
| Música | **Spotify Web API** | Playlists, canciones, artistas, portadas | Ver restricciones abajo |
| Música (géneros) | **Last.fm API** | Etiquetas de género por artista | En uso: ver sección abajo |
| Películas | **TMDB API** | Pósters, géneros, año, director | Gratis para uso no comercial con atribución |
| Películas (historial) | **Letterboxd** (exportación CSV) | Lo que viste y tus calificaciones | Exportas desde tu cuenta e importas el CSV |
| Series | **TMDB** + **Trakt** | Pósters + historial de episodios vistos | Trakt tiene API con OAuth |
| Comidas | Captura manual + fotos propias | Platillo, lugar, tipo de cocina, calificación | Opcional: Google Places para ubicar el restaurante |
| Vacaciones | Captura manual + fotos propias | País, ciudad, fechas | Mapas: Mapbox o Google Maps |

## Spotify: restricciones actuales (modo desarrollo)

Desde febrero de 2026 Spotify cambió el modo desarrollo de su API:

- El dueño de la app necesita **Spotify Premium** activo; si se vence, la app deja de funcionar.
- Apps nuevas: **1 Client ID por desarrollador** y **5 usuarios por app**. Alcanza para las dos voces; ella debe estar registrada como usuaria de la app.
- Las canciones de una playlist solo se devuelven para playlists **que el usuario es dueño o colaborador**. Por eso cada quien importa sus propias playlists con su cuenta.
- Se quitaron las consultas por lotes (`GET /tracks`, `/artists`, etc.): hay que pedir cada elemento por ID.
- `GET /playlists/{id}/tracks` se renombró a `/items`, y dentro de cada entrada el campo `track` también se renombró a `item` (trae además `track`/`episode` como booleanos, no solo `type`).
- Se quitaron campos como `popularity` y `followers`.

Fuentes: [Guía de migración de feb 2026](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) · [Anuncio de Spotify](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)

## Last.fm: cómo se usa

Last.fm clasifica por **tags de texto libre en inglés** (`"trip-hop"`, `"mexican rock"`, `"seen live"`...),
no por un catálogo fijo de géneros, así que no sirve para asignar automático y sin supervisión.
Se usa como ayuda para canciones **nuevas** que no calzan con la clasificación manual ya hecha en
`core-lore.json`: se piden los tags del artista (`artist.gettoptags`, con API key gratis, sin OAuth)
y se buscan en una lista de palabras clave por grupo (`apps/web/src/lastfm/classify.ts`), de lo más
específico a lo más genérico para no robarle canciones a un grupo más preciso (p. ej. "rock" no debe
ganarle a "rock mexicano"). Si ningún grupo calza, la canción cae en "Sin clasificar" para reasignar
a mano — igual que antes de tener Last.fm.

La API de `ws.audioscrobbler.com` sí manda `Access-Control-Allow-Origin: *`, así que se puede llamar
directo desde el navegador sin backend ni proxy, igual que Spotify.

No se tocan las 141 canciones que ya tienen grupo asignado (ver `docs/06-pendientes.md`): una
clasificación completamente dinámica con Last.fm (sin los 9 grupos fijos de hoy) queda para una
"mandala gemela" aparte, más adelante.

## TMDB: condiciones

- Gratis para uso **no comercial**, dando crédito a TMDB.
- Mostrar su logo aprobado y el aviso: *"This product uses the TMDB API but is not endorsed or certified by TMDB."*, en una sección "Acerca de" o "Créditos".

Fuente: [TMDB FAQ](https://developer.themoviedb.org/docs/faq)

## Regla para todas las imágenes

Las portadas y pósters no son nuestros. La app los **muestra en vivo desde la URL de la fuente**, con enlace al original, y **no guarda copias** en el repositorio ni en la base de datos. Lo que sí se guarda son los **colores extraídos** (datos derivados) y la URL.

## Herramientas de desarrollo conectadas

| Herramienta | Para qué |
|---|---|
| GitHub | Repositorio, issues para las fases, Projects como tablero |
| VS Code | Editor; extensiones en `.vscode/extensions.json` |
| Claude Code | Asistente dentro del repo; lee `CLAUDE.md` |
| Docker Desktop | PostgreSQL local (Fase 3) |
| Spotify for Developers | Registrar la app y obtener el Client ID |
| TMDB | Cuenta y API key (Fase 3) |
