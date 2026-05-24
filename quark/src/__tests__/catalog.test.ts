import { describe, expect, it } from 'vitest'
import { BUILT_IN_TEMPLATES } from '../features/templates/catalog'

describe('BUILT_IN_TEMPLATES', () => {
  it('has at least 6 templates', () => {
    expect(BUILT_IN_TEMPLATES.length).toBeGreaterThanOrEqual(6)
  })

  it('all templates have unique IDs', () => {
    const ids = BUILT_IN_TEMPLATES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all templates have a non-empty sourceQdSeed', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(t.sourceQdSeed.trim().length).toBeGreaterThan(0)
    }
  })

  it('all templates have known categories', () => {
    const known = new Set(['academic', 'presentation', 'diagram', 'data'])
    for (const t of BUILT_IN_TEMPLATES) {
      expect(known.has(t.category)).toBe(true)
    }
  })

  it('scientific-article seed contains doctype and headings', () => {
    const t = BUILT_IN_TEMPLATES.find(t => t.id === 'scientific-article')!
    expect(t.sourceQdSeed).toContain('.doctype')
    expect(t.sourceQdSeed).toContain('# ')
  })

  it('math-work seed contains math syntax', () => {
    const t = BUILT_IN_TEMPLATES.find(t => t.id === 'math-work')!
    expect(t.sourceQdSeed).toContain('$$')
  })

  it('mermaid-flowchart seed contains mermaid block', () => {
    const t = BUILT_IN_TEMPLATES.find(t => t.id === 'mermaid-flowchart')!
    expect(t.sourceQdSeed).toContain('.mermaid')
  })
})
