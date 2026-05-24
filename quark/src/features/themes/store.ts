import { create } from 'zustand'
import type { AppTheme } from '../../core/types'

const STORAGE_KEY = 'quark-theme'

interface ThemesState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

/** Display metadata for all available themes, in the order they appear in the picker. */
export const THEMES: { id: AppTheme; label: string }[] = [
  { id: 'warm-paper',   label: 'Warm Paper' },
  { id: 'red-graphite', label: 'Red Graphite' },
  { id: 'toothpaste',   label: 'Toothpaste' },
  { id: 'solarized',    label: 'Solarized' },
  { id: 'bear-dark',    label: 'Bear Dark' },
]

/**
 * Global theme store.
 *
 * Persists the selected theme to `localStorage` and applies it immediately by
 * writing to `document.documentElement.dataset.theme`.  The default theme
 * "warm-paper" is expressed by an empty string so that the base `tokens.css`
 * properties remain in effect without any `[data-theme]` override.
 */
export const useThemesStore = create<ThemesState>((set) => ({
  theme: (localStorage.getItem(STORAGE_KEY) as AppTheme) ?? 'warm-paper',

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme === 'warm-paper' ? '' : theme
    set({ theme })
  },
}))

// Apply the persisted theme synchronously on module load so there is no flash
// of the default theme when the app boots with a non-default selection.
const savedTheme = localStorage.getItem(STORAGE_KEY) as AppTheme | null
if (savedTheme && savedTheme !== 'warm-paper') {
  document.documentElement.dataset.theme = savedTheme
}
