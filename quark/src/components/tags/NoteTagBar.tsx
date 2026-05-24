import { useEffect, useRef, useState } from 'react'
import { useTagsStore } from '../../features/tags/store'
import { TagChip } from './TagChip'
import css from './NoteTagBar.module.css'

interface Props {
  noteId: string
  editable?: boolean
}

export function NoteTagBar({ noteId, editable = false }: Props) {
  const noteTags = useTagsStore(s => s.noteTags[noteId] ?? [])
  const loadNoteTags = useTagsStore(s => s.loadNoteTags)
  const addTagToNote = useTagsStore(s => s.addTagToNote)
  const removeTagFromNote = useTagsStore(s => s.removeTagFromNote)

  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadNoteTags(noteId)
  }, [noteId, loadNoteTags])

  const commitTag = () => {
    const name = inputValue.replace(/^#/, '').replace(/,$/, '').trim()
    if (name) {
      addTagToNote(noteId, name)
    }
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.endsWith(',')) {
      setInputValue(val.slice(0, -1))
      commitTag()
    } else {
      setInputValue(val)
    }
  }

  return (
    <div className={css.bar}>
      {noteTags.map(tag => (
        <TagChip
          key={tag.id}
          tag={tag}
          onRemove={editable ? () => removeTagFromNote(noteId, tag.id) : undefined}
        />
      ))}
      {editable && (
        <input
          ref={inputRef}
          className={css.input}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="#add tag"
          aria-label="Add tag"
        />
      )}
    </div>
  )
}
