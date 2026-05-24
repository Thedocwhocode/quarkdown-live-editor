# Contributing to Quark Notes

This guide covers contributing to the **Quark Notes** desktop app (`quark/`).
For contributing to the upstream Quarkdown compiler, see the [root CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Prerequisites

| Tool | Version | Role |
|---|:---:|---|
| [Node.js](https://nodejs.org) | ≥ 20 | Frontend build and tests |
| [Rust](https://rustup.rs) | ≥ 1.80 | Tauri backend |
| [Java](https://adoptium.net) | 21 | Build the Quarkdown CLI |
| Tauri CLI | `^2` | `cargo install tauri-cli --version "^2"` |

---

## Development Setup

```bash
# 1. Build the Quarkdown CLI (one-time, from repo root)
./gradlew installDist

# 2. Install frontend dependencies
cd quark && npm install

# 3. Start the desktop app with hot-module reload
npm run tauri dev
```

The Vite dev server runs on port 5173; the Tauri window opens automatically.

---

## Project Structure

```
quark/
├── src-tauri/src/
│   ├── commands/        One file per domain (notes, notebooks, tags, attachments, export, compile)
│   ├── db/              Schema + migration runner
│   └── lib.rs           AppState, setup, command registration
└── src/
    ├── core/            Shared types (types.ts) and Tauri invoke wrappers (invoke.ts)
    ├── features/        Zustand stores — one directory per domain
    ├── components/      React components — one directory per UI area
    └── styles/          CSS custom properties, theme overrides, global reset
```

---

## Architecture Principles

**Local-first, no network.** All data lives in SQLite. The only network call is spawning the Quarkdown CLI as a subprocess — there is no API server.

**Typed IPC boundary.** Every Tauri command has a matching TypeScript wrapper in `src/core/invoke.ts` and a type in `src/core/types.ts`. Keep these in sync whenever you add a command.

**Zustand stores own domain state.** Components read from stores and dispatch actions — no local state for shared data. The store calls the invoke wrapper, updates the local array, and returns.

**CSS custom properties for theming.** All colors reference tokens defined in `tokens.css`. New themes override only the token layer in `themes.css` via `[data-theme="..."]` selectors — no component-level theme logic.

---

## Adding a Tauri Command

1. Write the handler function in the relevant `src-tauri/src/commands/*.rs` file using the existing patterns (State<'_, AppState>, rusqlite params!, camelCase serde).
2. Register it in `src-tauri/src/lib.rs` inside `tauri::generate_handler![...]`.
3. Add a typed wrapper to `src/core/invoke.ts`.
4. Update `src/core/types.ts` if a new data shape is introduced.
5. Write a unit test in `src/__tests__/store.test.ts` (mock `@tauri-apps/api/core` via the existing setup).

---

## Adding a New Theme

1. Add a `[data-theme="<id>"]` block to `src/styles/themes.css` overriding all CSS custom properties listed in `tokens.css`.
2. Add the new `id` to the `AppTheme` union in `src/core/types.ts`.
3. Add a `{ id, label }` entry to `THEMES` in `src/features/themes/store.ts`.
4. Add a swatch preview entry (`bg`, `accent`) to `THEME_SWATCHES` in `src/components/settings/SettingsModal.tsx`.

---

## Adding a Built-in Template

1. Add a `Template` object to `BUILT_IN_TEMPLATES` in `src/features/templates/catalog.ts`.
   - `id`: kebab-case, unique
   - `category`: one of `academic | presentation | diagram | data`
   - `sourceQdSeed`: valid Quarkdown source
2. Add the same seed to the Rust backend in `src-tauri/src/commands/templates.rs` so both sides are consistent.
3. Add a test case in `src/__tests__/catalog.test.ts`.

---

## Running Tests

```bash
cd quark

npm test              # Run all unit tests (Vitest, jsdom)
npm run type-check    # TypeScript strict check
```

Tests run without a Tauri runtime — `@tauri-apps/api/core` is mocked globally in `src/__tests__/setup.ts`. When adding a new store action, mock the corresponding `invoke` call using `mockResolvedValueOnce`.

---

## Code Style

- **TypeScript strict mode** — no `any`. Enable `noUnusedLocals` and `noUnusedParameters` (already in `tsconfig.json`).
- **CSS Modules** — one `.module.css` per component file. Reference only CSS custom properties from `tokens.css`; no hard-coded colors.
- **No inline styles** except for dynamic values (e.g., a color swatch driven by a variable).
- **Lucide React** (MIT) for all icons — no emoji, no inline SVG.
- **No comments** unless the WHY is non-obvious. Well-named identifiers are the documentation.

---

## Submitting a Pull Request

1. Branch from `claude/quark-notes` (or `main`).
2. Keep commits focused: one logical change per commit.
3. Before opening a PR, confirm that all checks pass locally:
   ```bash
   npm run type-check && npm test
   ```
4. The PR description should explain **what** changed and **why**, not just what files were touched.
5. By contributing to `quark/`, you agree your work is licensed under the **GNU General Public License v3.0**.
