import '@testing-library/jest-dom'

// Mock environment variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3001/api',
    MODE: 'test',
  },
  writable: true,
})

// Global test setup
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Import vi from vitest for mocking
import { vi } from 'vitest'

// Mock window.matchMedia (using vi instead of jest for Vitest)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})