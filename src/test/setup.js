import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpa o DOM após cada teste
afterEach(() => cleanup())

// Mock global do matchMedia (não existe em jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock do navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
})

// Silencia os console.error do React em testes (erros esperados nos testes de falha)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('ReactDOM.render'))
    ) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
