import type {
  QdBlockNode,
  QdDocumentNode,
  QdFunctionCallNode,
  QdNamedParam,
  QdParamValue,
} from '../ir/types'

// ---------------------------------------------------------------------------
// Param value serialization
// ---------------------------------------------------------------------------

/** Serializes a single parameter value to its .qd inline representation. */
export function serializeParamValue(val: QdParamValue): string {
  switch (val.kind) {
    case 'string':
      return val.value
    case 'number':
      return String(val.value)
    case 'boolean':
      return val.value ? 'true' : 'false'
    case 'markdown':
      return val.value
    case 'reference':
      return val.value
  }
}

function serializePositionalArg(val: QdParamValue): string {
  return `{${serializeParamValue(val)}}`
}

function serializeNamedArg(param: QdNamedParam): string {
  return `${param.name}:{${serializeParamValue(param.value)}}`
}

// ---------------------------------------------------------------------------
// Function call serialization
// ---------------------------------------------------------------------------

/**
 * Serializes a `QdFunctionCallNode` to Quarkdown syntax.
 *
 * Positional args are rendered as `{value}` before named args.
 * Body content is indented with 4 spaces on the following line.
 */
export function serializeFunctionCall(call: QdFunctionCallNode): string {
  const parts: string[] = [`.${call.functionName}`]

  for (const pos of call.positionalArgs) {
    parts.push(` ${serializePositionalArg(pos)}`)
  }

  for (const named of call.namedArgs) {
    if (serializeParamValue(named.value) !== '') {
      parts.push(` ${serializeNamedArg(named)}`)
    }
  }

  let result = parts.join('')

  if (call.body && call.body.trim()) {
    const indented = call.body
      .split('\n')
      .map((line) => (line.trim() ? `    ${line}` : ''))
      .join('\n')
    result += '\n' + indented
  }

  return result
}

// ---------------------------------------------------------------------------
// Block serialization
// ---------------------------------------------------------------------------

/**
 * Serializes a single block node to .qd source.
 * Opaque blocks emit their `rawSource` verbatim to avoid content loss.
 */
export function serializeBlock(block: QdBlockNode): string {
  switch (block.kind) {
    case 'blank':
      return ''

    case 'thematicBreak':
      return '---'

    case 'paragraph':
      return block.content ?? ''

    case 'heading': {
      const hashes = '#'.repeat(block.level ?? 1)
      return `${hashes} ${block.content ?? ''}`
    }

    case 'code': {
      const lang = block.language ?? ''
      return `\`\`\`${lang}\n${block.content ?? ''}\n\`\`\``
    }

    case 'functionCall':
      if (!block.call) return ''
      return serializeFunctionCall(block.call)

    case 'opaque':
      return block.rawSource ?? ''
  }
}

// ---------------------------------------------------------------------------
// Document serialization
// ---------------------------------------------------------------------------

/**
 * Serializes the document metadata preamble to .qd source lines.
 * Metadata functions always appear at the top of the document.
 */
function serializeMeta(doc: QdDocumentNode): string {
  const lines: string[] = []

  lines.push(`.doctype {${doc.meta.docType}}`)

  if (doc.meta.title) {
    lines.push(`.docname {${doc.meta.title}}`)
  }

  if (doc.meta.authors && doc.meta.authors.length > 0) {
    for (const author of doc.meta.authors) {
      lines.push(`.docauthor {${author}}`)
    }
  }

  if (doc.meta.description) {
    lines.push(`.docdescription {${doc.meta.description}}`)
  }

  if (doc.meta.language) {
    lines.push(`.doclanguage {${doc.meta.language}}`)
  }

  if (doc.meta.theme || doc.meta.colorTheme) {
    const layoutPart = doc.meta.theme ? ` layout:{${doc.meta.theme}}` : ''
    const colorPart = doc.meta.colorTheme ? ` color:{${doc.meta.colorTheme}}` : ''
    lines.push(`.theme${layoutPart}${colorPart}`)
  }

  return lines.join('\n')
}

/**
 * Serializes a full `QdDocumentNode` to a valid .qd source string.
 * The output is deterministic: same IR always produces the same source.
 */
export function serializeDocument(doc: QdDocumentNode): string {
  const sections: string[] = []

  const meta = serializeMeta(doc)
  if (meta) sections.push(meta)

  for (const block of doc.blocks) {
    const serialized = serializeBlock(block)
    if (serialized.trim() || block.kind === 'blank') {
      sections.push(serialized)
    }
  }

  return sections.join('\n\n')
}
