import { useEffect, useRef, useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { useThemesStore, THEMES } from '../../features/themes/store'
import { useNotebooksStore } from '../../features/notebooks/store'
import type { AppTheme } from '../../core/types'
import type { Notebook } from '../../core/types'
import css from './SettingsModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'themes' | 'notebooks'

const THEME_SWATCHES: Record<AppTheme, { bg: string; accent: string }> = {
  'warm-paper':   { bg: '#faf8f5', accent: '#d4774a' },
  'red-graphite': { bg: '#1e141a', accent: '#c44569' },
  'toothpaste':   { bg: '#f8feff', accent: '#2e9bba' },
  'solarized':    { bg: '#fdf6e3', accent: '#268bd2' },
  'bear-dark':    { bg: '#1c1c1e', accent: '#ff9f0a' },
}

const NOTEBOOK_EMOJIS = ['📁', '📂', '📝', '🗂', '📚', '📖', '🔖', '💼', '🏠', '⭐']
const NOTEBOOK_COLORS = ['#d4774a', '#c44569', '#2e9bba', '#4a9b6f', '#8e44ad']

function ThemesTab() {
  const theme = useThemesStore(s => s.theme)
  const setTheme = useThemesStore(s => s.setTheme)

  return (
    <div className={css.themeGrid}>
      {THEMES.map(t => {
        const swatch = THEME_SWATCHES[t.id]
        const selected = theme === t.id
        return (
          <button
            key={t.id}
            className={`${css.themeCard} ${selected ? css.themeCardSelected : ''}`}
            onClick={() => setTheme(t.id)}
            aria-pressed={selected}
          >
            <div
              className={css.themeSwatch}
              style={{ background: swatch.bg, borderColor: swatch.accent }}
            >
              <div className={css.swatchAccent} style={{ background: swatch.accent }} />
              {selected && (
                <span className={css.checkOverlay}>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              )}
            </div>
            <span className={css.themeLabel}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

interface NotebookRowProps {
  notebook: Notebook
  onUpdate: (id: string, name: string, icon?: string, color?: string) => void
  onDelete: (id: string) => void
}

function NotebookRow({ notebook, onUpdate, onDelete }: NotebookRowProps) {
  const [name, setName] = useState(notebook.name)
  const [icon, setIcon] = useState(notebook.icon ?? '📁')
  const [color, setColor] = useState(notebook.color ?? NOTEBOOK_COLORS[0])
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!emojiOpen) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  const save = (nextName: string, nextIcon: string, nextColor: string) => {
    onUpdate(notebook.id, nextName, nextIcon, nextColor)
  }

  const handleNameBlur = () => save(name, icon, color)

  const pickEmoji = (e: string) => {
    setIcon(e)
    setEmojiOpen(false)
    save(name, e, color)
  }

  const pickColor = (c: string) => {
    setColor(c)
    save(name, icon, c)
  }

  return (
    <div className={css.notebookRow}>
      <div className={css.notebookIconWrap} ref={emojiRef}>
        <button
          className={css.iconBtn}
          onClick={() => setEmojiOpen(v => !v)}
          title="Change icon"
        >
          {icon}
        </button>
        {emojiOpen && (
          <div className={css.emojiPicker}>
            {NOTEBOOK_EMOJIS.map(e => (
              <button key={e} className={css.emojiOption} onClick={() => pickEmoji(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        className={css.notebookNameInput}
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleNameBlur}
        aria-label="Notebook name"
      />

      <div className={css.colorRow}>
        {NOTEBOOK_COLORS.map(c => (
          <button
            key={c}
            className={`${css.colorSwatch} ${color === c ? css.colorSwatchActive : ''}`}
            style={{ background: c }}
            onClick={() => pickColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>

      <button
        className={css.deleteNotebookBtn}
        onClick={() => onDelete(notebook.id)}
        aria-label="Delete notebook"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function NotebooksTab() {
  const notebooks = useNotebooksStore(s => s.notebooks)
  const updateNotebook = useNotebooksStore(s => s.updateNotebook)
  const deleteNotebook = useNotebooksStore(s => s.deleteNotebook)
  const loadNotebooks = useNotebooksStore(s => s.loadNotebooks)

  useEffect(() => {
    loadNotebooks()
  }, [loadNotebooks])

  return (
    <div className={css.notebookList}>
      {notebooks.length === 0 && (
        <span className={css.emptyNote}>No notebooks yet.</span>
      )}
      {notebooks.map(nb => (
        <NotebookRow
          key={nb.id}
          notebook={nb}
          onUpdate={updateNotebook}
          onDelete={deleteNotebook}
        />
      ))}
    </div>
  )
}

export function SettingsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('themes')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.container} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <span className={css.title}>Settings</span>
          <button className={css.closeBtn} onClick={onClose} aria-label="Close settings">
            <X size={16} />
          </button>
        </div>

        <div className={css.tabs}>
          <button
            className={`${css.tab} ${activeTab === 'themes' ? css.tabActive : ''}`}
            onClick={() => setActiveTab('themes')}
          >
            Themes
          </button>
          <button
            className={`${css.tab} ${activeTab === 'notebooks' ? css.tabActive : ''}`}
            onClick={() => setActiveTab('notebooks')}
          >
            Notebooks
          </button>
        </div>

        <div className={css.body}>
          {activeTab === 'themes' ? <ThemesTab /> : <NotebooksTab />}
        </div>
      </div>
    </div>
  )
}
