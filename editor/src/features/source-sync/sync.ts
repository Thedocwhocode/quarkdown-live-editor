import { parseDocument } from '@/core/parser/parse'
import { serializeDocument } from '@/core/serializer/serialize'
import type { QdDocumentNode } from '@/core/ir/types'

/**
 * Given a new source string (e.g. from CodeMirror), parses it into a fresh
 * document IR — unless the source is already identical to the serialized form
 * of the current IR (which would mean the edit came from the UI, not the source
 * panel, and no sync is needed).
 *
 * Returns `null` if no update is necessary (guards against infinite loops).
 */
export function syncFromSource(
  currentDoc: QdDocumentNode,
  newSource: string,
): QdDocumentNode | null {
  const currentSource = serializeDocument(currentDoc)
  if (currentSource === newSource) return null
  return parseDocument(newSource)
}

/**
 * Returns the serialized .qd source for the given document.
 * Used to push IR changes back into the CodeMirror view.
 */
export function syncFromDocument(doc: QdDocumentNode): string {
  return serializeDocument(doc)
}
