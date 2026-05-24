import { useCallback, useEffect, useRef, useState } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import type { Note } from '../../core/types'
import { useNotesStore } from '../../features/notes/store'
import { SlashCommandMenu, type SlashMenuItem } from './SlashCommandMenu'
import { BubbleMenu, type FormatAction } from './BubbleMenu'
import css from './NoteEditor.module.css'

interface Props {
  note: Note
}

interface SlashState {
  anchorRect: DOMRect
  query: string
  slashFrom: number
  cursorTo: number
}

const SAVE_DELAY = 600

function applyFormatInView(view: EditorView, action: 'bold' | 'italic' | 'code') {
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to)
  if (!selected) return
  const wrap: Record<string, string> = { bold: '**', italic: '_', code: '`' }
  const w = wrap[action]
  view.dispatch({
    changes: { from, to, insert: `${w}${selected}${w}` },
    selection: { anchor: from + w.length + selected.length + w.length },
  })
}

export function NoteEditor({ note }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef      = useRef<EditorView | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suppressRef  = useRef(false)
  const updateNote   = useNotesStore(s => s.updateNote)

  const [slashState, setSlashState] = useState<SlashState | null>(null)
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null)

  // Stable ref so event handlers inside useEffect don't get stale closure
  const slashStateRef = useRef(slashState)
  slashStateRef.current = slashState

  const save = useCallback(
    (title: string, sourceQd: string) => {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updateNote(note.id, title, sourceQd)
      }, SAVE_DELAY)
    },
    [note.id, updateNote],
  )

  // ── Mount CodeMirror ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: note.sourceQd,
        extensions: [
          basicSetup,
          markdown(),
          keymap.of([
            {
              key: 'Mod-b',
              run: (view) => { applyFormatInView(view, 'bold'); return true },
            },
            {
              key: 'Mod-i',
              run: (view) => { applyFormatInView(view, 'italic'); return true },
            },
            {
              key: 'Mod-k',
              run: (view) => { applyFormatInView(view, 'code'); return true },
            },
          ]),
          EditorView.theme({
            '&':              { height: '100%', fontFamily: 'var(--font-editor)', fontSize: '15px' },
            '.cm-scroller':   { overflow: 'auto', lineHeight: '1.7' },
            '.cm-content':    { padding: '24px 32px', maxWidth: '720px', margin: '0 auto' },
            '.cm-focused':    { outline: 'none' },
            '.cm-activeLine': { background: 'var(--c-editor-line-hover)' },
            '.cm-cursor':     { borderLeftColor: 'var(--c-editor-caret)', borderLeftWidth: '2px' },
          }),
          EditorView.updateListener.of(update => {
            // ── Auto-save ─────────────────────────────────────────────────
            if (update.docChanged && !suppressRef.current) {
              const src = update.state.doc.toString()
              const firstLine = src.split('\n').find(l => l.trim()) ?? ''
              const title = firstLine.replace(/^#+\s*/, '').trim() || note.title
              save(title, src)
            }

            const sel = update.state.selection.main
            const cursorPos = sel.head

            // ── Slash command: `/query` at start of line ──────────────────
            const line = update.state.doc.lineAt(cursorPos)
            const textToCursor = line.text.slice(0, cursorPos - line.from)
            const slashMatch = textToCursor.match(/^\/(\w*)$/)

            if (slashMatch && update.docChanged) {
              const query = slashMatch[1] ?? ''
              const slashFrom = line.from
              const coords = update.view.coordsAtPos(slashFrom)
              if (coords) {
                setSlashState({
                  anchorRect: new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top),
                  query,
                  slashFrom,
                  cursorTo: cursorPos,
                })
              }
            } else if (update.docChanged && slashStateRef.current) {
              setSlashState(null)
            }

            // ── Bubble menu: show on non-empty selection ──────────────────
            if (!sel.empty) {
              const fromCoords = update.view.coordsAtPos(sel.from)
              const toCoords   = update.view.coordsAtPos(sel.to)
              if (fromCoords && toCoords) {
                setBubbleRect(
                  new DOMRect(
                    fromCoords.left,
                    fromCoords.top,
                    toCoords.right - fromCoords.left,
                    toCoords.bottom - fromCoords.top,
                  ),
                )
              }
            } else {
              setBubbleRect(null)
            }
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view
    return () => {
      view.destroy()
      setSlashState(null)
      setBubbleRect(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  // Sync external note changes back into CodeMirror
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== note.sourceQd) {
      suppressRef.current = true
      view.dispatch({ changes: { from: 0, to: current.length, insert: note.sourceQd } })
      suppressRef.current = false
    }
  }, [note.sourceQd])

  // ── Slash command selection ─────────────────────────────────────────────

  function handleSlashSelect(item: SlashMenuItem) {
    const view = viewRef.current
    const state = slashStateRef.current
    if (!view || !state) return
    setSlashState(null)

    let insert: string
    switch (item.kind) {
      case 'paragraph': insert = ''; break
      case 'heading':   insert = `${'#'.repeat(item.level)} `; break
      case 'code':      insert = '```\n\n```'; break
      case 'divider':   insert = '---'; break
      case 'emoji':     insert = item.char; break
      case 'catalog':
        // Strip template placeholders → bare function call skeleton
        insert = item.item.serializerTemplate.replace(/\{\{\{[^}]+\}\}\}/g, '').trimEnd()
        break
      default: return
    }

    view.dispatch({
      changes: { from: state.slashFrom, to: state.cursorTo, insert },
      selection: { anchor: state.slashFrom + insert.length },
    })
    view.focus()
  }

  // ── Bubble format application ───────────────────────────────────────────

  function handleFormat(action: FormatAction) {
    const view = viewRef.current
    if (!view) return

    const { from, to } = view.state.selection.main
    const selectedText = view.state.sliceDoc(from, to)
    if (!selectedText) return

    let replacement: string
    if      (action === 'bold')   replacement = `**${selectedText}**`
    else if (action === 'italic') replacement = `_${selectedText}_`
    else if (action === 'code')   replacement = `\`${selectedText}\``
    else if (action === 'h1')     replacement = `# ${selectedText}`
    else if (action === 'h2')     replacement = `## ${selectedText}`
    else if (action === 'quote')  replacement = `> ${selectedText}`
    else if (typeof action === 'object' && action.kind === 'link')
      replacement = `[${selectedText}](${action.url})`
    else return

    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + replacement.length },
    })
    view.focus()
    setBubbleRect(null)
  }

  return (
    <div className={css.editor}>
      <div ref={containerRef} className={css.cm} />

      {slashState && (
        <SlashCommandMenu
          anchorRect={slashState.anchorRect}
          query={slashState.query}
          onSelect={handleSlashSelect}
          onClose={() => setSlashState(null)}
        />
      )}

      {bubbleRect && !slashState && (
        <BubbleMenu
          anchorRect={bubbleRect}
          onFormat={handleFormat}
        />
      )}
    </div>
  )
}
