import CATALOG from './catalog'
import type { FunctionCategory, FunctionRegistryItem } from './types'

export { CATALOG }
export type { FunctionRegistryItem, FunctionParamSchema, FunctionCategory } from './types'

/** Look up a registry entry by its canonical function name. */
export function lookupByName(name: string): FunctionRegistryItem | undefined {
  return CATALOG.find((item) => item.canonicalName === name)
}

/** Look up a registry entry by its id. */
export function lookupById(id: string): FunctionRegistryItem | undefined {
  return CATALOG.find((item) => item.id === id)
}

/** All entries in a given category. */
export function byCategory(category: FunctionCategory): FunctionRegistryItem[] {
  return CATALOG.filter((item) => item.category === category)
}

/** Search entries by intent tags or display name (case-insensitive prefix). */
export function search(query: string): FunctionRegistryItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return CATALOG
  return CATALOG.filter(
    (item) =>
      item.canonicalName.includes(q) ||
      item.displayName.toLowerCase().includes(q) ||
      item.intentTags.some((t) => t.includes(q)),
  )
}
