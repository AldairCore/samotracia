# Samotracia

Figuras ilustradas (mandala, Piedra del Sol, rosetón, atrapasueños, papel picado, caleidoscopio, sigilo) que retratan nuestros gustos: música, películas, series, comidas y lugares. Cada motivo, vidrio, cuenta o recorte es un elemento real de la colección.

Todo se ve en tres lentes, **Él · Ella · Harmonía**, alrededor de una idea: la **dualidad**, la que complementa y la que contrasta. Ver [el concepto](docs/05-dualidad.md).

## Estado

| Fase | Qué | Estado |
|---|---|---|
| 0 | Prototipo Core.Lore de una voz (7 figuras) | ✅ Hecho |
| 1 | Prototipo dual: dos playlists, lente Harmonía | ⏳ Siguiente |
| 2 | App de música con dos voces y portadas (Vue + Spotify) | Pendiente |
| 3 | Backend y más colecciones (Spring Boot + PostgreSQL) | Pendiente |
| 4 | El álbum completo y exportación | Pendiente |

## Documentación

1. [Plan del proyecto](docs/01-plan-del-proyecto.md)
2. [Arquitectura y stack](docs/02-arquitectura-y-stack.md)
3. [Fuentes de datos y apps conectadas](docs/03-fuentes-de-datos.md)
4. [Configuración de VS Code y GitHub](docs/04-configuracion-vscode-github.md)
5. [Dualidad: el concepto](docs/05-dualidad.md)

## Estructura

```
apps/web         Vue 3 + TypeScript (Fase 2)
apps/api         Spring Boot + PostgreSQL (Fase 3)
packages/figures Figuras en TypeScript sobre Canvas 2D
prototipos/      Prototipos HTML (Core.Lore)
docs/            Plan y decisiones
```

## Ver el prototipo

Abre `prototipos/core-lore/index.html` en el navegador (o con Live Server en VS Code).
