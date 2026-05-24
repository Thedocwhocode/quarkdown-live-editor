import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useToastStore } from '../../features/toast/store'
import css from './Toast.module.css'

export function ToastContainer() {
  const toasts  = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  if (toasts.length === 0) return null

  return createPortal(
    <div className={css.stack} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`${css.toast} ${css[t.kind]}`} role="alert">
          <span className={css.message}>{t.message}</span>
          {t.action && (
            <button
              className={css.actionBtn}
              onClick={() => { t.action!.onClick(); dismiss(t.id) }}
            >
              {t.action.label}
            </button>
          )}
          <button className={css.closeBtn} onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
