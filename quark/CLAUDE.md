# Quark Notes — Developer Guide

Quark Notes is a Quarkdown-native note editor built with React 19 + TypeScript + Vite 6 on top of Tauri 2 (Rust). It compiles `.qd` (Quarkdown) source to HTML locally via the Quarkdown CLI, or remotely on mobile via a configurable HTTP endpoint.

## Architecture

```
Frontend (React / TypeScript)
  ↕ Tauri IPC (invoke)
Rust commands (Tauri)
  ├── SQLite (rusqlite) — notes, notebooks, tags, attachments, settings
  └── Quarkdown CLI (subprocess) — compile .qd → HTML
```

On Android / iOS the CLI subprocess is unavailable; `remoteCompile()` posts to a cloud API instead.

## Build & Run

```bash
cd quark

npm install                # install JS dependencies
npm run dev                # Vite dev server only (no Tauri shell)
npm run tauri dev          # full desktop app with hot-reload
npm run test               # Vitest unit tests
npm run type-check         # tsc --noEmit (zero-error required)
npm run build              # production JS bundle
npm run tauri build        # production Tauri binary (needs Rust toolchain)
```

> `npm run tauri build` requires platform signing setup (macOS keychain / Windows cert). Never run it in CI without credentials.

## Key Modules

| Path | Purpose |
|---|---|
| `src/core/types.ts` | Shared TS types: `Note`, `Notebook`, `Tag`, `CompileResult`, … |
| `src/core/invoke.ts` | All Tauri IPC wrappers (`notesApi`, `compileApi`, `settingsApi`, …) |
| `src/core/ir/` | `QdBlockNode` IR types + builder helpers (`buildHeading`, `buildCodeBlock`, …) |
| `src/core/registry/catalog.ts` | 27-entry Quarkdown function registry; feeds slash command menu |
| `src/core/serializer/serialize.ts` | IR → `.qd` string (deterministic, round-trip safe) |
| `src/features/notes/store.ts` | `useNotesStore`: CRUD + `compileNote` (desktop vs mobile path) |
| `src/features/structured-editor/store.ts` | `useDocumentStore`: IR blocks, `updateBlock`, `insertBlockAfter` |
| `src/features/structured-editor/orchestrator.ts` | `scheduleCompile`: debounce + cancel compile on IR change |
| `src/features/compile/remoteCompile.ts` | HTTP compile for mobile; reads server URL from settings |
| `src/components/editor/` | `NoteEditor` (CodeMirror 6), `SlashCommandMenu`, `BubbleMenu` |
| `src/components/structured-editor/` | `EditorSurface`, block renderers (`ParagraphBlock`, `HeadingBlock`, …) |
| `src/components/layout/` | `AppShell`, `Sidebar`, `MobileBottomNav` |
| `src/utils/platform.ts` | `getPlatform()` → `'android' \| 'ios' \| 'desktop'` |
| `src/utils/menuPosition.ts` | `computeMenuPosition()` for portaled overlays |
| `src/styles/tokens.css` | All CSS custom properties (`--c-*`, `--r-*`, `--font-*`) |
| `src-tauri/src/commands/` | Rust Tauri commands (see `src-tauri/CLAUDE.md`) |
| `src-tauri/src/db/schema.sql` | SQLite schema |

## Common Tasks

### Add a Tauri command
1. Add `pub fn my_command(state: State<'_, AppState>, ...) -> Result<T, String>` in `src-tauri/src/commands/<module>.rs`
2. Register in `src-tauri/src/lib.rs` `tauri::generate_handler![..., commands::module::my_command]`
3. Add typed wrapper in `src/core/invoke.ts`

### Add a block type to the structured editor
1. Extend `QdBlockNode.kind` union in `src/core/ir/types.ts`
2. Add builder in `src/core/ir/builders.ts`
3. Add renderer component in `src/components/structured-editor/blocks/`
4. Add serializer case in `src/core/serializer/serialize.ts`
5. Add slash menu item in `src/components/editor/SlashCommandMenu.tsx`

### Add a Quarkdown function to the registry
Add a `FunctionRegistryItem` entry to `src/core/registry/catalog.ts`. It auto-appears in the slash command menu under the correct category — no other wiring needed.

### Add a new app setting
1. Read/write via `settingsApi.get(key)` / `settingsApi.set(key, value)` (persisted in SQLite `settings` table)
2. Expose in `src/components/settings/SettingsModal.tsx`

## Conventions

- **No `any`** — TypeScript strict mode, zero escape hatches
- **CSS Modules only** — one `ComponentName.module.css` per component; no inline styles except dynamic values; tokens from `tokens.css`
- **Icons** — `lucide-react` exclusively
- **Tauri IPC** — always through `src/core/invoke.ts`; never call `invoke()` directly from a component
- **Zustand** — one store file per feature domain in `src/features/<domain>/store.ts`
- **Portaled overlays** — `ReactDOM.createPortal(el, document.body)` with `position: fixed`; use `computeMenuPosition()` for positioning
- **DOM API inside components** — if a component destructures `document` from a store, use `window.document.*` for DOM calls to avoid shadowing (e.g., `ParagraphBlock` uses `qdDoc` alias)
- **Keyboard capture** — overlays that must intercept editor key events use `window.addEventListener('keydown', fn, { capture: true })`

## Do Not

- Run `npm run tauri build` without a signed Rust toolchain and platform credentials
- Import anything from `src-tauri/` into frontend code
- Commit secrets or API tokens; store only config keys in SQLite
- Add a new icon library (Lucide covers all needs)
- Use `document.*` DOM APIs directly in components that also destructure a store property named `document` — alias it first
