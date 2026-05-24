<div align="center">

<br>

<img src="https://img.shields.io/badge/Quarkdown-Live%20Editor-6c47ff?style=for-the-badge&labelColor=1a1a2e" alt="Quarkdown Live Editor" height="42">

<br><br>

**A structured visual editor for the [Quarkdown](https://github.com/iamgio/quarkdown) typesetting language.**  
Write documents with a block UI. See the HTML preview update in real time. Never memorize function syntax again.

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/Thedocwhocode/quarkdown-live-editor/editor-ci.yml?branch=main&label=CI&logo=github&style=flat-square)](../../actions/workflows/editor-ci.yml)
[![Tests](https://img.shields.io/badge/tests-36%20passing-22c55e?style=flat-square&logo=vitest&logoColor=white)](../__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](../LICENSE)

<br>

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Java](https://img.shields.io/badge/Java-21-f89820?style=flat-square&logo=openjdk&logoColor=white)](https://adoptium.net)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-6-d30707?style=flat-square)](https://codemirror.net)
[![Zustand](https://img.shields.io/badge/Zustand-5-443e3e?style=flat-square)](https://zustand-demo.pmnd.rs)

<br><br>

</div>

---

## What Is This?

Quarkdown is a Turing-complete Markdown flavor that compiles to HTML, PDF, and slides.
Its power comes from a rich standard library of native functions — layouts, variables,
conditionals, loops, diagrams, math — but writing it by hand requires knowing the exact
syntax for every function and its parameters.

**Quarkdown Live Editor** removes that barrier. Instead of typing `.figure {diagram.png} caption:{System overview}` from memory, you click **Figure** in the toolbar, fill in a form, and the correct `.qd` syntax is generated automatically. The full source is always visible and editable in a CodeMirror pane, and a live HTML preview updates within ~400 ms of every keystroke.

The editor is purpose-built for Quarkdown's domain — it understands document types (`plain`, `paged`, `slides`, `docs`), named and positional arguments, lambda body blocks, and preserves any syntax it cannot yet parse structurally.

---

## Interface

```
┌───────────────────┬──────────────────────────────────┬──────────────────────┐
│  Document Setup   │  Editor Surface                  │  Live Preview        │
│  ───────────────  │  ──────────────────────────────  │  ──────────────────  │
│  Type:  paged     │  H1  My Document                 │                      │
│  Title: …         │  ¶   Introduction paragraph…     │   <rendered HTML>    │
│  Author: …        │  .figure  src  caption  width    │                      │
│  ───────────────  │  [+ Add block]                   │  Inspector           │
│  Block Library    │                                  │  ─────────────────   │
│  ▸ layout         │  ▼ Source (.qd)                  │  .figure             │
│    .container     │    .doctype {paged}               │  src: diagram.png    │
│    .box           │    .docname {My Document}         │  caption: …          │
│    .column        │    # My Document                 │                      │
└───────────────────┴──────────────────────────────────┴──────────────────────┘
```

> **Demo:** Screenshot coming soon — run the editor locally to see it in action.

---

## Features

<table>
<tr>
<td width="50%">

**Editor**
- 🧱 Structured block editor (paragraph, H1–H6, code fence, function call)
- 📚 Block library — searchable catalog grouped by category
- 🗂️ Document setup panel (doctype, title, author, theme)
- 🔍 Inspector panel — params and description for the selected block

</td>
<td width="50%">

**Source & Preview**
- ⚡ Live HTML preview — debounced compile in ~400 ms
- ✏️ CodeMirror 6 source view — always visible and editable
- 🔄 Bidirectional sync — UI and source stay in step
- 🛡️ Opaque-node fallback — unknown syntax is never discarded

</td>
</tr>
<tr>
<td>

**Function Registry**
- 30+ stdlib entries with typed parameter forms
- Categories: layout, media, math, diagrams, variables, logic, slides, advanced
- Serializer templates with named/positional arg support

</td>
<td>

**Diagnostics**
- Compiler errors translated into plain-English messages
- Errors mapped back to the affected block
- Stale-preview indicator while a new compile is in progress

</td>
</tr>
</table>

---

## Requirements

| Dependency | Version | Purpose |
|---|:---:|---|
| [Node.js](https://nodejs.org) | **≥ 20** | Editor frontend and compile proxy server |
| [Java](https://adoptium.net) | **21** | Quarkdown CLI (JVM-based compiler) |
| Gradle Wrapper | bundled | Build the Quarkdown CLI — one-time |

---

## Quickstart

### 1 — Build the Quarkdown CLI

Run from the **repository root** (one-time, ~2 min on first run):

```bash
./gradlew installDist
```

This installs the Quarkdown binary to `build/install/quarkdown/bin/quarkdown`.
The editor's compile server finds it automatically — no environment variable needed.

### 2 — Install editor dependencies

```bash
cd editor
npm install
```

### 3 — Start the editor

```bash
npm run dev
```

Two processes start concurrently:

| Process | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Compile API (Express) | http://localhost:3001 |

Open **http://localhost:5173** in your browser.

> **Tip:** If the Preview pane shows a "binary not found" banner, re-run `./gradlew installDist` from the repo root.

---

## Architecture

The editor is structured in three layers:

```
┌──────────────────────────────────────────────────────────┐
│  React UI  ·  Vite  ·  port 5173                         │
│  Zustand stores → IR → Serializer → .qd source string    │
└────────────────────────┬─────────────────────────────────┘
                         │  POST /api/compile
┌────────────────────────▼─────────────────────────────────┐
│  Express proxy server  ·  port 3001                      │
│  Writes .qd to /tmp, spawns Quarkdown CLI via execFile   │
└────────────────────────┬─────────────────────────────────┘
                         │  child_process.execFile  --pipe
┌────────────────────────▼─────────────────────────────────┐
│  Quarkdown CLI  ·  build/install/quarkdown/bin/quarkdown  │
│  Compiles .qd → HTML, returns HTML via stdout            │
└──────────────────────────────────────────────────────────┘
```

**Forward pipeline (UI → Preview):**
```
UI action → Zustand IR → serializeDocument() → .qd string
          → POST /api/compile → HTML → preview iframe srcdoc
```

**Reverse pipeline (Source → UI):**
```
CodeMirror edit → debounce 500 ms → parseDocument() → IR patch
               → Zustand store update → UI re-renders blocks
               → scheduleCompile() → preview refresh
```

---

## Project Structure

<details>
<summary><strong>editor/ — click to expand</strong></summary>

```
editor/
├── server.ts                      Express API: POST /api/compile, GET /api/health
├── src/
│   ├── core/
│   │   ├── ir/
│   │   │   ├── types.ts           IR interfaces (QdDocumentNode, QdBlockNode, …)
│   │   │   └── builders.ts        Factory helpers (buildHeading, buildFunctionCall, …)
│   │   ├── registry/
│   │   │   ├── catalog.ts         30+ stdlib entries with UI metadata
│   │   │   ├── types.ts           FunctionRegistryItem, FunctionParamSchema
│   │   │   └── index.ts           lookupByName, search, byCategory
│   │   ├── serializer/
│   │   │   └── serialize.ts       Deterministic IR → .qd serializer
│   │   ├── parser/
│   │   │   └── parse.ts           Best-effort .qd → IR (opaque fallback)
│   │   └── compiler-adapter/      HTTP adapter to the compile API
│   ├── features/
│   │   ├── document/store.ts      Zustand: document IR, block CRUD, selection
│   │   ├── preview/
│   │   │   ├── store.ts           Zustand: HTML output, isCompiling, diagnostics
│   │   │   └── orchestrator.ts    Debounced compile scheduler with abort support
│   │   └── source-sync/sync.ts    Bidirectional sync guard
│   ├── components/
│   │   ├── app-shell/             Three-panel CSS grid shell
│   │   ├── toolbar/               Quick-insert toolbar buttons
│   │   ├── block-library/         Searchable block catalog (left sidebar)
│   │   ├── editor-surface/        Block list: Paragraph, Heading, FunctionCall, Opaque
│   │   ├── document-setup/        Metadata form (doctype, title, author, theme)
│   │   ├── inspector/             Selected-block property viewer (right panel)
│   │   ├── source-view/           CodeMirror 6 source editor
│   │   ├── preview/               iframe preview pane with stale/error overlays
│   │   └── diagnostics/           Compiler error list
│   └── styles/
│       ├── tokens.css             CSS custom properties (colors, spacing, fonts)
│       └── globals.css            Global reset and base styles
└── __tests__/
    ├── serializer.test.ts         36 deterministic serializer tests
    ├── parser.test.ts             Round-trip and edge-case parser tests
    └── registry.test.ts           Registry integrity and lookup tests
```

</details>

---

## Running Tests

```bash
cd editor
npm test
```

All 36 unit tests run via [Vitest](https://vitest.dev):

| File | Coverage |
|---|---|
| `serializer.test.ts` | Every block type, named/positional args, body indentation, meta preamble |
| `parser.test.ts` | Doctype, heading, code fence, function calls, round-trip fidelity |
| `registry.test.ts` | Catalog integrity, no duplicate IDs, lookup and search |

```bash
npx tsc --noEmit   # type check (no output = clean)
npm run build      # production bundle
```

---

## Deployment

The editor has two runtime components that must be considered separately:

| Component | Process | Default port |
|---|---|:---:|
| Frontend (React) | Vite dev server or static files | `5173` |
| Compile API (Express) | `server.ts` via `tsx` | `3001` |

> **Important:** The compile API spawns the Quarkdown **JVM binary** as a subprocess.
> Pure static-file hosts (Vercel, Netlify, Cloudflare Pages) **cannot** run it.
> Full live-preview requires a host with Java 21 available.

---

### Option A — Full-stack VPS via Dokploy ✅ Recommended

[Dokploy](https://dokploy.com) is an open-source self-hosted PaaS that manages Docker containers on your VPS from a web dashboard — think Heroku, but on your own machine.

<details>
<summary><strong>Step 1 — Create a Dockerfile at the repo root</strong></summary>

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

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Quarkdown CLI
COPY --from=jvm-build /build/build/install/quarkdown ./build/install/quarkdown

# Editor API server
COPY editor/package*.json ./
RUN npm ci --omit=dev
COPY editor/server.ts ./
COPY editor/tsconfig.json ./

# Frontend static build
COPY --from=node-build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npx", "tsx", "server.ts"]
```

</details>

<details>
<summary><strong>Step 2 — Serve the static frontend from Express in production</strong></summary>

Add the following snippet to `server.ts` so a single container serves both the API and the frontend:

```typescript
import path from 'path'

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  )
}
```

</details>

<details>
<summary><strong>Step 3 — Configure Vite for same-origin API calls</strong></summary>

In `vite.config.ts`, make fetch calls use a relative path in production builds:

```typescript
define: {
  'import.meta.env.VITE_API_BASE': JSON.stringify(
    process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  ),
},
```

</details>

<details>
<summary><strong>Step 4 — Deploy with Dokploy</strong></summary>

1. Install Dokploy on your VPS — follow the [official quickstart](https://docs.dokploy.com/docs/core).
2. Open the Dokploy dashboard → **New Project** → **New Application**.
3. Connect your GitHub repository (`Thedocwhocode/quarkdown-live-editor`).
4. Set **Branch** to `main` and **Build Type** to `Dockerfile`.
5. Under **Network**, expose port `3001` (map to `80` if using a reverse proxy).
6. Click **Deploy** — Dokploy builds the image and starts the container.
7. Configure a **Domain** in the Dokploy panel and enable **HTTPS** via Let's Encrypt; Traefik is configured automatically.

Every subsequent push to the configured branch triggers an automatic rebuild and redeploy.

</details>

---

### Option B — Vercel (frontend only)

Vercel can host the React static frontend. The live-preview compile feature will be **unavailable** unless you deploy the compile API on a separate service that supports Java 21.

<details>
<summary><strong>Vercel configuration</strong></summary>

**Vercel project settings:**

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `editor` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Environment variable (Vercel dashboard):**
```
VITE_API_BASE=https://your-backend-host.example.com
```

</details>

<details>
<summary><strong>Hosting the compile API separately</strong></summary>

| Service | Notes |
|---|---|
| **Railway** | Add the Dockerfile; set `PORT=3001` |
| **Render** | Use the Docker runtime; set `PORT=3001` |
| **Your own VPS** | Use Dokploy (Option A above) |

Enable CORS in `server.ts` for the Vercel frontend origin:

```typescript
import cors from 'cors'
app.use(cors({ origin: 'https://your-app.vercel.app' }))
```

</details>

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the editor-specific contribution guide,
including how to add a new Quarkdown function to the registry.

For general Quarkdown project contributions, see the root
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## License

<div align="center">

This editor is licensed under the **GNU General Public License v3.0**.

| | |
|---|---|
| New editor code | Copyright © 2025 Luiz Rodolfo (Thedocwhocode) |
| Upstream Quarkdown compiler | Copyright © 2025 Giorgio Garofalo |

[Full license text](../LICENSE) · [Short copyright notice](./LICENSE) · [Code provenance](../NOTICE)

</div>
