# Álbum de diagramas

Figuras ilustradas (pavo real, árbol, dalia, galaxia…) que retratan mis gustos: música, películas, series, comidas y lugares. Cada pluma, hoja, pétalo o estrella es un elemento real de la colección.

Primero con mis datos; después, en modo pareja.

## Estado

| Fase | Qué | Estado |
|---|---|---|
| 0 | Prototipo Core.Lore (4 figuras) | ✅ Hecho |
| 1 | "Mi música" con portadas reales (Vue + Spotify) | ⏳ Siguiente |
| 2 | Más colecciones + backend (Spring Boot + PostgreSQL) | Pendiente |
| 3 | Modo pareja | Pendiente |
| 4 | El álbum completo y exportación | Pendiente |

## Documentación

1. [Plan del proyecto](docs/01-plan-del-proyecto.md)
2. [Arquitectura y stack](docs/02-arquitectura-y-stack.md)
3. [Fuentes de datos y apps conectadas](docs/03-fuentes-de-datos.md)
4. [Configuración de VS Code y GitHub](docs/04-configuracion-vscode-github.md)

## Estructura

```
apps/web         Vue 3 + TypeScript (Fase 1)
apps/api         Spring Boot + PostgreSQL (Fase 2)
packages/figures Figuras en TypeScript sobre Canvas 2D
prototipos/      Prototipos HTML (Core.Lore)
docs/            Plan y decisiones
```

## Ver el prototipo

Abre `prototipos/core-lore/index.html` en el navegador (o con Live Server en VS Code).
