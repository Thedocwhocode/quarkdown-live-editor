import { create } from 'zustand'
import { buildDocument, buildParagraph } from '../../core/ir/builders'
import type { QdBlockNode, QdDocumentMeta, QdDocumentNode } from '../../core/ir/types'

interface DocumentState {
  document: QdDocumentNode
  selectedBlockId: string | null

  setDocument(doc: QdDocumentNode): void
  updateMeta(patch: Partial<QdDocumentMeta>): void
  appendBlock(block: QdBlockNode): void
  insertBlockAfter(afterId: string, block: QdBlockNode): void
  updateBlock(id: string, patch: Partial<Omit<QdBlockNode, 'id'>>): void
  deleteBlock(id: string): void
  moveBlock(id: string, direction: 'up' | 'down'): void
  setSelectedBlockId(id: string | null): void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: buildDocument({ docType: 'plain', title: '' }),
  selectedBlockId: null,

  setDocument(doc) {
    set({ document: doc })
  },

  updateMeta(patch) {
    set((s) => ({ document: { ...s.document, meta: { ...s.document.meta, ...patch } } }))
  },

  appendBlock(block) {
    set((s) => ({ document: { ...s.document, blocks: [...s.document.blocks, block] } }))
  },

  insertBlockAfter(afterId, block) {
    set((s) => {
      const idx = s.document.blocks.findIndex((b) => b.id === afterId)
      const blocks = [...s.document.blocks]
      blocks.splice(idx + 1, 0, block)
      return { document: { ...s.document, blocks } }
    })
  },

  updateBlock(id, patch) {
    set((s) => ({
      document: {
        ...s.document,
        blocks: s.document.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      },
    }))
  },

  deleteBlock(id) {
    set((s) => ({
      document: { ...s.document, blocks: s.document.blocks.filter((b) => b.id !== id) },
      selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
    }))
  },

  moveBlock(id, direction) {
    set((s) => {
      const blocks = [...s.document.blocks]
      const i = blocks.findIndex((b) => b.id === id)
      if (i < 0) return s
      const j = direction === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= blocks.length) return s
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      return { document: { ...s.document, blocks } }
    })
  },

  setSelectedBlockId(id) {
    set({ selectedBlockId: id })
  },
}))

export const useBlocks = () => useDocumentStore((s) => s.document.blocks)
export const useSelectedBlockId = () => useDocumentStore((s) => s.selectedBlockId)

// Keep a fallback paragraph so the surface is never empty
export function ensureNonEmpty(doc: QdDocumentNode): QdDocumentNode {
  if (doc.blocks.length > 0) return doc
  return { ...doc, blocks: [buildParagraph()] }
}
