<div align="center">

<br>

<img src="https://img.shields.io/badge/Quark-Notes-6c47ff?style=for-the-badge&labelColor=1a1a2e" alt="Quark Notes" height="42">

<br><br>

**A Bear-inspired notes app powered by [Quarkdown](https://github.com/iamgio/quarkdown).**  
Write with ease. Structure without pain. Preview with beauty.

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/Thedocwhocode/quarkdown-live-editor/quark-ci.yml?branch=main&label=CI&logo=github&style=flat-square)](../../actions/workflows/quark-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.80-ce422b?style=flat-square&logo=rust&logoColor=white)](https://rust-lang.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](../LICENSE)

<br><br>

</div>

---

## What Is Quark?

Quark is a **local-first desktop notes app** that uses [Quarkdown](https://github.com/iamgio/quarkdown) as its native writing language. It sits between a quick-capture notes tool and a full editorial system — fluid enough for daily notes, powerful enough to turn them into academic papers, slides, math exercises, or Mermaid diagrams with a single click.

Think Bear, but with Quarkdown's full feature set: math (KaTeX), Mermaid diagrams, footnotes, cross-references, tables of contents, slides, themes, and structured layouts — all compiled to beautiful HTML and rendered inside the app.

---

## Interface

```
┌──────────────┬─────────────────┬──────────────────────────────────────────┐
│  Sidebar     │  Note List      │  Toolbar                                 │
│  ──────────  │  ─────────────  ├──────────────────────────────────────────┤
│  ⬡ Quark    │  🔍 Search      │  [✏ Edit]  [⊟ Split]  [👁 Preview]  ⚡  │
│              │                 ├──────────────────┬───────────────────────┤
│  📝 All      │  ■ Note 1       │  NoteEditor      │  PreviewPane          │
│              │  ■ Note 2       │  ─────────────   │  ──────────────────   │
│  Notebooks   │  📌 Pinned note │  CodeMirror      │  <compiled HTML>      │
│  ──────────  │                 │  (Quarkdown)     │                       │
│  📁 Work     │                 │                  │                       │
│  📁 Study    │                 │                  │                       │
│              │                 │                  │                       │
│  ⚙           │                 │                  │                       │
└──────────────┴─────────────────┴──────────────────┴───────────────────────┘
```

**Three view modes:** Edit only · Split (editor + preview side by side) · Preview only

---

## Features

<table>
<tr>
<td width="50%">

**Writing**
- CodeMirror 6 editor with Markdown support
- Quarkdown syntax: `.functions`, named args, body blocks
- Auto-save with 600 ms debounce
- Keyboard-friendly (Bear-like shortcuts)

</td>
<td width="50%">

**Preview**
- One-click Quarkdown → HTML compilation
- Live iframe preview (no page reload)
- Compilation errors shown inline with retry
- Split view: write and preview simultaneously

</td>
</tr>
<tr>
<td>

**Organization**
- Notes, Notebooks, Tags
- Pin important notes
- Full-text search across titles and source
- Archived notes (soft delete)

</td>
<td>

**Templates (6 built-in)**
- Scientific Article · Slides
- School Assignment · Math Work
- Mermaid Flowchart · Data Table

</td>
</tr>
</table>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  React 19 + Vite  (frontend)                                 │
│  Zustand stores → invoke() → Tauri commands                  │
└──────────────────────────┬───────────────────────────────────┘
                           │  Tauri IPC
┌──────────────────────────▼───────────────────────────────────┐
│  Rust/Tauri backend                                          │
│  rusqlite (SQLite WAL)  ·  std::process::Command             │
└──────────────────────────┬───────────────────────────────────┘
                           │  subprocess --pipe
┌──────────────────────────▼───────────────────────────────────┐
│  Quarkdown CLI  (build/install/quarkdown/bin/quarkdown)       │
│  .qd source → HTML · stdout                                  │
└──────────────────────────────────────────────────────────────┘
```

All data is stored locally in `~/.local/share/quark/quark.db` (Linux),
`~/Library/Application Support/quark/quark.db` (macOS), or the Windows AppData equivalent.

---

## Requirements

| Dependency | Version | Purpose |
|---|:---:|---|
| [Node.js](https://nodejs.org) | **≥ 20** | Frontend build |
| [Rust](https://rustup.rs) | **≥ 1.80** | Tauri backend |
| [Java](https://adoptium.net) | **21** | Quarkdown CLI |
| Gradle Wrapper | bundled | Build Quarkdown CLI — one time |

---

## Quickstart

### 1 — Build the Quarkdown CLI

From the **repository root**:

```bash
./gradlew installDist
```

### 2 — Install Tauri CLI and frontend deps

```bash
cd quark
npm install
cargo install tauri-cli --version "^2"
```

### 3 — Run in development

```bash
npm run tauri dev
```

This starts Vite on port 5173 and opens the Tauri desktop window.

### 4 — Production build

```bash
npm run tauri build
```

The installer is written to `src-tauri/target/release/bundle/`.

---

## Project Structure

<details>
<summary><strong>quark/ — click to expand</strong></summary>

```
quark/
├── src-tauri/                     Rust/Tauri backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── lib.rs                 AppState, Tauri setup, plugin registration
│       ├── commands/
│       │   ├── notes.rs           list_notes, get_note, create_note, update_note, delete_note, pin_note, search_notes
│       │   ├── notebooks.rs       list_notebooks, create_notebook, delete_notebook
│       │   ├── compile.rs         compile_note (spawns Quarkdown CLI), detect_binary()
│       │   └── templates.rs       list_templates (6 built-in seeds)
│       └── db/
│           ├── mod.rs             init(), WAL + FK pragmas, run migrations
│           └── schema.sql         notes, notebooks, tags, note_tags, attachments
└── src/                           React/TypeScript frontend
    ├── core/
    │   ├── types.ts               Note, Notebook, Template, CompileResult, ViewMode
    │   └── invoke.ts              Typed wrappers: notesApi, notebooksApi, compileApi
    ├── features/
    │   ├── notes/store.ts         Zustand: notes[], selectedNoteId, viewMode, isCompiling
    │   ├── notebooks/store.ts     Zustand: notebooks[], selectedNotebookId
    │   └── templates/catalog.ts  BUILT_IN_TEMPLATES constant (frontend copy)
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx       3-panel shell (sidebar + list + main)
    │   │   ├── Sidebar.tsx        Notebooks nav, new-note button
    │   │   ├── NoteList.tsx       Searchable note cards with status dots
    │   ├── editor/
    │   │   └── NoteEditor.tsx     CodeMirror 6, auto-save, suppress loop guard
    │   ├── preview/
    │   │   └── PreviewPane.tsx    iframe srcDoc, compile button, error display
    │   └── toolbar/
    │       └── Toolbar.tsx        View toggle, compile, pin, delete
    └── styles/
        ├── tokens.css             Bear-inspired warm palette, spacing, typography
        └── globals.css            Reset + base styles
```

</details>

---

## Data Model

```
Notebook ──── Note ──── NoteTag ──── Tag
                │
                └────── Attachment
```

| Table | Purpose |
|---|---|
| `notes` | Source, compiled HTML, status, pin, notebook |
| `notebooks` | Named collections with optional icon and color |
| `tags` / `note_tags` | Many-to-many tagging |
| `attachments` | Images, PDFs, scans (OCR text — Phase 4) |

---

## Running Tests

```bash
cd quark
npm install
npm test
```

| File | Coverage |
|---|---|
| `types.test.ts` | Type structure invariants |
| `catalog.test.ts` | Template IDs, seeds, categories |
| `store.test.ts` | Notes store: load, create, delete, compile success/failure, selectedNote |

---

## Roadmap

| Phase | Status | Description |
|---|:---:|---|
| 0 — Foundation | ✅ | Shell, SQLite schema, navigation, 3-panel layout |
| 1 — Writing & Preview | ✅ | Notes CRUD, CodeMirror editor, Quarkdown compile, iframe preview |
| 2 — Organization | 🔜 | Tags, tag filter, themes, notebook color/icon |
| 3 — Templates | 🔜 | Template picker modal, new-from-template, custom templates |
| 4 — Attachments & OCR | 🔜 | File attach, image import, Tesseract OCR, search OCR text |
| 5 — Export Engine | 🔜 | TXT, PDF (from HTML), JPG (snapshot), DOCX |
| 6 — Structured Editor | 🔜 | Integrate the React block editor from `editor/` |

---

## Contributing

See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

<div align="center">

Licensed under the **GNU General Public License v3.0**.

| | |
|---|---|
| Quark Notes app | Copyright © 2025 Luiz Rodolfo (Thedocwhocode) |
| Upstream Quarkdown compiler | Copyright © 2025 Giorgio Garofalo |

[Full license text](../LICENSE) · [Code provenance](../NOTICE)

</div>
