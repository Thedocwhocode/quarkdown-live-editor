import { useEffect, useState } from 'react'
import { NoteEditor } from '../editor/NoteEditor'
import { PreviewPane } from '../preview/PreviewPane'
import { Toolbar } from '../toolbar/Toolbar'
import { NoteList } from './NoteList'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import type { MobilePanel } from './MobileBottomNav'
import { TemplatePickerModal } from '../templates/TemplatePickerModal'
import { ExportModal } from '../export/ExportModal'
import { AttachmentPanel } from '../attachments/AttachmentPanel'
import { SettingsModal } from '../settings/SettingsModal'
import { StructuredEditorPane } from '../structured-editor/StructuredEditorPane'
import { useNotesStore } from '../../features/notes/store'
import { getPlatform, isMobilePlatform } from '../../utils/platform'
import css from './AppShell.module.css'

export function AppShell() {
  const viewMode     = useNotesStore(s => s.viewMode)
  const selectedNote = useNotesStore(s => s.selectedNote())
  const createNote   = useNotesStore(s => s.createNote)

  const [templateOpen, setTemplateOpen] = useState(false)
  const [exportOpen,   setExportOpen]   = useState(false)
  const [attachOpen,   setAttachOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Mobile: track which bottom-nav panel is visible
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('notes')
  const [isMobile, setIsMobile]       = useState(false)

  useEffect(() => {
    getPlatform().then(p => setIsMobile(isMobilePlatform(p)))
    // Also respond to window resize (browser / dev mode)
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleTemplateSelect = async (tpl: { name: string; sourceQdSeed: string }) => {
    await createNote(tpl.name, tpl.sourceQdSeed)
    if (isMobile) setMobilePanel('editor')
  }

  const handleMobilePanel = (panel: MobilePanel) => {
    if (panel === 'settings') {
      setSettingsOpen(true)
      return
    }
    setMobilePanel(panel)
  }

  // On mobile, show/hide panels based on the active tab
  const showNoteList = !isMobile || mobilePanel === 'notes'
  const showEditor   = !isMobile || mobilePanel === 'editor'
  const showPreview  = !isMobile || mobilePanel === 'preview'

  return (
    <div className={css.shell}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      {!isMobile && <Sidebar onSettingsOpen={() => setSettingsOpen(true)} />}

      <div className={css.center}>
        {/* Note list panel */}
        {showNoteList && <NoteList />}

        {/* Main editing area — hidden on mobile when note-list is shown */}
        {(showEditor || showPreview) && (
          <div className={css.main}>
            <Toolbar
              onTemplateOpen={() => setTemplateOpen(true)}
              onExportOpen={() => setExportOpen(true)}
              onAttachOpen={() => setAttachOpen(a => !a)}
            />

            <div className={css.workspace} data-view={viewMode}>
              {viewMode === 'structured' && (
                selectedNote
                  ? <StructuredEditorPane note={selectedNote} />
                  : <Empty />
              )}

              {(viewMode === 'edit' || viewMode === 'split') && showEditor && (
                <div className={css.editorPane}>
                  <div className={css.editorFlex}>
                    {selectedNote ? (
                      <NoteEditor note={selectedNote} />
                    ) : (
                      <Empty />
                    )}
                    {attachOpen && selectedNote && (
                      <AttachmentPanel noteId={selectedNote.id} onClose={() => setAttachOpen(false)} />
                    )}
                  </div>
                </div>
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (showPreview || viewMode === 'split') && (
                <div className={css.previewPane}>
                  <PreviewPane note={selectedNote} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        activePanel={mobilePanel}
        onSelect={handleMobilePanel}
      />

      <TemplatePickerModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={handleTemplateSelect}
      />
      {selectedNote && (
        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          noteId={selectedNote.id}
        />
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

function Empty() {
  return (
    <div className={css.empty}>
      <p>Select a note or create a new one.</p>
    </div>
  )
}
