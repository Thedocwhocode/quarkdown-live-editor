# Quark Notes — Code Review & Product Analysis

> Review date: 2026-05-24  
> Stack: React 19 + TypeScript 5 + Vite 6 + Tauri 2 (Rust) + SQLite + Quarkdown CLI

---

## 1. Code Quality

### TypeScript / Frontend

**Strengths**
- Strict mode enforced across the entire project (`"strict": true` in tsconfig). No `any` usage detected in feature or core code.
- Clean separation of concerns: domain types live in `core/types.ts`, IPC wrappers are centralized in `core/invoke.ts`, and state is isolated per feature domain in `features/<domain>/store.ts`. This prevents the common anti-pattern of scattered `invoke()` calls throughout components.
- IR pipeline is well-defined: `QdBlockNode` types → `builders.ts` → `serialize.ts` → compile. Adding a new block type requires touching exactly the right files and nothing else.
- Registry pattern in `core/registry/catalog.ts` is a strong abstraction: 27 Quarkdown functions declared once, consumed by the slash menu, block library panel, and serializer automatically.
- Floating menus (`SlashCommandMenu`, `BubbleMenu`) correctly portal to `document.body`, use capture-phase keyboard events, and guard against stale closures with `useRef` mirrors — these are non-trivial patterns executed correctly.
- `remoteCompile.ts` cleanly separates the mobile compile path: no platform conditionals leak into unrelated components.

**Gaps**
- Test coverage is thin: `store.test.ts`, `catalog.test.ts`, and `types.test.ts` cover the happy path but there are no integration tests for the compile pipeline, no tests for the serializer or parser, and no E2E tests. The structured editor blocks have zero test coverage.
- `ParagraphBlock.tsx` uses raw `contentEditable` with `innerText` mutation. This works for simple paragraphs but is fragile: browser-specific whitespace normalization, clipboard paste with HTML content, and undo history are all unsolved. A future migration to a proper ProseMirror-style document model would be a significant but worthwhile investment.
- `NoteEditor.tsx` rebuilds the entire CodeMirror instance when `note.id` changes (correct) but the `EditorView.updateListener` closure references React state indirectly through refs — this is correct but the pattern is non-obvious and undocumented in the code.
- No error boundaries around `EditorSurface` or `PreviewPane`. A crash in block rendering will unmount the whole app.
- `scheduleCompile` in `structured-editor/orchestrator.ts` debounces on the document reference. If the document object is recreated on each render (common with Zustand spread patterns), the debounce timer resets on every keystroke.

**Rating: 7.5 / 10** — Solid architecture and discipline on the happy path; test coverage and contentEditable fragility are the main risks.

---

### Rust / Tauri Backend

**Strengths**
- All commands follow a consistent pattern: `State<'_, AppState>` injection, `Mutex::lock().map_err(|e| e.to_string())?`, rusqlite query, `Ok(result)`. Zero `unwrap()` calls in command handlers.
- `AppState` is a clean shared state container: `Mutex<Connection>` for DB access, `quarkdown_binary: String` for compile path detection.
- `db/schema.sql` uses `CREATE TABLE IF NOT EXISTS` throughout — schema migrations are safe to re-run on startup.
- `detect_binary()` in `compile.rs` checks for both the installed binary and the Gradle dev layout, making the development loop smoother without configuration.
- `#[cfg_attr(mobile, tauri::mobile_entry_point)]` is correctly placed for Tauri 2 mobile builds.

**Gaps**
- The `Mutex<Connection>` is a single connection shared across all commands. At low concurrency (one user) this is fine, but a connection pool (`r2d2` or `deadpool-sqlite`) would be necessary before serving multiple simultaneous users (e.g., in a future server/sync mode).
- `compile_note` spawns a JVM process per compile request. Cold-start latency (~1.5–2s) degrades the perceived live-preview responsiveness. A long-lived Quarkdown server process with a watch mode would eliminate this.
- No Rust unit tests in `src-tauri/`. The commands are testable in isolation but untested.
- Schema has no versioning/migration system. `ALTER TABLE IF NOT EXISTS` is not standard SQLite syntax — adding columns to an existing installation would require a migration framework or manual `ALTER TABLE` checks.

**Rating: 7 / 10** — Correct and safe; scalability and compile latency are the main limitations.

---

## 2. Usability

**What works well**
- The slash command menu (`/`) is a proven, low-friction interaction model (Notion, Linear, Coda). Having all 27 Quarkdown functions directly accessible without knowing their syntax dramatically lowers the learning curve for Quarkdown as a language.
- The bubble formatting menu matches universal word-processor conventions. Users who have never heard of Quarkdown can format text immediately.
- Offline-first SQLite storage means zero network dependency for core functionality. This is a significant advantage over cloud-only competitors.
- Mobile layout (MobileBottomNav, safe-area insets, ≥44px touch targets) is a first-class citizen, not an afterthought.
- The structured editor and raw CodeMirror editor coexist in the same note — power users can drop to source view without losing their work.

