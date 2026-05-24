import { useState } from 'react'
import { CATALOG } from '@/core/registry/catalog'
import { buildFunctionCallBlock } from '@/core/ir/builders'
import { useDocumentStore } from '@/features/document/store'
import { scheduleCompile } from '@/features/preview/orchestrator'
import type { FunctionCategory, FunctionRegistryItem } from '@/core/registry/types'
import styles from './BlockLibraryPanel.module.css'

const CATEGORIES: FunctionCategory[] = [
  'document', 'text', 'layout', 'media', 'references',
  'tables', 'diagrams', 'math', 'variables', 'logic',
  'slides', 'themes', 'advanced',
]

export function BlockLibraryPanel() {
  const [query, setQuery] = useState('')
  const { appendBlock, document } = useDocumentStore()

  const filtered = query
    ? CATALOG.filter(
        (item) =>
          item.displayName.toLowerCase().includes(query.toLowerCase()) ||
          item.intentTags.some((t) => t.includes(query.toLowerCase())),
      )
    : CATALOG

  function insertItem(item: FunctionRegistryItem) {
    if (item.placement === 'document-meta') return
    const block = buildFunctionCallBlock(item.canonicalName, { registryId: item.id })
    appendBlock(block)
    scheduleCompile({ ...document, blocks: [...document.blocks, block] })
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className={styles.panel}>
      <div className={styles.search}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blocks…"
        />
      </div>
      <div className={styles.list}>
        {grouped.map(({ category, items }) => (
          <div key={category} className={styles.group}>
            <div className={styles.groupLabel}>{category}</div>
            {items.map((item) => (
              <button
                key={item.id}
                className={styles.item}
                onClick={() => insertItem(item)}
                disabled={item.placement === 'document-meta'}
                title={item.description}
              >
                <span className={styles.itemName}>.{item.canonicalName}</span>
                <span className={styles.itemLabel}>{item.displayName}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
