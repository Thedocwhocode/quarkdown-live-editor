# Quarkdown Live Editor

> A structured visual editor for the [Quarkdown](https://github.com/iamgio/quarkdown) typesetting language —
> write documents with a block UI, see the HTML preview update in real time.

[![Tests](https://img.shields.io/badge/tests-36%20passing-brightgreen)](editor/__tests__)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-green)](https://nodejs.org)
[![Java](https://img.shields.io/badge/Java-21-orange)](https://adoptium.net)

---

## About This Repository

This is a fork of [iamgio/quarkdown](https://github.com/iamgio/quarkdown) that adds
**Quarkdown Live Editor** — a purpose-built structured editor for the Quarkdown language.

The fork retains the Quarkdown compiler, standard library, HTML renderer, CLI, and server
exactly as they are in upstream. The editor subproject (`editor/`) is built on top of them
and integrates at runtime via the CLI's `--pipe` flag.

For the full editor documentation, see **[editor/README.md](editor/README.md)**.

---

## What Is Quarkdown Live Editor?

Quarkdown is a Turing-complete Markdown flavor that compiles to HTML, PDF, and slides.
Its power comes from a rich standard library of functions — layouts, variables, conditionals,
loops, diagrams, math — but using it by hand requires knowing the exact syntax for every
function and its parameters.

**Quarkdown Live Editor** removes that barrier. Instead of memorizing
`.figure {diagram.png} caption:{System overview}`, you click **Figure** in the toolbar,
fill in a form, and the correct `.qd` source is generated automatically. The full source
is always visible and editable in a CodeMirror pane, and a live HTML preview updates
within ~400 ms of every change.

```
┌─────────────────┬──────────────────────────────┬──────────────────────┐
│  Document Setup │  Block Editor                │  Live Preview        │
│  ─────────────  │  ───────────                 │  ──────────────      │
│  Type:  paged   │  # My Document               │                      │
│  Title: …       │  ¶  Introduction text…       │  <rendered HTML>     │
│  Author: …      │  .figure  src  caption       │                      │
│  ─────────────  │  [+ Add block]               │                      │
│  Blocks         │                              │  Inspector           │
│  layout         │  ▸ Source (.qd)              │  .figure             │
│  .container     │    .doctype {paged}           │  src: diagram.png    │
│  .box           │    .docname {My Document}     │  caption: …          │
│  .column        │    # My Document              │                      │
└─────────────────┴──────────────────────────────┴──────────────────────┘
```

---

## Features

- **Live HTML preview** — debounced compilation via the real Quarkdown CLI; updates in ~400 ms
- **Function registry** — 30+ stdlib entries with typed parameter forms (layout, media, math, diagrams, variables, logic, slides, …)
- **Structured block editor** — paragraph, heading (H1–H6), code fence, function call blocks; move and delete blocks with one click
- **Document setup panel** — set doctype, title, author, description, language, and theme without writing any source
- **Block library** — searchable catalog of all insertable blocks, grouped by category
- **CodeMirror 6 source view** — always-visible `.qd` source, fully editable and bidirectionally synced
- **Opaque-node fallback** — `.qd` syntax the editor cannot parse is preserved verbatim and never discarded
- **Diagnostics panel** — compiler errors translated into plain-language messages

---

## Quickstart

### 1. Build the Quarkdown CLI (one-time)

```bash
./gradlew installDist
```

### 2. Start the editor

```bash
cd editor
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

The compile API runs at `http://localhost:3001`. If the Preview pane shows a warning
about the binary not being found, re-run step 1.

Full setup instructions and architecture details: **[editor/README.md](editor/README.md)**

---

## Repository Structure

```
editor/                     NEW — Quarkdown Live Editor (React + TypeScript)
quarkdown-core/             Compiler core — lexer, parser, AST, pipeline
quarkdown-stdlib/           Standard library (native Kotlin functions)
quarkdown-html/             HTML rendering engine and front-end assets
quarkdown-cli/              Command-line interface
quarkdown-server/           Ktor web server (live preview / PDF)
quarkdown-lsp/              Language Server Protocol implementation
quarkdown-plaintext/        Plain-text renderer
quarkdown-template/         Template rendering
quarkdown-libs/             Standard library .qd resource files
quarkdown-install-layout-navigator/   Runtime install layout navigator
quarkdown-interaction/      Interactive document components
scripts/                    Bootstrap scripts for the CLI distribution
```

---

## Contributing

- **Editor contributions** → [editor/CONTRIBUTING.md](editor/CONTRIBUTING.md)
- **Quarkdown compiler contributions** → upstream [CONTRIBUTING.md](https://github.com/iamgio/quarkdown/blob/main/CONTRIBUTING.md)

---

## License

All code in this repository is licensed under the
**GNU General Public License v3.0** — see [LICENSE](LICENSE) for the full text.

- Quarkdown compiler and related modules: Copyright (C) 2025 Giorgio Garofalo
- Quarkdown Live Editor (`editor/`): Copyright (C) 2025 Luiz Rodolfo (Thedocwhocode)

See [NOTICE](NOTICE) for a detailed breakdown of which files belong to upstream
and which were written for this fork.