**What is missing for a production product**
- No drag-to-reorder blocks in the structured editor.
- No undo/redo history in the structured editor (`contentEditable` `execCommand` history is browser-managed and breaks when text is replaced programmatically).
- No image paste/drop support (paste an image → auto-creates an attachment + `.figure` block).
- No keyboard shortcut reference or command palette (`⌘K`).
- No onboarding: empty state shows only a placeholder text; a first-run wizard or sample document would reduce abandonment.
- No collaborative editing or sync between devices (addressed in SaaS section below).
- Search is limited to SQLite FTS on note titles and content; no semantic search.
- The compile pipeline's ~1.5s latency means the live preview feels sluggish compared to instant-preview Markdown editors.

**Usability rating: 7 / 10** — Strong foundation and differentiating UX; missing the polish of a shipping 1.0 product.

---

## 3. Commercial Potential

### Market Positioning

Quark Notes occupies a specific niche that no current product owns:

> **A structured document editor with native support for a Turing-complete typesetting language, targeting academic writers, technical authors, and developers who produce publication-quality output (PDF, slides, docs sites) from a single source.**

This is distinct from:
- **Notion / Craft / Coda** — collaborative databases with basic Markdown; no PDF typesetting, no math, no slides
- **Obsidian / Bear** — plain Markdown vaults; no compiler, no structured output modes, no `.foreach`
- **Typora / iA Writer** — Markdown editors; no functions, no IR, no structured blocks
- **Overleaf** — LaTeX editor; no visual block editor, no slides/HTML output, steep learning curve

The closest competitor is **Notion** for the UX pattern and **Overleaf** for the use case — Quark Notes is the intersection.

### Target Segments

| Segment | Pain point Quark solves | Willingness to pay |
|---|---|---|
| Graduate students / researchers | PDF output from structured notes; citations, math, page layout | Medium ($5–15/mo) |
| Technical writers / DevRel | Docs sites + PDFs from same `.qd` source; Mermaid diagrams, code blocks | High ($10–20/mo) |
| Educators | Slide decks from notes; handout PDF from same source | Medium ($8–12/mo) |
| Indie developers | Personal knowledge base with scriptable templates | Low–Medium ($3–8/mo) |

### Recommended Pricing Model

- **Free tier**: local-only, unlimited notes, no sync, desktop only
- **Pro ($8/mo or $72/yr)**: cloud sync, mobile apps, PDF export via cloud compile, themes
- **Team ($14/seat/mo)**: shared notebooks, version history, SSO

### Competitive Moat

- The Quarkdown IR + compiler is a unique dependency that competitors cannot trivially replicate. The registry + serializer + slash menu integration took significant engineering effort.
- GPLv3 license prevents commercial forks from closing the source, reducing race-to-the-bottom competition.
- Network effects are weak (no collaboration yet), but the learning curve of Quarkdown syntax creates user lock-in once they invest in templates and custom functions.

### Commercial potential rating: 8 / 10** — Strong differentiation in a real niche; addressable market is smaller than Notion's but more defensible.

---

## 4. SaaS Hosting Infrastructure

### Architecture for a Cloud Offering

```
User (browser / mobile app)
  ↓ HTTPS
CloudFront / Cloudflare CDN
  ↓
Application Load Balancer
  ├── Compile API (stateless JVM containers)
  ├── Notes Sync API (Node.js / Express)
  └── Static assets (S3 / R2)
         ↓
     PostgreSQL (PlanetScale / Supabase / RDS)
     S3 (attachments, compiled HTML cache)
```

### Service Breakdown

**Compile API**
- Stateless: receives `{ source: string, docType: string }`, returns `{ html: string }`
- Containerize the Quarkdown CLI + Express wrapper (`quarkdown-server` already exists in the monorepo)
- Horizontal scaling is straightforward — no shared state between instances
- Cold-start problem: JVM takes ~1.5s. Mitigations:
  - Keep containers warm (min 2 always-on)
  - GraalVM native image (reduces startup to ~200ms) — requires Kotlin/GraalVM configuration effort
  - Long-lived compile server with watch mode (best latency, most complex)

**Notes Sync API**
- New service: REST or GraphQL, handles note CRUD + conflict resolution for multi-device sync
- Postgres for user data (structured, relational notes/notebooks/tags)
- S3/R2 for binary attachments

**Auth**
- Clerk, Auth0, or Supabase Auth for managed OAuth (GitHub, Google) + email/password
- JWT tokens; no session state on API servers

### Cost Estimates

| Tier | Infrastructure | Monthly cost |
|---|---|---|
| Launch (≤500 active users) | 2× `t3.small` (compile) + 1× `t3.micro` (sync API) + Supabase free + R2 | ~$40–70/mo |
| Growth (≤5,000 active users) | 4× `t3.medium` (compile) + 2× `t3.small` (sync) + Supabase Pro + R2 | ~$200–350/mo |
| Scale (≤50,000 active users) | ECS autoscaling (5–15 tasks) + RDS `db.t3.medium` + ElastiCache + CloudFront | ~$1,200–2,000/mo |

