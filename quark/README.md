<div align="center">

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/%E2%AC%A1%20Quark-Notes-d4774a?style=for-the-badge&labelColor=272220&color=d4774a">
  <img src="https://img.shields.io/badge/%E2%AC%A1%20Quark-Notes-d4774a?style=for-the-badge&labelColor=f3efe9&color=d4774a" alt="Quark Notes" height="44">
</picture>

<br><br>

**A Bear-inspired local-first notes app powered by [Quarkdown](https://github.com/iamgio/quarkdown).**<br>
Write with ease. Structure without pain. Preview with beauty.

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/Thedocwhocode/quarkdown-live-editor/quark-ci.yml?branch=main&label=CI&logo=github&style=flat-square)](../../actions/workflows/quark-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.80+-ce422b?style=flat-square&logo=rust&logoColor=white)](https://rust-lang.org)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-003b57?style=flat-square&logo=sqlite&logoColor=white)](src-tauri/src/db/schema.sql)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](../LICENSE)

<br>

**🇺🇸 English** · [🇧🇷 Português](README-pt.md)

<br>

</div>

---

## What Is Quark?

Quark is a **local-first desktop notes app** that uses [Quarkdown](https://github.com/iamgio/quarkdown) as its native writing language. It sits between a quick-capture notes tool and a full editorial system — fluid enough for daily notes, powerful enough to produce academic papers, presentations, math exercises, or Mermaid diagrams without leaving the app.

Think **Bear**, but with Quarkdown's full feature set: KaTeX math, Mermaid diagrams, footnotes, cross-references, tables of contents, slides, themes, and structured layouts — all compiled to beautiful HTML and rendered live inside the app.

All data is stored locally. Nothing leaves your machine.

---

## Interface

```
┌──────────────┬─────────────────┬────────────────────────────────────────────────┐
│  Sidebar     │  Note List      │  Toolbar                                       │
│  ──────────  │  ─────────────  ├────────────────────────────────────────────────┤
│  ⬡ Quark    │  🔍 Search      │  [Edit] [Split] [Preview]  Template Export ⚡  │
│              │                 ├──────────────────────┬─────────────────────────┤
│  All Notes   │  ■ Note 1       │  NoteEditor          │  PreviewPane            │
│              │  ■ Note 2  #tag │  ─────────────────   │  ───────────────────    │
│  Notebooks   │  📌 Pinned note │  CodeMirror 6        │  <compiled HTML>        │
│  ──────────  │                 │  (Quarkdown)         │                         │
│  Work        │                 │  ──────────────────  │                         │
│  Study       │                 │  Attachment Panel    │                         │
│              │                 │  (photos · OCR)      │                         │
│  Tags        │                 │                      │                         │
│  ──────────  │                 │                      │                         │
│  #research   │                 │                      │                         │
│  #draft      │                 │                      │                         │
│  ⚙ Settings  │                 │                      │                         │
└──────────────┴─────────────────┴──────────────────────┴─────────────────────────┘
```

**Three view modes:** Edit only · Split (editor + preview side by side) · Preview only

---

## Features

<table>
<tr>
<td width="50%" valign="top">

**Writing**
- CodeMirror 6 editor with Quarkdown syntax
- Notion-style slash menu (`/`) — inserts blocks and functions
- Floating format toolbar (bold, italic, link, headings, quote)
- Auto-save with 600 ms debounce
- Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (code)

**Preview**
- One-click Quarkdown → HTML compilation
- Live iframe preview (no page reload)
- Split view: write and preview simultaneously
- Compilation errors and warnings shown inline

</td>
<td width="50%" valign="top">

**Organization**
- Notes, Notebooks, Tags (many-to-many)
- Pin important notes · Full-text search
- Archived notes (soft delete)
- Notebook icon + color picker

**Templates (6 built-in)**
- Scientific Article · Slides
- School Assignment · Math Work
- Mermaid Flowchart · Data Table
- Template picker modal with category grid

</td>
</tr>
<tr>
<td valign="top">

**Attachments & OCR**
- Attach images, PDFs, and files to any note
- Image thumbnails with hover-delete overlay
- Tesseract.js OCR on attached images
- OCR text indexed for future full-text search

</td>
<td valign="top">

**Export & Themes**
- Export to TXT, PDF (print), or JPG (screenshot)
- 5 Bear-inspired app themes:
  Warm Paper · Red Graphite · Toothpaste
  Solarized · Bear Dark
- Theme persisted across sessions

</td>
</tr>
</table>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  React 19 + Vite 6  (frontend)                                   │
│  Zustand stores ──► invoke() ──► Tauri IPC                       │
│                                                                  │
│  Features: notes · notebooks · tags · themes · templates         │
│  Components: editor · preview · toolbar · sidebar · modals       │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Tauri IPC
┌──────────────────────────────▼───────────────────────────────────┐
│  Rust / Tauri 2 backend                                          │
│  rusqlite (SQLite WAL + FK)  ·  std::process::Command            │
│  Commands: notes · notebooks · tags · attachments · export       │
└──────────────────────────────┬───────────────────────────────────┘
                               │  subprocess --pipe
┌──────────────────────────────▼───────────────────────────────────┐
│  Quarkdown CLI  (build/install/quarkdown/bin/quarkdown)           │
│  .qd source ──► HTML via stdout                                  │
└──────────────────────────────────────────────────────────────────┘
```

All data is stored locally in:

| Platform | Path |
|---|---|
| Linux | `~/.local/share/quark/quark.db` |
| macOS | `~/Library/Application Support/quark/quark.db` |
| Windows | `%APPDATA%\quark\quark.db` |

---

## Requirements

| Dependency | Version | Purpose |
|---|:---:|---|
| [Node.js](https://nodejs.org) | **≥ 20** | Frontend build and test runner |
| [Rust](https://rustup.rs) | **≥ 1.80** | Tauri backend |
| [Java](https://adoptium.net) | **21** | Build the Quarkdown CLI (one-time) |
| Gradle Wrapper | bundled | `./gradlew installDist` |

---

## Quickstart

### 1 — Build the Quarkdown CLI

From the **repository root** (one-time setup):

```bash
./gradlew installDist
```

This produces the CLI binary at `build/install/quarkdown/bin/quarkdown`, which the Rust backend detects automatically.

### 2 — Install frontend and Tauri dependencies

```bash
cd quark
npm install
cargo install tauri-cli --version "^2"
```

### 3 — Run in development

```bash
npm run tauri dev
```

Starts Vite on port 5173 and opens the Tauri desktop window with hot-module reload.

### 4 — Production build (desktop)

```bash
npm run tauri build
```

The installer is written to `src-tauri/target/release/bundle/`.

### 5 — Android build

> Requires [Android Studio](https://developer.android.com/studio), NDK, and SDK (API 24+).

```bash
# One-time project init (run from quark/)
npm run tauri android init

# Development (hot-reload over USB/emulator)
npm run tauri android dev

# Production APK / AAB
npm run tauri android build
```

The APK is written to `src-tauri/gen/android/app/build/outputs/apk/`.

On Android, compilation runs remotely via the configured Quark Cloud server URL
(Settings → Server). The local Quarkdown CLI is not available on mobile.

### 6 — iOS build

> Requires macOS, Xcode 15+, and an Apple Developer account (for device deployment).

```bash
# One-time project init (run from quark/ on macOS)
npm run tauri ios init

# Development (Simulator or device)
npm run tauri ios dev

# Production IPA
npm run tauri ios build
```

The IPA is written to `src-tauri/gen/apple/build/arm64/`.

---

## Project Structure

<details>
<summary><strong>quark/ — click to expand</strong></summary>

```
quark/
├── src-tauri/                       Rust / Tauri 2 backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── lib.rs                   AppState, setup, plugin registration
│       ├── main.rs                  Entry point
│       ├── commands/
│       │   ├── notes.rs             list_notes, get_note, create_note, update_note,
│       │   │                        delete_note, pin_note, search_notes
│       │   ├── notebooks.rs         list_notebooks, create_notebook,
│       │   │                        update_notebook, delete_notebook
│       │   ├── tags.rs              list_all_tags, get_note_tags,
│       │   │                        add_tag_to_note, remove_tag_from_note
│       │   ├── attachments.rs       list_attachments, add_attachment,
│       │   │                        delete_attachment, set_ocr_text
│       │   ├── compile.rs           compile_note (spawns Quarkdown CLI)
│       │   ├── export.rs            export_note_txt (strips markup → plain text)
│       │   ├── settings.rs          get_setting, set_setting (key-value store)
│       │   └── templates.rs         list_templates (6 built-in seeds)
│       └── db/
│           ├── mod.rs               init(), WAL + FK pragmas, migrations
│           └── schema.sql           notes, notebooks, tags, note_tags, attachments,
│                                    settings
└── src/                             React / TypeScript frontend
    ├── core/
    │   ├── types.ts                 Note, Notebook, Tag, Attachment, Template,
    │   │                            CompileResult, AppTheme, ViewMode
    │   └── invoke.ts                Typed wrappers: notesApi, notebooksApi,
    │                                tagsApi, attachmentsApi, compileApi,
    │                                templatesApi, exportApi, settingsApi
    ├── features/
    │   ├── notes/store.ts           Zustand: notes, selectedNoteId, viewMode
    │   ├── notebooks/store.ts       Zustand: notebooks, selectedNotebookId
    │   ├── tags/store.ts            Zustand: allTags, noteTags, selectedTagId
    │   ├── themes/store.ts          Zustand: theme, setTheme (localStorage persist)
    │   ├── compile/
    │   │   └── remoteCompile.ts     fetch-based compile for Android + iOS
    │   └── templates/catalog.ts    BUILT_IN_TEMPLATES (frontend copy)
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx         3-panel shell; modal state; mobile routing
    │   │   ├── Sidebar.tsx          Notebooks + Tags nav; Settings button
    │   │   ├── NoteList.tsx         Searchable note cards with status dots
    │   │   └── MobileBottomNav.tsx  Bottom tab bar (Android + iOS)
    │   ├── editor/
    │   │   └── NoteEditor.tsx       CodeMirror 6, auto-save, suppress-loop guard
    │   ├── preview/
    │   │   └── PreviewPane.tsx      iframe srcDoc, compile button, error display
    │   ├── toolbar/
    │   │   └── Toolbar.tsx          View toggle, Template/Export/Attach/Compile/Pin
    │   ├── tags/
    │   │   ├── TagChip.tsx          Pill tag with optional remove button
    │   │   └── NoteTagBar.tsx       Tag bar below editor with add-tag input
    │   ├── templates/
    │   │   └── TemplatePickerModal.tsx  Category grid, new-from-template
    │   ├── export/
    │   │   └── ExportModal.tsx      TXT · PDF · JPG export
    │   ├── attachments/
    │   │   └── AttachmentPanel.tsx  File grid, Tauri dialog, Tesseract.js OCR
    │   └── settings/
    │       └── SettingsModal.tsx    Theme picker + Notebook editor (icon, color)
    ├── utils/
    │   └── platform.ts              Detect 'android' | 'ios' | 'desktop' at runtime
    └── styles/
        ├── tokens.css               Bear-inspired warm palette, spacing, typography
        ├── themes.css               4 additional themes via [data-theme] attribute
        ├── mobile.css               Responsive layout (≤768 px), bottom nav, safe areas
        └── globals.css              Reset + base styles + mobile import
```

</details>

---

## Data Model

```
Notebook ──── Note ──── NoteTag ──── Tag
               │
               └────── Attachment (image · pdf · scan · file)
```

| Table | Purpose |
|---|---|
| `notes` | Source `.qd`, compiled HTML, status, pin flag, notebook FK |
| `notebooks` | Named collections with optional icon (emoji) and color |
| `tags` | Normalized tag names (unique, lowercase) |
| `note_tags` | Many-to-many join: note ↔ tag |
| `attachments` | File paths, MIME type, OCR text, kind discriminator |
| `settings` | Key-value store for user preferences (compile server URL, etc.) |

---

## Running Tests

```bash
cd quark
npm install
npm test
```

All tests run in jsdom via Vitest — no Tauri runtime required.

| Test file | What it covers |
|---|---|
| `types.test.ts` | Type structure invariants (status values, view modes) |
| `catalog.test.ts` | Template IDs, seeds, categories, math/mermaid content |
| `store.test.ts` | Notes store: load, create, delete, compile success/failure, selectedNote |

```bash
npm run type-check   # TypeScript strict check without emitting
```

---

## Roadmap

| Phase | Status | Description |
|---|:---:|---|
| 0 — Foundation | ✅ | Shell, SQLite schema, navigation, 3-panel layout |
| 1 — Writing & Preview | ✅ | Notes CRUD, CodeMirror editor, Quarkdown compile, iframe preview |
| 2 — Organization | ✅ | Tags, tag filter, 5 Bear-inspired themes, notebook color/icon |
| 3 — Templates | ✅ | Template picker modal, new-from-template (6 built-in) |
| 4 — Attachments & OCR | ✅ | File attach, image thumbnails, Tesseract.js OCR |
| 5 — Export | ✅ | TXT (Rust), PDF (print), JPG (html2canvas) |
| 6 — Structured Editor | ✅ | React block editor; Notion-like slash menu; bubble format toolbar |
| 7 — Mobile (Android + iOS) | ✅ | Tauri 2 mobile target; remote compile via Quark Cloud; responsive layout |
| 8 — Cloud Sync | 🔜 | Cross-device sync with conflict resolution |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines specific to the Quark Notes app.

For the upstream Quarkdown compiler, see the [root CONTRIBUTING.md](../CONTRIBUTING.md).

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
