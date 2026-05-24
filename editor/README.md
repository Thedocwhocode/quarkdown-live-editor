# Quarkdown Live Editor

> A structured visual editor for the [Quarkdown](https://github.com/iamgio/quarkdown) typesetting language.

[![Tests](https://img.shields.io/badge/tests-36%20passing-brightgreen)](#running-tests)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](../LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-green)](https://nodejs.org)
[![Java](https://img.shields.io/badge/Java-21-orange)](https://adoptium.net)

---

## What Is This?

Quarkdown is a Turing-complete Markdown flavor that compiles to HTML, PDF, and slides.
Its power comes from a rich standard library of native functions — layouts, variables,
conditionals, loops, diagrams, math — but writing it by hand requires knowing the syntax
for each function and its parameters.

**Quarkdown Live Editor** is a hybrid structured editor that removes that barrier.
Instead of typing `.figure {diagram.png} caption:{System overview}` from memory, you
click "Figure" in the toolbar, fill in a form, and the correct `.qd` syntax is generated
for you automatically. At the same time, the full source is always visible and editable,
and a live HTML preview updates within milliseconds of every change.

The editor is purpose-built for Quarkdown's domain. It is not a generic Markdown editor:
it understands Quarkdown's document types (`plain`, `paged`, `slides`, `docs`), its
function call syntax, named and positional arguments, lambda body blocks, and opaque
preservation of syntax it cannot yet parse structurally.

---

## Demo

> Screenshot coming soon. Run the editor locally to see it in action.

```
[ Document Setup ] [ Block List ] | [ Editor Surface          ] | [ Preview ] [ Inspector ]
                                  |  H1  Title                  |  <rendered HTML>
                                  |  ¶   Paragraph…             |
                                  |  .figure  src caption width |
                                  |  [+ Add block]              |
                                  |_____________________________|
                                  | Source (.qd)    ▸           |
```

---

## Features

- **Live HTML preview** — debounced compile via the real Quarkdown CLI; updates in ~400 ms.
- **Function registry** — 30+ Quarkdown stdlib entries (document metadata, layout, media,
  tables, diagrams, math, variables, logic, slides, advanced), each with a typed parameter form.
- **Structured block editor** — paragraph, heading (H1–H6), code fence, and function call
  blocks; move, delete, and select blocks with one click.
- **Document setup panel** — set doctype, title, author, description, language, and theme
  without writing a single line of source.
- **Block library** — searchable catalog of all insertable blocks, grouped by category.
- **CodeMirror 6 source view** — always-visible `.qd` source, editable and bidirectionally
  synced with the block editor.
- **Opaque-node fallback** — any `.qd` syntax that cannot be parsed structurally is preserved
  verbatim in an editable raw-source block. No content is ever discarded.
- **Diagnostics panel** — compiler errors are translated into plain-English messages and
  mapped back to the affected block.
- **Inspector panel** — shows named arguments, category, and description for the selected block.

---

## Requirements

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 | Editor frontend and compile proxy server |
| Java | 21 | Quarkdown CLI (JVM-based compiler) |
| Gradle Wrapper | Bundled | Build the Quarkdown CLI (one-time) |

---

## Quickstart

### 1. Build the Quarkdown CLI (one-time)

From the **repository root**:

```bash
./gradlew installDist
```

This compiles the Kotlin codebase and installs the Quarkdown binary to
`build/install/quarkdown/bin/quarkdown`. The editor's compile server detects
this binary automatically; no environment variable is needed.

### 2. Install editor dependencies

```bash
cd editor
npm install
```

### 3. Start the editor

```bash
npm run dev
```

This starts two processes concurrently:
- **Frontend** (Vite) → [http://localhost:5173](http://localhost:5173)
- **Compile API** (Express) → [http://localhost:3001](http://localhost:3001)

Open your browser at `http://localhost:5173`.

### 4. Verify the compiler is reachable

The Preview pane shows a banner if the Quarkdown binary was not found.
If you see it, re-run `./gradlew installDist` from the repo root.

---

## Architecture

The editor is structured in three layers:

```
┌──────────────────────────────────────────────────────┐
│  React UI (Vite, port 5173)                          │
│  Zustand stores → IR → Serializer → .qd source       │
└────────────────────────┬─────────────────────────────┘
                         │ POST /api/compile
┌────────────────────────▼─────────────────────────────┐
│  Express proxy server (port 3001)                    │
│  Writes .qd to /tmp, spawns Quarkdown CLI            │
└────────────────────────┬─────────────────────────────┘
                         │ child_process.execFile
┌────────────────────────▼─────────────────────────────┐
│  Quarkdown CLI (build/install/quarkdown/bin/…)        │
│  Compiles .qd → HTML, returns via stdout (--pipe)    │
└──────────────────────────────────────────────────────┘
```

**IR pipeline (forward direction):**

```
UI action → document store (IR) → serializeDocument() → .qd string
         → POST /api/compile → HTML response → preview iframe srcdoc
```

**Bidirectional sync (reverse direction):**

```
CodeMirror edit → debounce 500ms → parseDocument() → IR patch
               → document store update → UI re-renders blocks
               → scheduleCompile() → preview refresh
```

Opaque blocks preserve any `.qd` syntax that the best-effort parser cannot
recognize, guaranteeing that content typed directly in the source view is
never discarded when switching back to the block editor.

---

## Project Structure

```
editor/
  server.ts                     Express API: POST /api/compile, GET /api/health
  src/
    core/
      ir/types.ts               IR interfaces (QdDocumentNode, QdBlockNode, …)
      ir/builders.ts            Factory helpers (buildHeading, buildFunctionCall, …)
      registry/catalog.ts       30+ stdlib function entries with UI metadata
      registry/index.ts         Lookup helpers (lookupByName, search, byCategory)
      serializer/serialize.ts   Deterministic IR → .qd serializer
      parser/parse.ts           Best-effort .qd → IR parser (opaque fallback)
      compiler-adapter/         HTTP adapter to the compile API
    features/
      document/store.ts         Zustand: document IR, block CRUD, selection state
      preview/store.ts          Zustand: HTML output, isCompiling, diagnostics
      preview/orchestrator.ts   Debounced compile scheduler with abort support
      source-sync/sync.ts       Bidirectional sync guard
    components/
      app-shell/                Three-panel CSS grid shell
      toolbar/                  Quick-insert toolbar buttons
      block-library/            Searchable block catalog (left sidebar)
      editor-surface/           Block list with ParagraphBlock, HeadingBlock, …
      document-setup/           Metadata form (doctype, title, author, theme)
      inspector/                Selected-block property viewer (right panel)
      source-view/              CodeMirror 6 source editor
      preview/                  iframe preview pane with stale/error overlays
      diagnostics/              Compiler error list
    styles/
      tokens.css                CSS custom properties (colors, spacing, fonts)
      globals.css               Global reset and base styles
  __tests__/
    serializer.test.ts          36 deterministic serializer tests
    parser.test.ts              Round-trip and edge-case parser tests
    registry.test.ts            Registry integrity and lookup tests
```

---

## Running Tests

```bash
cd editor
npm test
```

All 36 unit tests run via [Vitest](https://vitest.dev). They cover:

| File | What it tests |
|---|---|
| `__tests__/serializer.test.ts` | Every block type, named/positional args, body indentation, meta preamble |
| `__tests__/parser.test.ts` | Doctype, heading, code, function calls, round-trip fidelity |
| `__tests__/registry.test.ts` | Catalog integrity, no duplicate IDs, lookup and search |

Type-checking (no test runner needed):

```bash
npx tsc --noEmit
```

Production build:

```bash
npm run build
```

---

## Deployment

The editor has two distinct runtime components:

| Component | Process | Port |
|---|---|---|
| Frontend (React) | Vite (dev) or static files (prod) | 5173 |
| Compile API (Node.js/Express) | `server.ts` via `tsx` | 3001 |

The compile API **must be co-located with a Java 21 runtime** because it spawns the Quarkdown JVM binary as a subprocess.
This means pure static-file hosts (Vercel, Netlify, Cloudflare Pages) can only serve the frontend — the live-preview feature requires a separate backend process with Java available.

---

### Option A — Full-stack VPS via Dokploy (recommended)

[Dokploy](https://dokploy.com) is an open-source self-hosted PaaS that manages Docker containers on your VPS from a web UI.
This is the recommended path because it gives you the full editor with working live preview.

#### 1. Create a `Dockerfile` at the repo root

```dockerfile
# ── Stage 1: build the Quarkdown CLI ──────────────────────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS jvm-build
WORKDIR /build
COPY . .
RUN ./gradlew installDist --no-daemon -q

# ── Stage 2: build the editor frontend ────────────────────────────────────────
FROM node:20-slim AS node-build
WORKDIR /app
COPY editor/package*.json ./
RUN npm ci
COPY editor/ ./
RUN npm run build

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Quarkdown CLI distribution
COPY --from=jvm-build /build/build/install/quarkdown ./build/install/quarkdown

# Copy editor sources (server.ts needs tsx)
COPY editor/package*.json ./
RUN npm ci --omit=dev
COPY editor/server.ts ./
COPY editor/tsconfig.json ./

# Copy frontend static build
COPY --from=node-build /app/dist ./dist

# Serve the static build through the Express server as well
ENV NODE_ENV=production
EXPOSE 3001

CMD ["npx", "tsx", "server.ts"]
```

> **Tip:** The production `server.ts` should serve the `dist/` folder as static files on port 3001 in addition to the `/api/*` routes, so a single container handles everything. Update `server.ts` to add:
> ```typescript
> import path from 'path'
> if (process.env.NODE_ENV === 'production') {
>   app.use(express.static(path.join(__dirname, 'dist')))
>   app.get('*', (_req, res) =>
>     res.sendFile(path.join(__dirname, 'dist', 'index.html'))
>   )
> }
> ```

#### 2. Configure Vite to point at the same origin in production

In `vite.config.ts`, the `/api` proxy is only active in dev mode. For the production build, set `VITE_API_BASE` to an empty string so fetch calls go to `/api/compile` on the same origin:

```typescript
// vite.config.ts
define: {
  'import.meta.env.VITE_API_BASE': JSON.stringify(
    process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  ),
},
```

#### 3. Deploy with Dokploy

1. Install Dokploy on your VPS by following the [official quickstart](https://docs.dokploy.com/docs/core).
2. Open the Dokploy dashboard → **New Project** → **New Application**.
3. Connect your GitHub repository (`Thedocwhocode/quarkdown-live-editor`).
4. Set **Branch** to `main` (or your production branch) and **Build Type** to `Dockerfile`.
5. Under **Network**, expose port `3001` and map it to the host port you want (e.g. `80` behind a reverse proxy, or `3001` directly).
6. Click **Deploy**. Dokploy builds the Docker image and starts the container.
7. Optionally configure a **Domain** in the Dokploy panel and enable **HTTPS** via Let's Encrypt — Dokploy handles the Traefik reverse proxy configuration automatically.

After the first deploy, every push to the configured branch triggers an automatic rebuild.

---

### Option B — Vercel (frontend only)

Vercel can host the static frontend build. The live-preview feature will be unavailable unless you also deploy the compile API somewhere that supports long-running processes and Java 21 (e.g. Railway, Render, or your own VPS).

#### 1. Build and configure

```bash
cd editor
npm run build          # produces editor/dist/
```

In your Vercel project settings:
- **Framework Preset**: Vite
- **Root Directory**: `editor`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### 2. Point the frontend at an external API

Set the following environment variable in the Vercel dashboard:

```
VITE_API_BASE=https://your-backend-host.example.com
```

Then update `editor/src/core/compiler-adapter/http.ts` (or wherever the base URL is configured) to read `import.meta.env.VITE_API_BASE`.

#### 3. Deploy the compile API separately

Deploy `server.ts` to any service that supports Node.js 20 + Java 21:

| Service | Notes |
|---|---|
| **Railway** | Add a Dockerfile; set `PORT=3001` |
| **Render** | Use the Docker runtime; set `PORT=3001` |
| **Your own VPS** | Use Dokploy (see Option A above) |

Make sure CORS is enabled in `server.ts` for the Vercel frontend origin:

```typescript
import cors from 'cors'
app.use(cors({ origin: 'https://your-app.vercel.app' }))
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the editor-specific contribution guide,
including how to add a new Quarkdown function to the registry.

For general Quarkdown project contributions, see the root
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## License

This editor is licensed under the **GNU General Public License v3.0**.

- New editor code: Copyright (C) 2025 Luiz Rodolfo (Thedocwhocode)
- Upstream Quarkdown compiler: Copyright (C) 2025 Giorgio Garofalo

See [editor/LICENSE](./LICENSE) for the short copyright notice and attribution,
[LICENSE](../LICENSE) for the full GPLv3 text, and [NOTICE](../NOTICE) for a
detailed breakdown of which files belong to upstream and which are new.
