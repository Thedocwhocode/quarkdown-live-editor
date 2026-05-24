import { useEffect, useRef, useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { useThemesStore, THEMES } from '../../features/themes/store'
import { useNotebooksStore } from '../../features/notebooks/store'
import { settingsApi } from '../../core/invoke'
import { DEFAULT_COMPILE_SERVER } from '../../features/compile/remoteCompile'
import type { AppTheme } from '../../core/types'
import type { Notebook } from '../../core/types'
import css from './SettingsModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'themes' | 'notebooks' | 'server'

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

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function ServerTab() {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const [ping, setPing] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [pingMsg, setPingMsg] = useState('')

  useEffect(() => {
    settingsApi.get('compileServerUrl').then(v => setUrl(v ?? DEFAULT_COMPILE_SERVER)).catch(() => {})
  }, [])

  const validateUrl = (raw: string): boolean => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setUrlError(null)
      return true
    }
    if (!isValidHttpUrl(trimmed)) {
      setUrlError('Enter a valid URL starting with http:// or https://')
      return false
    }
    setUrlError(null)
    return true
  }

  const save = async () => {
    const trimmed = url.trim()
    if (!validateUrl(trimmed)) return
    setStatus('saving')
    try {
      await settingsApi.set('compileServerUrl', trimmed || DEFAULT_COMPILE_SERVER)
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  const testConnection = async () => {
    const trimmed = url.trim()
    if (!validateUrl(trimmed)) return
    const target = trimmed || DEFAULT_COMPILE_SERVER
    setPing('checking')
    setPingMsg('')
    try {
      const res = await fetch(`${target}/api/health`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        setPing('ok')
        setPingMsg('Server reachable')
      } else {
        setPing('error')
        setPingMsg(`Server returned HTTP ${res.status}`)
      }
    } catch (e) {
      setPing('error')
      const msg = e instanceof TypeError ? 'Network error — check URL and firewall' : String(e)
      setPingMsg(msg)
    }
    setTimeout(() => { setPing('idle'); setPingMsg('') }, 6000)
  }

  return (
    <div className={css.serverSection}>
      <div>
        <h3>Compile Server</h3>
        <p>
          On Android and iOS the Quarkdown compiler runs remotely.
          Enter the URL of your self-hosted Quark Cloud server, or use the default hosted service.
        </p>
      </div>

      <div className={css.serverInputRow}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            className={`${css.serverInput} ${urlError ? css.serverInputError : ''}`}
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); validateUrl(e.target.value) }}
            placeholder={DEFAULT_COMPILE_SERVER}
            spellCheck={false}
          />
          {urlError && <span className={css.serverFieldError}>{urlError}</span>}
        </div>
        <button className={css.serverSaveBtn} onClick={save} disabled={status === 'saving' || !!urlError}>
          {status === 'saving' ? 'Saving…' : status === 'ok' ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
        <button
          className={css.serverSaveBtn}
          style={{ background: 'var(--c-list-hover)', color: 'var(--c-list-title)' }}
          onClick={testConnection}
          disabled={ping === 'checking' || !!urlError}
        >
          {ping === 'checking' ? 'Testing…' : 'Test connection'}
        </button>
        {ping === 'ok' && <span className={`${css.serverStatus} ${css.serverStatusOk}`}>{pingMsg}</span>}
        {ping === 'error' && <span className={`${css.serverStatus} ${css.serverStatusError}`}>{pingMsg}</span>}
      </div>

      <p style={{ fontSize: 'var(--text-xs)', marginTop: 8 }}>
        <strong>Self-host:</strong> run <code>docker compose up</code> from the <code>cloud/</code> directory,
        then set this URL to your server&apos;s public address.
      </p>
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
          <button
            className={`${css.tab} ${activeTab === 'server' ? css.tabActive : ''}`}
            onClick={() => setActiveTab('server')}
          >
            Server
          </button>
        </div>

        <div className={css.body}>
          {activeTab === 'themes' && <ThemesTab />}
          {activeTab === 'notebooks' && <NotebooksTab />}
          {activeTab === 'server' && <ServerTab />}
        </div>
      </div>
    </div>
  )
}
