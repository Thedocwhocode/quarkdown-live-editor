import { create } from 'zustand'
import { buildDocument, buildParagraph } from '@/core/ir/builders'
import type { QdBlockNode, QdDocumentMeta, QdDocumentNode } from '@/core/ir/types'

interface DocumentState {
  document: QdDocumentNode
  selectedBlockId: string | null

  /** Replace the entire document (e.g. from parser). */
  setDocument(doc: QdDocumentNode): void

  /** Update document metadata fields. */
  updateMeta(patch: Partial<QdDocumentMeta>): void

  /** Append a new block at the end. */
  appendBlock(block: QdBlockNode): void

  /** Insert a block after the block with the given id. */
  insertBlockAfter(afterId: string, block: QdBlockNode): void

  /** Replace the block with the given id. */
  updateBlock(id: string, patch: Partial<Omit<QdBlockNode, 'id'>>): void

  /** Remove a block by id. */
  deleteBlock(id: string): void

  /** Move a block up or down by one position. */
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
    set((s) => ({
      document: {
        ...s.document,
        meta: { ...s.document.meta, ...patch },
      },
    }))
  },

  appendBlock(block) {
    set((s) => ({
      document: {
        ...s.document,
        blocks: [...s.document.blocks, block],
      },
    }))
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
        blocks: s.document.blocks.map((b) =>
          b.id === id ? { ...b, ...patch } : b,
        ),
      },
    }))
  },

  deleteBlock(id) {
    set((s) => {
      const blocks = s.document.blocks.filter((b) => b.id !== id)
      return {
        document: {
          ...s.document,
          blocks: blocks.length > 0 ? blocks : [buildParagraph()],
        },
      }
    })
  },

  moveBlock(id, direction) {
    set((s) => {
      const blocks = [...s.document.blocks]
      const idx = blocks.findIndex((b) => b.id === id)
      if (idx === -1) return s
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= blocks.length) return s
      ;[blocks[idx], blocks[targetIdx]] = [blocks[targetIdx], blocks[idx]]
      return { document: { ...s.document, blocks } }
    })
  },

  setSelectedBlockId(id) {
    set({ selectedBlockId: id })
  },
}))

/** Convenience: the current document's blocks. */
export function useBlocks() {
  return useDocumentStore((s) => s.document.blocks)
}

/** Convenience: the current document's metadata. */
export function useMeta() {
  return useDocumentStore((s) => s.document.meta)
}
