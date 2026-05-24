import { describe, it, expect } from 'vitest'
import { CATALOG } from '../src/core/registry/catalog'
import { lookupByName, lookupById, byCategory, search } from '../src/core/registry'

describe('registry catalog', () => {
  it('has at least 20 entries', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(20)
  })

  it('every entry has required fields', () => {
    for (const item of CATALOG) {
      expect(item.id).toBeTruthy()
      expect(item.canonicalName).toBeTruthy()
      expect(item.displayName).toBeTruthy()
      expect(item.category).toBeTruthy()
      expect(item.serializerTemplate).toBeTruthy()
    }
  })

  it('no duplicate ids', () => {
    const ids = CATALOG.map((i) => i.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

describe('lookupByName', () => {
  it('finds known functions', () => {
    expect(lookupByName('docname')?.displayName).toBe('Document Title')
    expect(lookupByName('figure')?.category).toBe('media')
    expect(lookupByName('mermaid')?.category).toBe('diagrams')
  })

  it('returns undefined for unknown names', () => {
    expect(lookupByName('doesnotexist')).toBeUndefined()
  })
})

describe('lookupById', () => {
  it('finds by id', () => {
    expect(lookupById('figure')?.canonicalName).toBe('figure')
  })
})

describe('byCategory', () => {
  it('returns all layout entries', () => {
    const layout = byCategory('layout')
    expect(layout.length).toBeGreaterThanOrEqual(3)
    for (const item of layout) {
      expect(item.category).toBe('layout')
    }
  })
})

describe('search', () => {
  it('finds by keyword', () => {
    const results = search('table')
    expect(results.some((r) => r.category === 'tables')).toBe(true)
  })

  it('returns all entries for empty query', () => {
    expect(search('').length).toBe(CATALOG.length)
  })

  it('is case-insensitive', () => {
    expect(search('MERMAID').length).toBeGreaterThan(0)
  })
})
