import { useState } from 'react'
import { NoteEditor } from '../editor/NoteEditor'
import { PreviewPane } from '../preview/PreviewPane'
import { Toolbar } from '../toolbar/Toolbar'
import { NoteList } from './NoteList'
import { Sidebar } from './Sidebar'
import { TemplatePickerModal } from '../templates/TemplatePickerModal'
import { ExportModal } from '../export/ExportModal'
import { AttachmentPanel } from '../attachments/AttachmentPanel'
import { SettingsModal } from '../settings/SettingsModal'
import { useNotesStore } from '../../features/notes/store'
import css from './AppShell.module.css'

export function AppShell() {
  const viewMode    = useNotesStore(s => s.viewMode)
  const selectedNote = useNotesStore(s => s.selectedNote())
  const createNote  = useNotesStore(s => s.createNote)

  const [templateOpen, setTemplateOpen] = useState(false)
  const [exportOpen,   setExportOpen]   = useState(false)
  const [attachOpen,   setAttachOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleTemplateSelect = async (tpl: { name: string; sourceQdSeed: string }) => {
    await createNote(tpl.name, tpl.sourceQdSeed)
  }

  return (
    <div className={css.shell}>
      <Sidebar onSettingsOpen={() => setSettingsOpen(true)} />

      <div className={css.center}>
        <NoteList />

        <div className={css.main}>
          <Toolbar
            onTemplateOpen={() => setTemplateOpen(true)}
            onExportOpen={() => setExportOpen(true)}
            onAttachOpen={() => setAttachOpen(a => !a)}
          />

          <div className={css.workspace} data-view={viewMode}>
            {(viewMode === 'edit' || viewMode === 'split') && (
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
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={css.previewPane}>
                <PreviewPane note={selectedNote} />
              </div>
            )}
          </div>
        </div>
      </div>

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
