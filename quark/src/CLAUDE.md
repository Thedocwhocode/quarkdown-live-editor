# Quark Notes — React / TypeScript Frontend

All UI, feature stores, domain logic, and utilities live here.

## Directory Map

```
src/
  core/
    types.ts          — shared domain types (Note, Notebook, Tag, CompileResult…)
    invoke.ts         — all Tauri IPC wrappers (notesApi, compileApi, settingsApi…)
    ir/               — QdBlockNode IR types + builder helpers
    registry/         — Quarkdown function catalog (27 entries)
    serializer/       — IR → .qd string
    parser/           — best-effort .qd → IR (opaque fallback for unknown syntax)
  features/
    notes/store.ts           — active note, CRUD, compileNote (desktop vs mobile)
    compile/remoteCompile.ts — HTTP compile endpoint for Android/iOS
    structured-editor/
      store.ts               — useDocumentStore: IR blocks, updateBlock, insertBlockAfter
      orchestrator.ts        — scheduleCompile: debounce + cancel
    notebooks/store.ts
    tags/store.ts
    themes/store.ts
    templates/store.ts
  components/
    editor/
      NoteEditor.tsx          — CodeMirror 6 editor with slash + bubble menu wired up
      SlashCommandMenu.tsx    — portaled slash palette (Quick Blocks + CATALOG + emoji)
      BubbleMenu.tsx          — portaled inline format toolbar
    structured-editor/
      EditorSurface.tsx       — block list container
      blocks/                 — ParagraphBlock, HeadingBlock, CodeBlock, FunctionCallBlock…
    layout/
      AppShell.tsx            — top-level layout, mobile panel switching
      MobileBottomNav.tsx     — bottom tab bar (hidden on desktop)
    settings/SettingsModal.tsx
  utils/
    platform.ts       — getPlatform(): 'android' | 'ios' | 'desktop'
    menuPosition.ts   — computeMenuPosition(), getCursorRect()
  styles/
    tokens.css        — all CSS custom properties
    globals.css       — resets + base styles
    mobile.css        — @media (max-width: 768px) overrides
```

## State Management

Zustand, one store per feature domain. Key stores:

| Store | Key state | Key actions |
|---|---|---|
| `useNotesStore` | `notes`, `selectedNoteId`, `isCompiling` | `loadNotes`, `createNote`, `updateNote`, `compileNote` |
| `useDocumentStore` | `document` (IR), `blocks` | `updateBlock`, `insertBlockAfter`, `deleteBlock` |
| `useNotebooksStore` | `notebooks` | `loadNotebooks`, `createNotebook` |

Never store derived data — compute it from store state in selectors.

## Tauri IPC Rules

All Tauri calls go through `src/core/invoke.ts`. Never call `invoke()` directly from a component or store.

```typescript
// ✓ correct
import { notesApi } from '../../core/invoke'
const notes = await notesApi.list()

// ✗ wrong
import { invoke } from '@tauri-apps/api/core'
const notes = await invoke('list_notes')
```

## Platform-Aware Compile

`features/notes/store.ts` → `compileNote`:
```typescript
const platform = await getPlatform()
if (isMobilePlatform(platform)) {
  result = await remoteCompile(note.sourceQd)   // HTTP POST to cloud API
} else {
  result = await compileApi.compile(note.id)     // Rust subprocess
}
```

The cloud API URL is persisted in SQLite via `settingsApi.get('compile_server_url')`. Default: `https://cloud.quarkdown.com`.

## Structured Editor IR Flow

```
User types in ParagraphBlock (contentEditable)
  → updateBlock(id, { content: text })
  → scheduleCompile(qdDoc)        ← debounced 300ms
  → serialize(IR) → POST /api/compile
  → compiledHtml → PreviewPane iframe
```

## Floating Menu Patterns

Both `SlashCommandMenu` and `BubbleMenu` are portaled overlays:

```typescript
return ReactDOM.createPortal(
  <div className={css.menu} style={computeMenuPosition(anchorRect, 280, 380)}>
    ...
  </div>,
  document.body
)
```

Keyboard capture for overlays (must intercept before editor receives key):
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => { /* arrow/enter/escape */ }
  window.addEventListener('keydown', handler, { capture: true })
  return () => window.removeEventListener('keydown', handler, { capture: true })
}, [deps])
```

Stale-closure guard (when state is read inside a stable effect):
```typescript
const slashStateRef = useRef(slashState)
slashStateRef.current = slashState   // sync on every render
// effect uses slashStateRef.current instead of slashState
```

## Component Conventions

- One `ComponentName.module.css` per component; no inline styles except dynamic values
- Icons: `lucide-react` only — `import { Bold, Italic } from 'lucide-react'`
- Touch targets ≥ 44px height on mobile
- `data-active`, `data-empty`, `data-error` attributes on containers for CSS state hooks (no JS className toggling)
- `window.document.*` for DOM APIs inside `ParagraphBlock` and similar components that alias the store's `document` property to `qdDoc`

## CSS Tokens

All colors, radii, fonts defined in `styles/tokens.css`. Always use `var(--c-*)`, `var(--r-*)`, `var(--font-*)` — never hardcode hex values.

Key tokens:
- `--c-editor-bg`, `--c-sidebar-bg`, `--c-list-bg` — surface colors
- `--c-accent` — brand accent
- `--c-text-primary`, `--c-text-muted` — text hierarchy
- `--r-sm`, `--r-md`, `--r-lg` — border radii

## Testing

```bash
npm run test           # run all Vitest tests once
npm run test:watch     # watch mode
npm run type-check     # TypeScript strict check
```

Tests live in `src/__tests__/`. Current coverage:
- `store.test.ts` — `useNotesStore` actions (mocks `invoke`)
- `catalog.test.ts` — registry catalog shape validation
- `types.test.ts` — IR builder helpers

When adding a feature, add a corresponding test in `src/__tests__/`.
