import { describe, it, expect } from 'vitest'
import {
  serializeDocument,
  serializeBlock,
  serializeFunctionCall,
  serializeParamValue,
} from '../src/core/serializer/serialize'
import {
  buildDocument,
  buildHeading,
  buildParagraph,
  buildCodeBlock,
  buildFunctionCallBlock,
  buildFunctionCall,
  buildOpaque,
  strVal,
  namedParam,
} from '../src/core/ir/builders'
import type { QdDocumentNode } from '../src/core/ir/types'

describe('serializeParamValue', () => {
  it('serializes string values', () => {
    expect(serializeParamValue({ kind: 'string', value: 'hello' })).toBe('hello')
  })
  it('serializes number values', () => {
    expect(serializeParamValue({ kind: 'number', value: 42 })).toBe('42')
  })
  it('serializes boolean values', () => {
    expect(serializeParamValue({ kind: 'boolean', value: true })).toBe('true')
    expect(serializeParamValue({ kind: 'boolean', value: false })).toBe('false')
  })
  it('serializes reference values', () => {
    expect(serializeParamValue({ kind: 'reference', value: '.myvar' })).toBe('.myvar')
  })
})

describe('serializeFunctionCall', () => {
  it('serializes a simple function with one positional arg', () => {
    const call = buildFunctionCall('docname', { positionalArgs: [strVal('My Doc')] })
    expect(serializeFunctionCall(call)).toBe('.docname {My Doc}')
  })

  it('serializes named arguments', () => {
    const call = buildFunctionCall('figure', {
      positionalArgs: [strVal('img.png')],
      namedArgs: [namedParam('caption', 'A diagram')],
    })
    expect(serializeFunctionCall(call)).toBe('.figure {img.png} caption:{A diagram}')
  })

  it('serializes body content with 4-space indent', () => {
    const call = buildFunctionCall('container', {
      namedArgs: [namedParam('width', '80%')],
      body: 'Hello world',
    })
    expect(serializeFunctionCall(call)).toBe('.container width:{80%}\n    Hello world')
  })

  it('ignores empty named args', () => {
    const call = buildFunctionCall('align', {
      positionalArgs: [strVal('center')],
      namedArgs: [namedParam('extra', '')],
    })
    expect(serializeFunctionCall(call)).toBe('.align {center}')
  })
})

describe('serializeBlock', () => {
  it('serializes paragraphs', () => {
    expect(serializeBlock(buildParagraph('Hello world'))).toBe('Hello world')
  })

  it('serializes headings with correct # count', () => {
    expect(serializeBlock(buildHeading(1, 'Title'))).toBe('# Title')
    expect(serializeBlock(buildHeading(3, 'Section'))).toBe('### Section')
  })

  it('serializes fenced code blocks', () => {
    const result = serializeBlock(buildCodeBlock('kotlin', 'fun main() {}'))
    expect(result).toBe('```kotlin\nfun main() {}\n```')
  })

  it('serializes opaque blocks verbatim', () => {
    const raw = '.someUnknownFunction {weird} args:here'
    expect(serializeBlock(buildOpaque(raw))).toBe(raw)
  })
})

describe('serializeDocument', () => {
  it('emits doctype at the top', () => {
    const doc = buildDocument({ docType: 'paged' })
    const result = serializeDocument(doc)
    expect(result.startsWith('.doctype {paged}')).toBe(true)
  })

  it('emits title after doctype', () => {
    const doc = buildDocument({ docType: 'plain', title: 'My Doc' })
    const result = serializeDocument(doc)
    expect(result).toContain('.docname {My Doc}')
  })

  it('emits multiple authors', () => {
    const doc = buildDocument({ docType: 'plain', authors: ['Alice', 'Bob'] })
    const result = serializeDocument(doc)
    expect(result).toContain('.docauthor {Alice}')
    expect(result).toContain('.docauthor {Bob}')
  })

  it('emits theme when set', () => {
    const doc = buildDocument({ docType: 'plain', theme: 'latex', colorTheme: 'darcula' })
    const result = serializeDocument(doc)
    expect(result).toContain('.theme layout:{latex} color:{darcula}')
  })

  it('separates blocks with double newlines', () => {
    const doc: QdDocumentNode = {
      ...buildDocument(),
      blocks: [buildHeading(1, 'Hello'), buildParagraph('World')],
    }
    const result = serializeDocument(doc)
    expect(result).toContain('# Hello\n\nWorld')
  })

  it('omits empty blocks from output', () => {
    const doc: QdDocumentNode = {
      ...buildDocument(),
      blocks: [buildParagraph(''), buildParagraph('Real content')],
    }
    const result = serializeDocument(doc)
    expect(result).toContain('Real content')
    // Empty paragraph should not produce double blank lines
    expect(result).not.toMatch(/\n{4,}/)
  })
})
