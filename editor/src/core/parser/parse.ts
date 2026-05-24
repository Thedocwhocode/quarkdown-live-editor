import { buildBlock, buildFunctionCall, buildOpaque, buildParagraph } from '../ir/builders'
import type { QdBlockNode, QdDocumentMeta, QdDocumentNode, QdParamValue } from '../ir/types'

/**
 * Parses a .qd source string into a `QdDocumentNode` using best-effort heuristics.
 *
 * Unknown constructs are preserved as `opaque` blocks to guarantee no content
 * is ever discarded. This is not a full parser — it handles common patterns
 * and defers to opaque nodes for everything else.
 */
export function parseDocument(source: string): QdDocumentNode {
  const lines = source.split('\n')
  const blocks: QdBlockNode[] = []
  const meta: QdDocumentMeta = { docType: 'plain' }

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines between blocks
    if (line.trim() === '') {
      i++
      continue
    }

    // Heading: # ... ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
      blocks.push(buildBlock('heading', { level, content: headingMatch[2] }))
      i++
      continue
    }

    // Fenced code block: ```lang
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // consume closing ```
      blocks.push(buildBlock('code', { language: lang, content: codeLines.join('\n') }))
      continue
    }

    // Thematic break
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(buildBlock('thematicBreak'))
      i++
      continue
    }

    // Quarkdown function call: .functionname ...
    if (line.startsWith('.')) {
      const result = parseFunctionCallBlock(lines, i, meta)
      if (result) {
        const { block, linesConsumed, metaUpdate } = result
        if (metaUpdate) Object.assign(meta, metaUpdate)
        if (block) blocks.push(block)
        i += linesConsumed
        continue
      }
    }

    // Collect paragraph: everything until blank line or special syntax
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('.')
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    if (paragraphLines.length > 0) {
      blocks.push(buildParagraph(paragraphLines.join('\n')))
    }
  }

  return {
    id: crypto.randomUUID(),
    meta,
    blocks: blocks.length > 0 ? blocks : [buildParagraph()],
    diagnostics: [],
  }
}

interface ParseFunctionResult {
  block: QdBlockNode | null
  linesConsumed: number
  metaUpdate?: Partial<QdDocumentMeta>
}

/** Parses a .function-call block, collecting indented body lines. */
function parseFunctionCallBlock(
  lines: string[],
  startIndex: number,
  _currentMeta: QdDocumentMeta,
): ParseFunctionResult | null {
  const line = lines[startIndex]
  if (!line.startsWith('.')) return null

  // Match: .functionname {pos1} {pos2} named:{val} ...
  const headerMatch = line.match(/^\.([a-zA-Z][a-zA-Z0-9_-]*)(.*)$/)
  if (!headerMatch) return null

  const functionName = headerMatch[1].toLowerCase()
  const argsString = headerMatch[2].trim()

  // Collect indented body (4-space or tab indented)
  const bodyLines: string[] = []
  let j = startIndex + 1
  while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t'))) {
    bodyLines.push(lines[j].replace(/^    |\t/, ''))
    j++
  }
  const body = bodyLines.join('\n')
  const linesConsumed = j - startIndex

  // Known metadata functions: extract value and update meta
  const metaHandlers: Record<string, (val: string) => Partial<QdDocumentMeta>> = {
    doctype: (val) => ({ docType: val as QdDocumentMeta['docType'] }),
    docname: (val) => ({ title: val }),
    docauthor: (val) => ({ authors: [val] }),
    docdescription: (val) => ({ description: val }),
    doclanguage: (val) => ({ language: val }),
  }

  const posArgs = parsePositionalArgs(argsString)
  const firstPosVal = posArgs[0] ? serializeParamValueSimple(posArgs[0]) : ''

  if (functionName in metaHandlers) {
    const metaUpdate = metaHandlers[functionName](firstPosVal)
    return { block: null, linesConsumed, metaUpdate }
  }

  if (functionName === 'theme') {
    const namedArgs = parseNamedArgs(argsString)
    const layout = namedArgs.find((n) => n.name === 'layout')?.value
    const color = namedArgs.find((n) => n.name === 'color')?.value
    return {
      block: null,
      linesConsumed,
      metaUpdate: {
        ...(layout ? { theme: serializeParamValueSimple(layout) } : {}),
        ...(color ? { colorTheme: serializeParamValueSimple(color) } : {}),
      },
    }
  }

  // Generic function call block
  const call = buildFunctionCall(functionName, {
    positionalArgs: posArgs,
    namedArgs: parseNamedArgs(argsString),
    body: body || undefined,
  })

  return {
    block: buildBlock('functionCall', { call }),
    linesConsumed,
  }
}

/** Extracts positional {value} arguments from an args string. */
function parsePositionalArgs(argsString: string): QdParamValue[] {
  const results: QdParamValue[] = []
  const pattern = /\{([^{}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(argsString)) !== null) {
    // Skip if preceded by a word (named arg pattern: name:{value})
    const before = argsString.slice(0, match.index)
    if (/\w:$/.test(before)) continue
    results.push({ kind: 'string', value: match[1] })
  }

  return results
}

/** Extracts named name:{value} arguments from an args string. */
function parseNamedArgs(argsString: string): Array<{ name: string; value: QdParamValue }> {
  const results: Array<{ name: string; value: QdParamValue }> = []
  const pattern = /(\w+):\{([^{}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(argsString)) !== null) {
    results.push({ name: match[1], value: { kind: 'string', value: match[2] } })
  }

  return results
}

function serializeParamValueSimple(val: QdParamValue): string {
  if (val.kind === 'string' || val.kind === 'reference') return val.value
  if (val.kind === 'number') return String(val.value)
  if (val.kind === 'boolean') return val.value ? 'true' : 'false'
  return val.value
}

/** Builds an opaque block from raw source lines. */
export function buildOpaqueFromLines(lines: string[]): QdBlockNode {
  return buildOpaque(lines.join('\n'))
}
