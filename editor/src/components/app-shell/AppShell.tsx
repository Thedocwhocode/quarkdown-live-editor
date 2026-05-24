import { useState } from 'react'
import { TopToolbar } from '../toolbar/TopToolbar'
import { DocumentSetupPanel } from '../document-setup/DocumentSetupPanel'
import { BlockLibraryPanel } from '../block-library/BlockLibraryPanel'
import { EditorSurface } from '../editor-surface/EditorSurface'
import { SourceEditorPanel } from '../source-view/SourceEditorPanel'
import { PreviewPane } from '../preview/PreviewPane'
import { SelectionInspector } from '../inspector/SelectionInspector'
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel'
import { usePreviewStore } from '@/features/preview/store'
import styles from './AppShell.module.css'

type RightTab = 'preview' | 'inspector' | 'diagnostics'

export function AppShell() {
  const [rightTab, setRightTab] = useState<RightTab>('preview')
  const [sourceOpen, setSourceOpen] = useState(false)
  const [leftTab, setLeftTab] = useState<'setup' | 'library'>('setup')
  const diagnostics = usePreviewStore((s) => s.diagnostics)

  return (
    <div className={styles.shell}>
      {/* Left sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTabs}>
          <button
            className={`${styles.sidebarTab} ${leftTab === 'setup' ? styles.active : ''}`}
            onClick={() => setLeftTab('setup')}
          >
            Setup
          </button>
          <button
            className={`${styles.sidebarTab} ${leftTab === 'library' ? styles.active : ''}`}
            onClick={() => setLeftTab('library')}
          >
            Blocks
          </button>
        </div>
        <div className={styles.sidebarContent}>
          {leftTab === 'setup' ? <DocumentSetupPanel /> : <BlockLibraryPanel />}
        </div>
      </aside>

      {/* Main workspace */}
      <div className={styles.workspace}>
        <TopToolbar />
        <div className={styles.editorArea}>
          <EditorSurface />
        </div>
        {sourceOpen && (
          <div className={styles.sourceArea}>
            <SourceEditorPanel />
          </div>
        )}
        <button
          className={styles.sourceToggle}
          onClick={() => setSourceOpen((v) => !v)}
          title={sourceOpen ? 'Hide source' : 'Show source'}
        >
          {sourceOpen ? '▾ Source' : '▸ Source'}
        </button>
      </div>

      {/* Right panel */}
      <aside className={styles.rightPanel}>
        <div className={styles.rightTabs}>
          <button
            className={`${styles.rightTab} ${rightTab === 'preview' ? styles.active : ''}`}
            onClick={() => setRightTab('preview')}
          >
            Preview
          </button>
          <button
            className={`${styles.rightTab} ${rightTab === 'inspector' ? styles.active : ''}`}
            onClick={() => setRightTab('inspector')}
          >
            Inspector
          </button>
          <button
            className={`${styles.rightTab} ${rightTab === 'diagnostics' ? styles.active : ''}`}
            onClick={() => setRightTab('diagnostics')}
          >
            Issues
            {diagnostics.length > 0 && (
              <span className={styles.badge}>{diagnostics.length}</span>
            )}
          </button>
        </div>
        <div className={styles.rightContent}>
          {rightTab === 'preview' && <PreviewPane />}
          {rightTab === 'inspector' && <SelectionInspector />}
          {rightTab === 'diagnostics' && <DiagnosticsPanel />}
        </div>
      </aside>
    </div>
  )
}
