import type {
  QdBlockNode,
  QdBlockKind,
  QdDocumentMeta,
  QdDocumentNode,
  QdFunctionCallNode,
  QdNamedParam,
  QdParamValue,
} from './types'

function id(): string {
  return crypto.randomUUID()
}

export function buildBlock(
  kind: QdBlockKind,
  overrides: Partial<Omit<QdBlockNode, 'id' | 'kind'>> = {},
): QdBlockNode {
  return { id: id(), kind, ...overrides }
}

export function buildParagraph(content = ''): QdBlockNode {
  return buildBlock('paragraph', { content })
}

export function buildHeading(level: 1 | 2 | 3 | 4 | 5 | 6, content = ''): QdBlockNode {
  return buildBlock('heading', { level, content })
}

export function buildCodeBlock(language = '', content = ''): QdBlockNode {
  return buildBlock('code', { language, content })
}

export function buildBlank(): QdBlockNode {
  return buildBlock('blank')
}

export function buildOpaque(rawSource: string): QdBlockNode {
  return buildBlock('opaque', { rawSource })
}

export function buildFunctionCall(
  functionName: string,
  opts: {
    positionalArgs?: QdParamValue[]
    namedArgs?: QdNamedParam[]
    body?: string
    registryId?: string
  } = {},
): QdFunctionCallNode {
  return {
    id: id(),
    kind: 'functionCall',
    functionName,
    positionalArgs: opts.positionalArgs ?? [],
    namedArgs: opts.namedArgs ?? [],
    body: opts.body,
    registryId: opts.registryId,
  }
}

export function buildFunctionCallBlock(
  functionName: string,
  opts: Parameters<typeof buildFunctionCall>[1] = {},
): QdBlockNode {
  return buildBlock('functionCall', { call: buildFunctionCall(functionName, opts) })
}

export function buildDocument(
  meta: Partial<QdDocumentMeta> = {},
): QdDocumentNode {
  return {
    id: id(),
    meta: {
      docType: 'plain',
      ...meta,
    },
    blocks: [buildParagraph()],
    diagnostics: [],
  }
}

/** Convenience: string param value. */
export function strVal(value: string): QdParamValue {
  return { kind: 'string', value }
}

/** Convenience: named param. */
export function namedParam(name: string, value: string): QdNamedParam {
  return { name, value: strVal(value) }
}
