# Contributing to Quarkdown Live Editor

Thank you for your interest in contributing to the Quarkdown Live Editor.
This guide covers contributions to the `editor/` subproject specifically.

For general Quarkdown project contributions (compiler, stdlib, HTML renderer),
see the root [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture Principles](#architecture-principles)
- [Adding a New Block or Function to the Registry](#adding-a-new-block-or-function-to-the-registry)
- [Running Tests](#running-tests)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [License Agreement](#license-agreement)

---

## Prerequisites

Before contributing, make sure you have the following installed:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 | Editor runtime and tests |
| Java | 21 | Building the Quarkdown CLI |
| Git | any | Version control |

Familiarity with **React**, **TypeScript**, and basic **Zustand** state management is
recommended. Knowledge of the Quarkdown language is helpful but not required for most
editor-side contributions.

---

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/Thedocwhocode/quarkdown-live-editor.git
cd quarkdown-live-editor
```

### 2. Build the Quarkdown CLI (one-time)

The editor compile server needs the Quarkdown binary to render previews.
Run this from the **repository root**:

```bash
./gradlew installDist
```

The binary is installed to `build/install/quarkdown/bin/quarkdown`.
You only need to rebuild if you change Kotlin source files.

### 3. Install editor dependencies

```bash
cd editor
npm install
```

### 4. Start the development server

```bash
npm run dev
```

This starts:
- **Vite frontend** → [http://localhost:5173](http://localhost:5173)
- **Express compile API** → [http://localhost:3001](http://localhost:3001)

Changes to React/TypeScript files hot-reload instantly via Vite HMR.
Changes to `server.ts` reload via `tsx watch`.

---

## Project Structure

Key directories and their responsibilities:

```
editor/
  server.ts                 Express proxy: POST /api/compile spawns Quarkdown CLI
  src/core/
    ir/                     Intermediate Representation types and factory helpers
    registry/               Function registry: types, catalog, lookup utilities
    serializer/             IR → .qd source serializer (pure, deterministic)
    parser/                 .qd → IR parser (best-effort, opaque-node fallback)
    compiler-adapter/       Fetch-based adapter from frontend to /api/compile
  src/features/
    document/store.ts       Zustand store: document IR, block CRUD, selection
    preview/orchestrator.ts Debounced compile scheduler, handles abort/cancel
    source-sync/sync.ts     Bidirectional sync guard (prevents feedback loops)
  src/components/           React UI components (see each subdirectory's file)
  __tests__/                Vitest unit tests
```

---

## Architecture Principles

Three invariants must hold throughout all contributions:

1. **Round-trip fidelity.** `serialize(parse(source))` must contain all content
   present in `source`. The parser may not always produce a perfect structural
   representation, but it must never silently drop text.

2. **Opaque-node safety.** Any `.qd` syntax the parser cannot recognize must be
   stored verbatim in an `opaque` block (see `buildOpaque` in `ir/builders.ts`).
   Opaque blocks are editable as raw source and serialized without transformation.

3. **Deterministic serialization.** Given the same IR tree, `serializeDocument`
   must always produce the same string output. This is what enables the sync guard
   to detect whether a source change originated from the UI or from the CodeMirror editor.

---

## Adding a New Block or Function to the Registry

The registry is the single source of truth that drives the Block Library panel,
the function call form, and the serializer templates. Adding a new Quarkdown
function requires changes in exactly two places.

### Step 1 — Add a `FunctionRegistryItem` to the catalog

Open `editor/src/core/registry/catalog.ts` and append a new entry to the
`CATALOG` array. Use an existing entry as a template. The key fields are:

```typescript
{
  id: 'my-function',              // unique kebab-case string
  canonicalName: 'myfunction',    // Quarkdown function name (lowercase)
  displayName: 'My Function',     // label shown in the UI
  category: 'layout',             // see FunctionCategory in types.ts
  intentTags: ['keyword', '…'],   // used by the search box
  description: 'What it does.',
  syntaxKind: 'block',            // 'block' | 'inline' | 'both'
  placement: 'block',             // 'block' | 'inline' | 'document-meta'
  params: [
    {
      name: 'myParam',
      displayName: 'My param',
      type: 'string',             // see ParamType in types.ts
      required: true,
      description: 'What this param controls.',
      likelyNamed: true,          // true → rendered as myParam:{value}
      likelyBody: false,
    },
  ],
  bodyMode: 'markdown',           // 'none' | 'markdown' | 'raw' | 'optional' | 'lambda'
  uiControl: 'form-panel',        // how the block is inserted/shown
  serializerTemplate: '.myfunction myparam:{{{myParam}}}\n    {{{body}}}',
  examples: [
    { source: '.myfunction myparam:{value}', description: 'Basic usage.' },
  ],
}
```

The `serializerTemplate` field uses `{{{paramName}}}` placeholders. If your
function has a body, include `{{{body}}}` in the template, indented with 4 spaces.
If a named arg should be omitted when empty, wrap it in a Mustache-style conditional:
`{{#myParam}} myparam:{{{myParam}}}{{/myParam}}` — the serializer handles this pattern.

### Step 2 — Add a serializer test

Open `editor/__tests__/serializer.test.ts` and add a test case for your function:

```typescript
it('serializes myfunction with named param', () => {
  const call = buildFunctionCall('myfunction', {
    namedArgs: [namedParam('myParam', 'hello')],
    body: 'Body content.',
  })
  expect(serializeFunctionCall(call)).toBe(
    '.myfunction myparam:{hello}\n    Body content.'
  )
})
```

Run `npm test` — if it passes, your entry is complete. The block automatically
appears in the Block Library panel (grouped by the category you specified) and
can be inserted from the toolbar or via the panel.

No changes to React components, stores, or routing are needed for standard
function blocks. The `FunctionCallBlock` component reads the registry entry to
render the params form generically.

---

## Running Tests

```bash
cd editor

# Run all tests once
npm test

# Watch mode
npm run test:watch

# TypeScript type check (no output = clean)
npx tsc --noEmit

# Production build (confirms bundle compiles)
npm run build
```

Test files and what they cover:

| File | Coverage |
|---|---|
| `__tests__/serializer.test.ts` | All block kinds, param values, named/positional args, body indentation, document metadata preamble |
| `__tests__/parser.test.ts` | Doctype/title/author extraction, headings, code fences, function calls, round-trip fidelity |
| `__tests__/registry.test.ts` | Catalog completeness, no duplicate IDs, lookup by name/ID, category filter, search |

---

## Code Style

- **TypeScript strict mode** — `strict: true` is set in `tsconfig.json`. No `any`,
  no implicit `any`, no unused variables.
- **CSS Modules** — every component has a sibling `ComponentName.module.css` file.
  No inline `style` props except for dynamic values computed at runtime (e.g. font
  size based on heading level).
- **No default exports in utility/core modules** — use named exports everywhere except
  React components, where default exports are acceptable but not required.
- **No comments explaining what code does** — use clear names instead. Comments are
  reserved for non-obvious invariants, workarounds, or architectural constraints.
- **Small, focused functions** — if a function exceeds ~30 lines, consider splitting it.

---

## Submitting a Pull Request

### Branch naming

```
feat/short-description       # new feature
fix/short-description        # bug fix
docs/short-description       # documentation only
refactor/short-description   # internal change with no functional effect
```

### Commit format

Follow the [Conventional Commits](https://www.conventionalcommits.org) format:

```
feat(registry): add .tablesort function entry
fix(serializer): preserve empty body blocks
docs(editor): update quickstart for Java 21
```

### PR checklist

Before opening a pull request, confirm:

- [ ] `npm test` passes (all tests green).
- [ ] `npx tsc --noEmit` produces no errors.
- [ ] `npm run build` succeeds.
- [ ] New functionality has at least one unit test.
- [ ] No `console.log` left in committed code.
- [ ] The PR description explains **what** changed and **why**.

---

## License Agreement

By submitting a contribution to the `editor/` directory, you agree that:

- You have authored 100% of the contributed content, or have the necessary rights
  to submit it.
- Your contribution may be distributed under the **GNU General Public License v3.0**,
  the same license that governs this project.
- You grant the project maintainers the right to include your contribution in
  future releases under the same license.

See [editor/LICENSE](./LICENSE) for the copyright notice and [LICENSE](../LICENSE)
for the full GPLv3 text.
