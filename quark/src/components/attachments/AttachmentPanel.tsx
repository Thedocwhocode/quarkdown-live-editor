import { useEffect, useState } from 'react'
import { FileText, File, Trash2, Paperclip, X } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { attachmentsApi } from '../../core/invoke'
import type { Attachment } from '../../core/types'
import css from './AttachmentPanel.module.css'

interface Props {
  noteId: string
  onClose: () => void
}

export function AttachmentPanel({ noteId, onClose }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [ocrRunning, setOcrRunning] = useState<string | null>(null)

  useEffect(() => {
    attachmentsApi.list(noteId).then(setAttachments).catch(console.error)
  }, [noteId])

  const handleAdd = async () => {
    try {
      const paths = await invoke<string[] | null>('plugin:dialog|open', {
        multiple: true,
        filters: [{ name: 'Files', extensions: ['png', 'jpg', 'jpeg', 'pdf', 'gif', 'webp'] }],
      })
      if (!paths?.length) return
      const results = await Promise.all(
        paths.map(path => {
          const ext = path.split('.').pop()?.toLowerCase() ?? ''
          const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
          const kind: Attachment['kind'] = isImage ? 'image' : ext === 'pdf' ? 'pdf' : 'file'
          const mimeType = isImage ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'
          return attachmentsApi.add(noteId, path, kind, mimeType)
        }),
      )
      setAttachments(prev => [...prev, ...results])
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await attachmentsApi.delete(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleOcr = async (attachment: Attachment) => {
    try {
      setOcrRunning(attachment.id)
      const Tesseract = (await import('tesseract.js')).default
      const result = await Tesseract.recognize(attachment.path, 'eng')
      const text = result.data.text
      await attachmentsApi.setOcrText(attachment.id, text)
      setAttachments(prev =>
        prev.map(a => (a.id === attachment.id ? { ...a, ocrText: text } : a)),
      )
    } catch (err) {
      console.error(err)
    } finally {
      setOcrRunning(null)
    }
  }

  return (
    <div className={css.panel}>
      <div className={css.header}>
        <span className={css.headerTitle}>
          <Paperclip size={14} />
          Attachments
          <span className={css.count}>{attachments.length}</span>
        </span>
        <button className={css.closeBtn} onClick={onClose} aria-label="Close attachments">
          <X size={14} />
        </button>
      </div>

      <div className={css.content}>
        {attachments.length === 0 ? (
          <span className={css.empty}>No attachments yet</span>
        ) : (
          <div className={css.grid}>
            {attachments.map(att => (
              <div key={att.id} className={css.item}>
                {att.kind === 'image' ? (
                  <img src={att.path} alt="" className={css.thumbnail} />
                ) : (
                  <div className={css.fileIcon}>
                    {att.kind === 'pdf' ? <FileText size={24} /> : <File size={24} />}
                    <span className={css.fileExt}>{att.path.split('.').pop()?.toUpperCase()}</span>
                  </div>
                )}

                <div className={css.itemOverlay}>
                  <button
                    className={css.deleteBtn}
                    onClick={() => handleDelete(att.id)}
                    aria-label="Delete attachment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {att.kind === 'image' && att.ocrText === null && (
                  <button
                    className={css.ocrBtn}
                    onClick={() => handleOcr(att)}
                    disabled={ocrRunning === att.id}
                  >
                    {ocrRunning === att.id ? '…' : 'OCR'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={css.footer}>
        <button className={css.addBtn} onClick={handleAdd}>
          <Paperclip size={14} />
          Add files
        </button>
      </div>
    </div>
  )
}
