import { useEffect, useState } from 'react'
import { FileText, Printer, Image, X } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { exportApi } from '../../core/invoke'
import css from './ExportModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  noteId: string
}

type Status = { kind: 'idle' } | { kind: 'success'; message: string } | { kind: 'error'; message: string }

export function ExportModal({ open, onClose, noteId }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    if (!open) return
    setStatus({ kind: 'idle' })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const exportTxt = async () => {
    try {
      const path = await invoke<string | null>('plugin:dialog|save', {
        filters: [{ name: 'Text', extensions: ['txt'] }],
      })
      if (!path) return
      await exportApi.toTxt(noteId, path)
      setStatus({ kind: 'success', message: `Saved to ${path}` })
    } catch (err) {
      setStatus({ kind: 'error', message: String(err) })
    }
  }

  const exportPdf = () => {
    window.print()
  }

  const exportJpg = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const iframe = document.querySelector('iframe.preview-frame') as HTMLIFrameElement | null
      if (!iframe?.contentDocument?.body) {
        setStatus({ kind: 'error', message: 'Preview not available' })
        return
      }
      const canvas = await html2canvas(iframe.contentDocument.body)
      const url = canvas.toDataURL('image/jpeg', 0.92)
      const a = document.createElement('a')
      a.href = url
      a.download = `note-${noteId}.jpg`
      a.click()
      setStatus({ kind: 'success', message: 'Image downloaded' })
    } catch (err) {
      setStatus({ kind: 'error', message: String(err) })
    }
  }

  return (
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.container} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <span className={css.title}>Export Note</span>
          <button className={css.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={css.body}>
          <button className={css.formatBtn} onClick={exportTxt}>
            <FileText size={20} className={css.icon} />
            <div className={css.formatText}>
              <span className={css.formatName}>Plain Text</span>
              <span className={css.formatDesc}>Export as .txt file</span>
            </div>
          </button>

          <button className={css.formatBtn} onClick={exportPdf}>
            <Printer size={20} className={css.icon} />
            <div className={css.formatText}>
              <span className={css.formatName}>PDF</span>
              <span className={css.formatDesc}>Prints the current preview</span>
            </div>
          </button>

          <button className={css.formatBtn} onClick={exportJpg}>
            <Image size={20} className={css.icon} />
            <div className={css.formatText}>
              <span className={css.formatName}>JPG Image</span>
              <span className={css.formatDesc}>Capture preview as image</span>
            </div>
          </button>
        </div>

        {status.kind !== 'idle' && (
          <div className={status.kind === 'success' ? css.statusSuccess : css.statusError}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  )
}
