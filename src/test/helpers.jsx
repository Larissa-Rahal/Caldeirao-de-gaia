/**
 * Helpers para testes: wrappers de contexto, factories de dados, etc.
 */
import { render } from '@testing-library/react'
import { vi } from 'vitest'

// ── Factories de dados de teste ───────────────────────────

export function makeUser(overrides = {}) {
  return {
    id:    'user-1',
    email: 'teste@exemplo.com',
    user_metadata: { full_name: 'Utilizador Teste' },
    ...overrides,
  }
}

export function makeProfile(overrides = {}) {
  return {
    id:        'user-1',
    email:     'teste@exemplo.com',
    full_name: 'Utilizador Teste',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeHouse(overrides = {}) {
  return {
    id:          'house-1',
    name:        'Casa Teste',
    invite_code: 'ABC123',
    owner_id:    'user-1',
    myRole:      'owner',
    created_at:  '2024-01-01T00:00:00Z',
    updated_at:  '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeCategory(overrides = {}) {
  return {
    id:         'cat-1',
    house_id:   'house-1',
    name:       'Mercearia',
    emoji:      '🛒',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeItem(overrides = {}) {
  return {
    id:          'item-1',
    house_id:    'house-1',
    category_id: 'cat-1',
    name:        'Leite',
    status:      'in_stock',
    notes:       null,
    updated_by:  'user-1',
    created_by:  'user-1',
    created_at:  '2024-01-01T00:00:00Z',
    updated_at:  '2024-01-01T00:00:00Z',
    categories:  { id: 'cat-1', name: 'Mercearia', emoji: '🛒' },
    profiles:    { id: 'user-1', full_name: 'Utilizador Teste' },
    ...overrides,
  }
}

export function makeMember(overrides = {}) {
  return {
    id:        'member-1',
    house_id:  'house-1',
    user_id:   'user-1',
    role:      'owner',
    joined_at: '2024-01-01T00:00:00Z',
    profiles:  makeProfile(),
    ...overrides,
  }
}

// ── Mocks de contexto ─────────────────────────────────────

export function makeAuthContext(overrides = {}) {
  return {
    user:          makeUser(),
    profile:       makeProfile(),
    loading:       false,
    signIn:        vi.fn().mockResolvedValue({}),
    signUp:        vi.fn().mockResolvedValue({}),
    signOut:       vi.fn().mockResolvedValue({}),
    updateProfile: vi.fn().mockResolvedValue(makeProfile()),
    ...overrides,
  }
}

export function makeHouseContext(overrides = {}) {
  return {
    houses:                [makeHouse()],
    activeHouse:           makeHouse(),
    members:               [makeMember()],
    loading:               false,
    setActiveHouse:        vi.fn(),
    createHouse:           vi.fn().mockResolvedValue(makeHouse()),
    joinHouse:             vi.fn().mockResolvedValue({ house_id: 'house-1', already_member: false }),
    updateHouseName:       vi.fn().mockResolvedValue(makeHouse()),
    regenerateInviteCode:  vi.fn().mockResolvedValue('XYZ789'),
    removeMember:          vi.fn().mockResolvedValue(undefined),
    refetchHouses:         vi.fn(),
    ...overrides,
  }
}

// ── Render com providers mockados ─────────────────────────

import { AuthContext }  from '@/contexts/AuthContext'
import { HouseContext } from '@/contexts/HouseContext'

export function renderWithProviders(
  ui,
  { authCtx = makeAuthContext(), houseCtx = makeHouseContext() } = {}
) {
  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={authCtx}>
        <HouseContext.Provider value={houseCtx}>
          {children}
        </HouseContext.Provider>
      </AuthContext.Provider>
    )
  }
  return render(ui, { wrapper: Wrapper })
}
