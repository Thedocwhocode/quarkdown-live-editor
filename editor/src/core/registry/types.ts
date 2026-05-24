export type FunctionCategory =
  | 'document'
  | 'text'
  | 'layout'
  | 'media'
  | 'references'
  | 'tables'
  | 'diagrams'
  | 'math'
  | 'variables'
  | 'logic'
  | 'slides'
  | 'themes'
  | 'advanced'

export type SyntaxKind = 'block' | 'inline' | 'both'
export type Placement = 'block' | 'inline' | 'document-meta'
export type BodyMode = 'none' | 'markdown' | 'raw' | 'optional' | 'lambda'

export type UIControl =
  | 'toolbar-button'
  | 'slash-command'
  | 'wizard-modal'
  | 'form-panel'
  | 'inline-action'
  | 'document-setup'
  | 'raw-only'

export type ParamType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'size'
  | 'enum'
  | 'markdown'
  | 'lambda'

export interface FunctionParamSchema {
  name: string
  displayName: string
  type: ParamType
  required: boolean
  defaultValue?: unknown
  /** Allowed values when type === 'enum'. */
  enumValues?: string[]
  description: string
  /** Should this param typically be passed as `name:{value}`? */
  likelyNamed: boolean
  /** Is this param typically the indented body block? */
  likelyBody: boolean
}

export interface FunctionRegistryItem {
  /** Unique identifier used for cross-referencing inside the editor. */
  id: string
  /** Quarkdown function name as called in source (lowercase). */
  canonicalName: string
  /** Human-readable label shown in the UI. */
  displayName: string
  category: FunctionCategory
  /** Keywords for the command palette and intent search. */
  intentTags: string[]
  description: string
  syntaxKind: SyntaxKind
  placement: Placement
  params: FunctionParamSchema[]
  bodyMode: BodyMode
  uiControl: UIControl
  /**
   * Mustache-style template for serialization.
   * Variables: {{paramName}}, {{body}}, {{positional0}}, etc.
   */
  serializerTemplate: string
  examples: Array<{ source: string; description: string }>
  /** Icon name from Phosphor Icons. */
  icon?: string
}
