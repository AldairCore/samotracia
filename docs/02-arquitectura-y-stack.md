# Arquitectura y stack

## 1. Recomendación corta

| Capa | Recomendación | Por qué |
|---|---|---|
| Frontend | **Vue 3 + TypeScript + Vite + Pinia** | Es lo que ya dominas (Composition API, Pinia); TypeScript ayuda mucho con los modelos de datos de las figuras |
| Figuras | **Módulo TypeScript independiente** sobre Canvas 2D | Las figuras del prototipo ya están en Canvas; separarlas del framework permite reutilizarlas y probarlas aparte |
| Backend (Fase 2+) | **Spring Boot 3 + Java 21** | Tu stack fuerte; maneja OAuth, llaves de API y extracción de colores en el servidor |
| Base de datos (Fase 2+) | **PostgreSQL** | Gratis, fácil en Docker, columnas `JSONB` para metadatos variables por colección, hosting gratuito disponible |
| Migraciones | Flyway | Control de versiones del esquema, igual que el código |
| Pruebas | Vitest (front), JUnit 5 + Testcontainers (back) | Estándar en cada lado |

## 2. ¿Necesitamos base de datos?

**En la Fase 1, no.** La música vive en Spotify: la app la consulta y guarda el resultado (grupos, colores, ajustes manuales) como JSON en el navegador o en un archivo exportable. Así validas las figuras sin montar infraestructura.

**Desde la Fase 2, sí.** Hace falta en cuanto:
- hay datos que no viven en ninguna API (comidas, viajes, fotos propias, clasificaciones manuales);
- hay más de un usuario (modo pareja);
- quieres conservar historial.

### ¿Por qué PostgreSQL y no SQL Server?
SQL Server funcionaría y lo conoces bien, pero para un proyecto personal en la nube PostgreSQL es más práctico: no tiene costo de licencia, hay planes gratuitos administrados (Neon, Supabase, Railway) y su tipo `JSONB` encaja con colecciones que guardan metadatos distintos (una canción no tiene los mismos campos que un viaje). Con JPA/Hibernate el cambio para ti es mínimo.

### Alternativa: Supabase en lugar de backend propio
Supabase da PostgreSQL + autenticación + almacenamiento de fotos + reglas por usuario (Row Level Security) sin escribir backend. Es la ruta más rápida para el modo pareja. La contra: algunas llaves secretas (TMDB, Spotify si no usas PKCE) siguen necesitando un lugar seguro (Edge Functions de Supabase). **Recomendación:** si quieres aprender y controlar todo, Spring Boot; si quieres llegar rápido a la Fase 3, Supabase.

## 3. Estructura del repositorio (monorepo)

```
album-de-diagramas/
├── apps/
│   ├── web/            # Vue 3 + TS (Fase 1)
│   └── api/            # Spring Boot (Fase 2)
├── packages/
│   └── figures/        # Figuras en TS: peacock, tree, dahlia, galaxy
├── prototipos/
│   └── core-lore/      # Prototipo HTML actual
├── docs/               # Plan, arquitectura, fuentes de datos, configuración
├── CLAUDE.md           # Contexto y convenciones para Claude Code
└── README.md
```

## 4. Modelo de datos (borrador)

Toda figura consume la misma forma: **colección → grupos (árbol) → elementos**.

```ts
// Contrato que reciben todas las figuras
interface FigureData {
  title: string;
  groups: Group[];          // nivel 1: género / tipo de cocina / país
}
interface Group {
  id: string; name: string; color: string;   // color del grupo (borde)
  children?: Group[];                          // subgénero / artista / ciudad
  items?: Item[];
}
interface Item {
  id: string; position: number;
  title: string; subtitle?: string;            // canción / artista
  imageUrl?: string;                           // portada, en vivo desde la fuente
  palette: string[];                           // colores dominantes (hex)
  sourceUrl?: string;                          // enlace a Spotify / TMDB
}
```

Tablas (Fase 2, PostgreSQL):

| Tabla | Campos clave |
|---|---|
| `app_user` | id, nombre, email |
| `couple` | id, user_a, user_b |
| `collection` | id, owner_id, couple_id (nullable), tipo (`MUSIC`, `MOVIES`, `SERIES`, `FOOD`, `TRAVEL`), título, fuente |
| `group_node` | id, collection_id, parent_id, nombre, color, orden |
| `item` | id, collection_id, group_node_id, posición, título, subtítulo, fuente, id_externo, image_url, palette `JSONB`, metadata `JSONB` |
| `figure_view` | id, collection_id, figura (`PEACOCK`, `TREE`, `DAHLIA`, `GALAXY`), config `JSONB` |

El modo pareja compara `item.fuente + id_externo` entre dos colecciones para encontrar coincidencias.

## 5. Flujo de datos (Fase 1)

1. Inicio de sesión con Spotify usando **Authorization Code con PKCE** (no requiere backend ni secreto).
2. `GET /me/playlists` → eliges una playlist tuya.
3. `GET /playlists/{id}/items` → canciones, artistas, álbumes e imágenes.
4. Géneros: del artista si la API los entrega; si no, clasificación manual en la app (como se hizo en Core.Lore).
5. Colores: se dibuja la miniatura en un `<canvas>` y se calculan los colores dominantes (igual que en el prototipo). Si la imagen no permite lectura por CORS, se mueve este paso al backend.
6. Se arma `FigureData` y se dibuja la figura elegida.

## 6. Hosting (cuando toque publicar)

| Parte | Opciones |
|---|---|
| Frontend | GitHub Pages, Netlify o Vercel |
| Backend | Render, Railway o Fly.io |
| Base de datos | Neon o Supabase (PostgreSQL administrado) |

Revisa los planes gratuitos al momento de elegir; cambian seguido.
