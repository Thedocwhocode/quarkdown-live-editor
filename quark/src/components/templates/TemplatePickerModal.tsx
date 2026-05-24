import { useEffect } from 'react'
import { X } from 'lucide-react'
import { BUILT_IN_TEMPLATES } from '../../features/templates/catalog'
import type { Template } from '../../core/types'
import css from './TemplatePickerModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (template: Template) => void
}

function groupByCategory(templates: Template[]): Record<string, Template[]> {
  return templates.reduce<Record<string, Template[]>>((acc, t) => {
    ;(acc[t.category] ??= []).push(t)
    return acc
  }, {})
}

export function TemplatePickerModal({ open, onClose, onSelect }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const groups = groupByCategory(BUILT_IN_TEMPLATES)

  const handleSelect = (template: Template) => {
    onSelect(template)
    onClose()
  }

  return (
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.container} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <span className={css.title}>New from Template</span>
          <button className={css.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={css.body}>
          {Object.entries(groups).map(([category, templates]) => (
            <section key={category} className={css.section}>
              <h3 className={css.categoryHeading}>{category}</h3>
              <div className={css.grid}>
                {templates.map(template => (
                  <button
                    key={template.id}
                    className={css.card}
                    onClick={() => handleSelect(template)}
                  >
                    <span className={css.cardName}>{template.name}</span>
                    <span className={css.cardDesc}>{template.description}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
