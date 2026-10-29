# CLAUDE.md — Samotracia

Contexto para Claude Code en este repositorio.

## Qué es
**Samotracia** es el proyecto de Aldair y su novia: figuras ilustradas (mandala, Piedra del Sol, rosetón, atrapasueños, papel picado, caleidoscopio, sigilo) que representan colecciones de gustos (música, películas, series, comidas, lugares) en tres lentes: **Él · Ella · Harmonía**. El tema central es la **dualidad**, complementaria u opuesta. Plan en `docs/01-plan-del-proyecto.md`; concepto en `docs/05-dualidad.md`.

## Conceptos clave
- No hay perfiles ni cuentas: un espacio compartido con dos voces (`A`, `B`). Los elementos nacidos juntos son `AB`; los que ambos tienen por separado son `MATCH`.
- Toda figura debe funcionar en las tres lentes y en los dos modos de dualidad.
- En textos de la interfaz se habla de "contraste", nunca de "diferencia" o "incompatibilidad".

## Idioma
- Documentación, textos de la interfaz y mensajes de commit: **español**.
- Código (nombres de variables, funciones, tipos): **inglés**.

## Stack
- Front: Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, Vitest.
- Estilo de las figuras: plano, con contornos oscuros y colores sólidos en capas (como mandala); sin brillos ni degradados.
- Figuras: `packages/figures`, TypeScript puro sobre Canvas 2D, sin dependencia de Vue. Todas reciben `FigureData` (ver `docs/02-arquitectura-y-stack.md`).
- Back (Fase 3): por decidir entre NestJS + Prisma (recomendado) y Spring Boot 3; base de datos PostgreSQL.

## Reglas
- Portadas y pósters se muestran en vivo desde la URL de la fuente, con enlace al original. Nunca se guardan copias de imágenes en el repo ni en la base de datos; solo URL y colores extraídos.
- Llaves y secretos solo en `.env` (ignorado por git). Mantener `.env.example` actualizado.
- Cada figura nueva debe funcionar con cualquier colección, no solo con música.
- El prototipo en `prototipos/core-lore/` es referencia visual; no se edita para producción.
