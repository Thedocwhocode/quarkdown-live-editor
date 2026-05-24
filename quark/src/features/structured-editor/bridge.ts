/**
 * Bridge between Quark's Note model and the structured editor's IR.
 *
 * On note selection: parse source_qd → QdDocumentNode and load into document store.
 * On IR change: serialize back → source_qd (persisted via orchestrator).
 */
import { parseDocument } from '../../core/parser/parse'
import { ensureNonEmpty, useDocumentStore } from './store'
import { setCurrentNoteId } from './orchestrator'
import type { Note } from '../../core/types'

/**
 * Loads a note into the structured editor.
 * Parses the note's Quarkdown source into the IR document store.
 */
export function loadNoteIntoEditor(note: Note): void {
  setCurrentNoteId(note.id)

  const raw = note.sourceQd ?? ''
  const parsed = parseDocument(raw)
  const doc = ensureNonEmpty(parsed)

  useDocumentStore.getState().setDocument(doc)
}
