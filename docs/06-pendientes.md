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

## Datos
- [ ] Importar desde Spotify con OAuth PKCE (ver `docs/03-fuentes-de-datos.md`): registrar la app, agregar su cuenta en User Management.
- [ ] Extraer colores de la carátula en la app (canvas) en lugar del JSON fijo.
- [ ] Clasificación de géneros editable en la app.
- [ ] Portadas reales mostradas en vivo desde Spotify en la ficha.

## Repositorio
- [ ] Subir a GitHub (privado) y crear issues/milestones por fase.

## Decisiones abiertas
- [ ] Backend para la Fase 3: NestJS + Prisma (recomendado), Spring Boot o Supabase.
- [ ] Color base de cada voz y de lo nuestro.
- [ ] Qué colección sigue después de música.
