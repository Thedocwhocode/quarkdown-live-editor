/**
 * Basic type-level and runtime invariants for the domain types.
 * These tests do not require a Tauri context.
 */
import { describe, expect, it } from 'vitest'
import type { Note, NoteStatus } from '../core/types'

const NOTE_STATUSES: NoteStatus[] = ['draft', 'compiled', 'error', 'archived']

describe('NoteStatus', () => {
  it('covers all expected values', () => {
    expect(NOTE_STATUSES).toHaveLength(4)
    expect(NOTE_STATUSES).toContain('draft')
    expect(NOTE_STATUSES).toContain('compiled')
    expect(NOTE_STATUSES).toContain('error')
    expect(NOTE_STATUSES).toContain('archived')
  })
})

describe('Note shape', () => {
  it('allows all optional fields to be null', () => {
    const note: Note = {
      id: '123',
      title: 'Test',
      sourceQd: '# Test',
      compiledHtml: null,
      excerpt: null,
      status: 'draft',
      notebookId: null,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCompiledAt: null,
      lastError: null,
    }
    expect(note.status).toBe('draft')
    expect(note.compiledHtml).toBeNull()
  })
})
