import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useActivityLog } from '@/hooks/useActivityLog'
import { supabase } from '@/lib/supabase'
import { useHouse } from '@/contexts/HouseContext'
import { createQueryBuilderMock } from '@/test/setup'

vi.mock('@/contexts/HouseContext', () => ({
  useHouse: vi.fn(),
}))

describe('src/hooks/useActivityLog.js', () => {
  const mockHouse = { id: 'house-123', name: 'Casa Rahal' }

  beforeEach(() => {
    vi.clearAllMocks()
    useHouse.mockReturnValue({ activeHouse: mockHouse })
  })

  it('retorna entries vazio e loading false quando não há casa ativa', async () => {
    useHouse.mockReturnValue({ activeHouse: null })

    const { result } = renderHook(() => useActivityLog())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.entries).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })

  it('busca registros da tabela activity_log e expõe ACTION_CONFIG e STATUS_LABELS', async () => {
    const mockEntries = [
      {
        id: 'log-1',
        house_id: 'house-123',
        action: 'item_added',
        item_name: 'Arroz',
        created_at: '2026-11-02T15:00:00Z',
        user: { id: 'u1', full_name: 'Larissa', email: 'lala@test.com' },
      },
    ]

    const builder = createQueryBuilderMock({ data: mockEntries, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useActivityLog())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('activity_log')
    expect(builder.eq).toHaveBeenCalledWith('house_id', 'house-123')
    expect(builder.range).toHaveBeenCalledWith(0, 29)
    expect(result.current.entries).toEqual(mockEntries)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.ACTION_CONFIG.item_added.label).toBe('adicionou')
    expect(result.current.STATUS_LABELS.in_stock).toContain('Em Estoque')
  })

  it('habilita paginação (hasMore = true) quando retorna 30 itens e carrega mais com loadMore()', async () => {
    const page0 = Array.from({ length: 30 }, (_, i) => ({
      id: `log-${i}`,
      house_id: 'house-123',
      action: 'item_updated',
      item_name: `Item ${i}`,
    }))
    const page1 = [
      { id: 'log-30', house_id: 'house-123', action: 'item_deleted', item_name: 'Item 30' },
    ]

    const builderPage0 = createQueryBuilderMock({ data: page0, error: null })
    const builderPage1 = createQueryBuilderMock({ data: page1, error: null })

    supabase.from
      .mockReturnValueOnce(builderPage0)
      .mockReturnValueOnce(builderPage1)

    const { result } = renderHook(() => useActivityLog())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.entries).toHaveLength(30)
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(31)
    })

    expect(builderPage1.range).toHaveBeenCalledWith(30, 59)
    expect(result.current.hasMore).toBe(false)
  })
})
