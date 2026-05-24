import { X } from 'lucide-react'
import type { Tag } from '../../core/types'
import css from './TagChip.module.css'

interface Props {
  tag: Tag
  onRemove?: () => void
}

export function TagChip({ tag, onRemove }: Props) {
  return (
    <span className={css.chip}>
      #{tag.name}
      {onRemove && (
        <button className={css.remove} onClick={onRemove} aria-label={`Remove tag ${tag.name}`}>
          <X size={10} />
        </button>
      )}
    </span>
  )
}
