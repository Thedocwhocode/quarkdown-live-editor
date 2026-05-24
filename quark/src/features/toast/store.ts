import { create } from 'zustand'

export type ToastKind = 'info' | 'success' | 'error' | 'warning'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  action?: { label: string; onClick: () => void }
  durationMs?: number
}

interface ToastState {
  toasts: Toast[]
  show(toast: Omit<Toast, 'id'>): string
  dismiss(id: string): void
}

let seq = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show(toast) {
    const id = `t-${++seq}`
    const duration = toast.durationMs ?? (toast.kind === 'error' ? 6000 : 3500)
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => get().dismiss(id), duration)
    return id
  },

  dismiss(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

/** Convenience helpers */
export const toast = {
  info:    (msg: string, action?: Toast['action']) => useToastStore.getState().show({ kind: 'info', message: msg, action }),
  success: (msg: string, action?: Toast['action']) => useToastStore.getState().show({ kind: 'success', message: msg, action }),
  error:   (msg: string, action?: Toast['action']) => useToastStore.getState().show({ kind: 'error', message: msg, action }),
  warning: (msg: string, action?: Toast['action']) => useToastStore.getState().show({ kind: 'warning', message: msg, action }),
}
