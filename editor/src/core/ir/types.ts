/** Source location for mapping IR nodes back to .qd text. */
export interface QdSourceRange {
  startLine: number
  endLine: number
  startCol: number
  endCol: number
}

/** Base mixin for every IR node. */
export interface QdNode {
  /** Stable UUID used as React key and for bidirectional sync. */
  id: string
  sourceRange?: QdSourceRange
}

// ---------------------------------------------------------------------------
// Parameter values
// ---------------------------------------------------------------------------

export type QdParamValue =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  /** Raw .qd inline/block markdown passed as body argument. */
  | { kind: 'markdown'; value: string }
  /** A reference to a variable or chained function call (.varname). */
  | { kind: 'reference'; value: string }

export interface QdNamedParam {
  name: string
  value: QdParamValue
}

// ---------------------------------------------------------------------------
// Function call node
// ---------------------------------------------------------------------------

/**
 * Represents a Quarkdown function call, e.g. `.figure src:{path} caption:{text}` or
 * `.container width:{100%}\n    body content`.
 */
export interface QdFunctionCallNode extends QdNode {
  kind: 'functionCall'
  functionName: string
  positionalArgs: QdParamValue[]
  namedArgs: QdNamedParam[]
  /** Raw indented body block (lazy-evaluated .qd). */
  body?: string
  /** Parsed body children when the body was structured. */
  children?: QdBlockNode[]
  /** Links this node to a FunctionRegistryItem for UI rendering. */
  registryId?: string
}

// ---------------------------------------------------------------------------
// Block nodes
// ---------------------------------------------------------------------------

export type QdBlockKind =
  | 'paragraph'
  | 'heading'
  | 'code'
  | 'functionCall'
  | 'opaque'
  | 'blank'
  | 'thematicBreak'

/**
 * A block-level document node (paragraph, heading, code fence, function call, etc.).
 * Uses a discriminated union via `kind` so type narrowing is straightforward.
 */
export interface QdBlockNode extends QdNode {
  kind: QdBlockKind
  /** Inline markdown content (paragraphs, headings). */
  content?: string
  /** Heading level 1-6. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Fenced code block language identifier. */
  language?: string
  /** Attached function call data when kind === 'functionCall'. */
  call?: QdFunctionCallNode
  /** Verbatim .qd source for opaque/unknown blocks — never discarded. */
  rawSource?: string
}

// ---------------------------------------------------------------------------
// Inline nodes
// ---------------------------------------------------------------------------

export type QdInlineKind = 'text' | 'bold' | 'italic' | 'code' | 'link' | 'functionCall'

export interface QdInlineNode extends QdNode {
  kind: QdInlineKind
  content?: string
  url?: string
  call?: QdFunctionCallNode
  children?: QdInlineNode[]
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export type QdDocType = 'plain' | 'paged' | 'slides' | 'docs'

export interface QdDocumentMeta {
  docType: QdDocType
  title?: string
  authors?: string[]
  description?: string
  language?: string
  /** Layout theme name (e.g. "beamer"). */
  theme?: string
  /** Color theme name. */
  colorTheme?: string
}

export interface QdDiagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  /** A user-facing version of the message without internal class names. */
  humanMessage: string
  blockId?: string
  sourceRange?: QdSourceRange
}

/** Root node representing a complete Quarkdown document. */
export interface QdDocumentNode {
  id: string
  meta: QdDocumentMeta
  blocks: QdBlockNode[]
  diagnostics: QdDiagnostic[]
}
