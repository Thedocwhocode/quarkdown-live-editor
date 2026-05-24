/**
 * Runtime platform detection.
 *
 * Uses the Tauri OS plugin when available (desktop / mobile app).
 * Falls back to navigator.userAgent for browser contexts (tests, web build).
 */

export type Platform = 'android' | 'ios' | 'desktop'

let _cached: Platform | null = null

export async function getPlatform(): Promise<Platform> {
  if (_cached) return _cached

  try {
    // Dynamic import so the build doesn't break in test/browser envs
    const { platform } = await import('@tauri-apps/plugin-os')
    const os = await platform()
    if (os === 'android') _cached = 'android'
    else if (os === 'ios') _cached = 'ios'
    else _cached = 'desktop'
  } catch {
    // Not running inside Tauri (browser / unit test)
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) _cached = 'android'
    else if (/iphone|ipad|ipod/.test(ua)) _cached = 'ios'
    else _cached = 'desktop'
  }

  return _cached
}

export function isMobilePlatform(p: Platform): p is 'android' | 'ios' {
  return p === 'android' || p === 'ios'
}
