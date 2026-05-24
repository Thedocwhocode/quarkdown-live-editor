import { useCallback, useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import type { Note } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import css from './NoteEditor.module.css'

interface Props {
  note: Note
}

/** Debounce delay (ms) before persisting an edit to the Tauri backend. */
const SAVE_DELAY = 600

export function NoteEditor({ note }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suppressRef = useRef(false)
  const updateNote = useNotesStore(s => s.updateNote)

  const save = useCallback(
    (title: string, sourceQd: string) => {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updateNote(note.id, title, sourceQd)
      }, SAVE_DELAY)
    },
    [note.id, updateNote]
  )

  // Mount CodeMirror
  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: note.sourceQd,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.theme({
            '&': { height: '100%', fontFamily: 'var(--font-editor)', fontSize: '15px' },
            '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
            '.cm-content': { padding: '24px 32px', maxWidth: '720px', margin: '0 auto' },
            '.cm-focused': { outline: 'none' },
            '.cm-activeLine': { background: 'var(--c-editor-line-hover)' },
            '.cm-cursor': { borderLeftColor: 'var(--c-editor-caret)', borderLeftWidth: '2px' },
          }),
          EditorView.updateListener.of(update => {
            if (!update.docChanged || suppressRef.current) return
            const src = update.state.doc.toString()
            const firstLine = src.split('\n').find(l => l.trim()) ?? ''
            const title = firstLine.replace(/^#+\s*/, '').trim() || note.title
            save(title, src)
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view
    return () => view.destroy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  // Sync external IR changes back into CodeMirror
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== note.sourceQd) {
      suppressRef.current = true
      view.dispatch({
        changes: { from: 0, to: current.length, insert: note.sourceQd },
      })
      suppressRef.current = false
    }
  }, [note.sourceQd])

  return (
    <div className={css.editor}>
      <div ref={containerRef} className={css.cm} />
    </div>
  )
}
