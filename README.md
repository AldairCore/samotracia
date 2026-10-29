# Samotracia

Figuras ilustradas (mandala, Piedra del Sol, rosetón, atrapasueños, caleidoscopio) que retratan nuestros gustos: música, películas, series, comidas y lugares. Cada motivo, vidrio, cuenta o recorte es un elemento real de la colección.

Todo se ve en tres lentes, **Él · Ella · Harmonía**, alrededor de una idea: la **dualidad**, la que complementa y la que contrasta. Ver [el concepto](docs/05-dualidad.md).

## Estado

| Fase | Qué | Estado |
|---|---|---|
| 0 | Prototipo Core.Lore de una voz (6 figuras) | ✅ Hecho |
| 1 | Prototipo dual: dos playlists, lente Harmonía | ⏳ Siguiente |
| 2 | App de música con dos voces y portadas (Vue + Spotify) | ⏳ Iniciada: app Vue con el mandala |
| 3 | Backend y más colecciones (Spring Boot + PostgreSQL) | Pendiente |
| 4 | El álbum completo y exportación | Pendiente |

## Documentación

1. [Plan del proyecto](docs/01-plan-del-proyecto.md)
2. [Arquitectura y stack](docs/02-arquitectura-y-stack.md)
3. [Fuentes de datos y apps conectadas](docs/03-fuentes-de-datos.md)
4. [Configuración de VS Code y GitHub](docs/04-configuracion-vscode-github.md)
5. [Dualidad: el concepto](docs/05-dualidad.md)
6. [Pendientes](docs/06-pendientes.md)

## Estructura

```
apps/web         Vue 3 + TypeScript (Fase 2)
apps/api         Spring Boot + PostgreSQL (Fase 3)
packages/figures Figuras en TypeScript sobre Canvas 2D
prototipos/      Prototipos HTML (Core.Lore)
docs/            Plan y decisiones
```

## Correr la app

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # abre http://127.0.0.1:5173
npm run build      # compila a apps/web/dist
npm run typecheck  # revisa tipos de figuras y app
```

La app muestra el mandala de Core.Lore con colores vivos u originales, foco por género y ficha al pasar el cursor. Los ajustes visuales (velocidad de giro, onda de luz, ancho de pétalos, hover) están en `MandalaOptions` dentro de `packages/figures/src/mandala.ts`.

## Ver el prototipo

Abre `prototipos/core-lore/index.html` en el navegador. Ahí están todas las figuras exploradas; es la referencia visual para portar las que faltan.

## Pendientes

Ver [docs/06-pendientes.md](docs/06-pendientes.md).
