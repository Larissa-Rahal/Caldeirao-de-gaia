/**
 * Mock completo do cliente Supabase.
 * Cada método retorna uma chain fluente (select, eq, single, etc.)
 * que pode ser sobrescrita em testes específicos via vi.mocked().
 */
import { vi } from 'vitest'

// Cria uma chain mockada que retorna a si mesma em cada chamada
function makeChain(finalResult = { data: null, error: null }) {
  const chain = {
    select:  vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    upsert:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    neq:     vi.fn().mockReturnThis(),
    in:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    limit:   vi.fn().mockReturnThis(),
    filter:  vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue(finalResult),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
    then:    undefined, // não é promise por defeito — resolve via .single()
  }
  // Torna a chain "thenable" (pode ser awaited diretamente)
  chain.then = (resolve) => Promise.resolve(finalResult).then(resolve)
  return chain
}

export const mockSupabaseChain = makeChain()

export const supabase = {
  from: vi.fn(() => mockSupabaseChain),
  rpc:  vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getSession:           vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword:   vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp:               vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut:              vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange:    vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  channel: vi.fn(() => ({
    on:        vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
}
