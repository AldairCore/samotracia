# Configuración: VS Code y GitHub

## 1. Requisitos en tu computadora

| Herramienta | Versión sugerida | Para |
|---|---|---|
| Git | reciente | control de versiones |
| Node.js | 22 LTS | frontend (Fase 1) |
| Java (JDK) | 21 | backend (Fase 2) |
| Docker Desktop | reciente | PostgreSQL local (Fase 2) |
| VS Code | reciente | editor |

## 2. Abrir el proyecto

1. Descomprime `album-de-diagramas.zip` donde guardes tus proyectos.
2. En VS Code: **File → Open Folder…** y elige la carpeta `album-de-diagramas`.
3. VS Code te ofrecerá instalar las extensiones recomendadas (`.vscode/extensions.json`). Acepta.
4. Abre `prototipos/core-lore/index.html` con la extensión **Live Server** (clic derecho → *Open with Live Server*) para ver el prototipo.

El repositorio ya trae un primer commit en la rama `main`.

## 3. Subirlo a GitHub

### Opción A: desde VS Code
1. Abre la vista **Source Control** (`Ctrl+Shift+G`).
2. Clic en **Publish Branch**.
3. Elige **Publish to GitHub private repository** y confirma el nombre `album-de-diagramas`.

### Opción B: desde la terminal
1. En github.com crea un repositorio **vacío y privado** llamado `album-de-diagramas` (sin README ni .gitignore).
2. En la terminal de VS Code, dentro de la carpeta:

```bash
git remote add origin https://github.com/<tu-usuario>/album-de-diagramas.git
git push -u origin main
```

### Opción C: que Claude lo suba
Crea el repositorio vacío en GitHub y pásale a Claude el nombre `<tu-usuario>/album-de-diagramas`. Con acceso a GitHub conectado, Claude puede subir el contenido y abrir los issues de cada fase.

## 4. Organizar el trabajo en GitHub

- **Issues:** uno por cada punto de las fases en `docs/01-plan-del-proyecto.md`.
- **Milestones:** `Fase 1 — Mi música`, `Fase 2 — Backend`, `Fase 3 — Pareja`.
- **Projects:** un tablero con columnas *Por hacer / En curso / Hecho*.

## 5. Crear la app web (inicio de la Fase 1)

```bash
cd apps
npm create vue@latest web
# Elige: TypeScript ✔, Pinia ✔, Vue Router ✔, Vitest ✔, ESLint + Prettier ✔
cd web
npm install
npm run dev
```

## 6. Llaves y secretos

- Copia `.env.example` a `.env` y llena tus valores. `.env` está en `.gitignore` y **nunca** se sube.
- Spotify: registra la app en https://developer.spotify.com/dashboard con la URL de redirección `http://127.0.0.1:5173/callback`.
