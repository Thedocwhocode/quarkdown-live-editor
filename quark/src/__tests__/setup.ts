import '@testing-library/jest-dom'

// Mock the entire @tauri-apps/api/core module so tests run without Tauri context.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))
