import { describe, it, expect } from 'vitest'
import { parseDocument } from '../src/core/parser/parse'
import { serializeDocument } from '../src/core/serializer/serialize'

describe('parseDocument', () => {
  it('parses doctype from meta function', () => {
    const doc = parseDocument('.doctype {paged}')
    expect(doc.meta.docType).toBe('paged')
  })

  it('parses title and author', () => {
    const source = '.docname {My Paper}\n.docauthor {Jane Doe}'
    const doc = parseDocument(source)
    expect(doc.meta.title).toBe('My Paper')
    expect(doc.meta.authors).toContain('Jane Doe')
  })

  it('parses headings', () => {
    const doc = parseDocument('# Hello\n## World')
    const headings = doc.blocks.filter((b) => b.kind === 'heading')
    expect(headings).toHaveLength(2)
    expect(headings[0].level).toBe(1)
    expect(headings[0].content).toBe('Hello')
    expect(headings[1].level).toBe(2)
  })

  it('parses paragraphs', () => {
    const doc = parseDocument('Hello world\n\nSecond paragraph')
    const paras = doc.blocks.filter((b) => b.kind === 'paragraph')
    expect(paras.length).toBeGreaterThanOrEqual(1)
    expect(paras[0].content).toContain('Hello world')
  })

  it('parses fenced code blocks', () => {
    const source = '```kotlin\nfun main() {}\n```'
    const doc = parseDocument(source)
    const code = doc.blocks.find((b) => b.kind === 'code')
    expect(code).toBeDefined()
    expect(code!.language).toBe('kotlin')
    expect(code!.content).toBe('fun main() {}')
  })

  it('parses generic function calls', () => {
    const source = '.container width:{80%}\n    body text'
    const doc = parseDocument(source)
    const fn = doc.blocks.find((b) => b.kind === 'functionCall')
    expect(fn).toBeDefined()
    expect(fn!.call?.functionName).toBe('container')
  })

  it('handles unknown constructs as opaque blocks', () => {
    // A deeply nested or unusual construct the parser cannot structure
    // should be preserved verbatim in an opaque block via function call fallback
    const source = '.unknownfunc {weird}\n    nested stuff'
    const doc = parseDocument(source)
    // Either parsed as function call or opaque — content must be present
    const hasContent = doc.blocks.some(
      (b) => b.kind === 'functionCall' || b.kind === 'opaque',
    )
    expect(hasContent).toBe(true)
  })
})

describe('round-trip: serialize(parse(source))', () => {
  it('preserves doctype+heading+paragraph', () => {
    const source = '.doctype {plain}\n.docname {Test}\n\n# Hello\n\nWorld'
    const doc = parseDocument(source)
    const out = serializeDocument(doc)
    expect(out).toContain('.doctype {plain}')
    expect(out).toContain('.docname {Test}')
    expect(out).toContain('# Hello')
    expect(out).toContain('World')
  })
})