At $8/mo Pro pricing, break-even on infrastructure is ~10–15 paying users. The business is infrastructure-efficient.

### Key Risks

- **JVM compile latency**: The biggest UX risk in a SaaS context where users expect sub-500ms preview updates. Native image or a persistent compile daemon is required before launch.
- **Quarkdown CLI versioning**: The SaaS compile API must pin a CLI version per user document to avoid output changes on upgrade.
- **Offline sync conflicts**: SQLite-local + Postgres-cloud requires a CRDT or last-write-wins merge strategy. This is the hardest engineering problem in the SaaS path.

---

## 5. Quarkdown Differentiation vs Generic Editors

This is the most important strategic question: **why would a user choose Quark over Notion, Obsidian, or Bear?**

### What generic editors cannot do

| Capability | Notion | Obsidian | Bear | Quark Notes |
|---|---|---|---|---|
| LaTeX-quality PDF output | ✗ | ✗ (plugin, low quality) | ✗ | ✓ (Paged.js) |
| Reveal.js slide decks from notes | ✗ | ✓ (plugin) | ✗ | ✓ (native) |
| Docs site from same source | ✗ | ✓ (Publish) | ✗ | ✓ (docs doctype) |
| Turing-complete scripting | ✗ | ✗ | ✗ | ✓ (.foreach, .if, .let) |
| Block-level math (KaTeX) | ✓ (limited) | ✓ | ✗ | ✓ |
| Mermaid diagrams | ✓ | ✓ | ✗ | ✓ |
| Custom function definitions | ✗ | ✗ | ✗ | ✓ (.function) |
| Four output modes, one source | ✗ | ✗ | ✗ | ✓ |
| Offline-first, local data | ✗ (cloud) | ✓ | ✓ | ✓ |

### The IR Advantage

Generic Markdown editors treat text as a string. Quark Notes treats a document as a typed IR tree:

```
QdDocumentNode
  ├── meta: { docType: 'paged', title: 'My Thesis' }
  └── blocks:
       ├── QdBlockNode { kind: 'heading', level: 1, content: 'Introduction' }
       ├── QdBlockNode { kind: 'paragraph', content: 'Lorem ipsum…' }
       └── QdBlockNode { kind: 'functionCall', call: { functionName: 'figure', … } }
```

This means:
- The editor understands the *semantic intent* of each block, not just its text representation
- Structured UI controls (form fields, dropdowns, wizards) are possible for complex function blocks
- The serializer can produce deterministic, valid `.qd` from any UI interaction
- Future features (AI suggestions, semantic search, style linting) can operate on the IR, not on raw text

### Practical Use Cases Where Quark Wins

1. **Academic paper**: Write in structured blocks, get a LaTeX-quality PDF with proper page margins, headers, footers, table of contents, and numbered figures — without touching LaTeX.
2. **Course slides + handout**: Same `.qd` source, `.doctype {slides}` for Reveal.js presentation, `.doctype {paged}` for student handout PDF.
3. **Technical documentation site**: `.doctype {docs}` generates a navigable website; `.doctype {paged}` generates a printable manual — same content.
4. **Scriptable reports**: Use `.foreach {data}` to generate sections from data arrays; use `.if` for conditional content based on document metadata.

None of these are possible in Notion, Obsidian, or Bear without external tooling and manual workflow stitching.

### Summary

Quark Notes is not a better Notion. It is a different tool for a different job: **publication-quality structured documents with scripting, served through a Notion-class UX.** The target user is not the casual note-taker but the serious writer who has been tolerating LaTeX or who has been frustrated that their Notion notes cannot produce a proper PDF.

---

## Overall Summary

| Dimension | Score | Key finding |
|---|---|---|
| Code quality | 7.5 / 10 | Solid architecture; test coverage and contentEditable fragility are risks |
| Usability | 7 / 10 | Strong UX foundation; missing drag-reorder, undo, image paste, onboarding |
| Commercial potential | 8 / 10 | Strong niche; defensible moat; addressable but smaller market than horizontal editors |
| SaaS infra readiness | 6 / 10 | Architecture is sound; JVM compile latency and offline sync are blockers |
| Quarkdown differentiation | 9 / 10 | Genuinely unique; no competitor offers this combination |

**Recommended next steps before a public launch:**
1. Solve compile latency (GraalVM native image or persistent compile daemon)
2. Add drag-to-reorder blocks and undo/redo to the structured editor
3. Increase test coverage to ≥70% on core IR, serializer, and store logic
4. Implement cloud sync (even basic last-write-wins) to unlock the SaaS value proposition
5. Add an onboarding flow with a sample Quarkdown document
