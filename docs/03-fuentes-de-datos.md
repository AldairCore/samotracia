# Fuentes de datos y aplicaciones conectadas

Estado verificado el 29 oct 2026. Las APIs cambian; revisa la documentación oficial antes de cada fase.

## Por colección

| Colección | Fuente principal | Qué aporta | Notas |
|---|---|---|---|
| Música | **Spotify Web API** | Playlists, canciones, artistas, portadas | Ver restricciones abajo |
| Música (géneros) | **Last.fm API** | Etiquetas de género por artista | Útil si Spotify no entrega géneros |
| Películas | **TMDB API** | Pósters, géneros, año, director | Gratis para uso no comercial con atribución |
| Películas (historial) | **Letterboxd** (exportación CSV) | Lo que viste y tus calificaciones | Exportas desde tu cuenta e importas el CSV |
| Series | **TMDB** + **Trakt** | Pósters + historial de episodios vistos | Trakt tiene API con OAuth |
| Comidas | Captura manual + fotos propias | Platillo, lugar, tipo de cocina, calificación | Opcional: Google Places para ubicar el restaurante |
| Vacaciones | Captura manual + fotos propias | País, ciudad, fechas | Mapas: Mapbox o Google Maps |

## Spotify: restricciones actuales (modo desarrollo)

Desde febrero de 2026 Spotify cambió el modo desarrollo de su API:

- El dueño de la app necesita **Spotify Premium** activo; si se vence, la app deja de funcionar.
- Apps nuevas: **1 Client ID por desarrollador** y **5 usuarios por app**. Suficiente para ti y tu pareja.
- Las canciones de una playlist solo se devuelven para playlists **que el usuario es dueño o colaborador**. Core.Lore es tuya, así que funciona.
- Se quitaron las consultas por lotes (`GET /tracks`, `/artists`, etc.): hay que pedir cada elemento por ID.
- `GET /playlists/{id}/tracks` se renombró a `/items`.
- Se quitaron campos como `popularity` y `followers`.

Fuentes: [Guía de migración de feb 2026](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) · [Anuncio de Spotify](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)

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
| Docker Desktop | PostgreSQL local (Fase 2) |
| Spotify for Developers | Registrar la app y obtener el Client ID |
| TMDB | Cuenta y API key (Fase 2) |
