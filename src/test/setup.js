import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill de localStorage para Node 22+ com jsdom
const storageMap = new Map()
const localStorageMock = {
  getItem:    vi.fn(key => (storageMap.has(key) ? storageMap.get(key) : null)),
  setItem:    vi.fn((key, val) => storageMap.set(key, String(val))),
  removeItem: vi.fn(key => storageMap.delete(key)),
  clear:      vi.fn(() => storageMap.clear()),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })
}

export function createQueryBuilderMock(defaultResult = { data: [], error: null }) {
  const builder = {
    select:      vi.fn(() => builder),
    insert:      vi.fn(() => builder),
    update:      vi.fn(() => builder),
    upsert:      vi.fn(() => builder),
    delete:      vi.fn(() => builder),
    eq:          vi.fn(() => builder),
    neq:         vi.fn(() => builder),
    is:          vi.fn(() => builder),
    in:          vi.fn(() => builder),
    ilike:       vi.fn(() => builder),
    lt:          vi.fn(() => builder),
    gt:          vi.fn(() => builder),
    order:       vi.fn(() => builder),
    range:       vi.fn(() => builder),
    limit:       vi.fn(() => builder),
    single:      vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then:        (onFulfilled, onRejected) =>
      Promise.resolve(defaultResult).then(onFulfilled, onRejected),
  }
  return builder
}

export const supabaseMock = {
  from: vi.fn(() => createQueryBuilderMock()),
  rpc:  vi.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getSession:         vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser:            vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange:  vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signUp:             vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut:            vi.fn(() => Promise.resolve({ error: null })),
  },
  storage: {
    from: vi.fn(() => ({
      upload:       vi.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
      remove:       vi.fn(() => Promise.resolve({ data: [], error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock.jpg' } })),
    })),
  },
  channel: vi.fn(() => ({
    on:        vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: supabaseMock,
}))
