import { BookOpen, FileText, PenLine, Eye, Settings } from 'lucide-react'
import css from './MobileBottomNav.module.css'

export type MobilePanel = 'notes' | 'editor' | 'preview' | 'settings'

interface Props {
  activePanel: MobilePanel
  onSelect: (panel: MobilePanel) => void
}

const TABS: { panel: MobilePanel; icon: React.ReactNode; label: string }[] = [
  { panel: 'notes',    icon: <BookOpen size={20} strokeWidth={1.8} />, label: 'Notes' },
  { panel: 'editor',  icon: <PenLine  size={20} strokeWidth={1.8} />, label: 'Edit' },
  { panel: 'preview', icon: <Eye      size={20} strokeWidth={1.8} />, label: 'Preview' },
  { panel: 'settings',icon: <Settings size={20} strokeWidth={1.8} />, label: 'Settings' },
]

export function MobileBottomNav({ activePanel, onSelect }: Props) {
  return (
    <nav className={css.nav} aria-label="Main navigation">
      {TABS.map(({ panel, icon, label }) => (
        <button
          key={panel}
          className={css.btn}
          data-active={activePanel === panel}
          onClick={() => onSelect(panel)}
          aria-label={label}
        >
          {icon}
          <span className={css.label}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
