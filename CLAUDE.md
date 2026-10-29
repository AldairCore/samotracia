# CLAUDE.md — Álbum de diagramas

Contexto para Claude Code en este repositorio.

## Qué es
Proyecto personal de Aldair: figuras ilustradas (pavo real, árbol, dalia, galaxia) que representan colecciones de gustos (música, películas, series, comidas, viajes). Primero datos propios, después modo pareja. Plan completo en `docs/01-plan-del-proyecto.md`.

## Idioma
- Documentación, textos de la interfaz y mensajes de commit: **español**.
- Código (nombres de variables, funciones, tipos): **inglés**.

## Stack
- Front: Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, Vitest.
- Figuras: `packages/figures`, TypeScript puro sobre Canvas 2D, sin dependencia de Vue. Todas reciben `FigureData` (ver `docs/02-arquitectura-y-stack.md`).
- Back (Fase 2): Spring Boot 3, Java 21, JPA/Hibernate, PostgreSQL, Flyway.

## Reglas
- Portadas y pósters se muestran en vivo desde la URL de la fuente, con enlace al original. Nunca se guardan copias de imágenes en el repo ni en la base de datos; solo URL y colores extraídos.
- Llaves y secretos solo en `.env` (ignorado por git). Mantener `.env.example` actualizado.
- Cada figura nueva debe funcionar con cualquier colección, no solo con música.
- El prototipo en `prototipos/core-lore/` es referencia visual; no se edita para producción.
