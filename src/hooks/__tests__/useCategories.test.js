import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { useHouse } from '@/contexts/HouseContext'
import { createQueryBuilderMock } from '@/test/setup'

vi.mock('@/contexts/HouseContext', () => ({
  useHouse: vi.fn(),
}))

describe('src/hooks/useCategories.js', () => {
  const mockHouse = { id: 'house-123', name: 'Casa Rahal' }

  beforeEach(() => {
    vi.clearAllMocks()
    useHouse.mockReturnValue({ activeHouse: mockHouse })
  })

  it('retorna lista vazia quando não há activeHouse', async () => {
    useHouse.mockReturnValue({ activeHouse: null })

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.categories).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('lista categorias da casa ativa ordenadas por sort_order', async () => {
    const mockData = [
      { id: 'cat-1', house_id: 'house-123', name: 'Mercearia', emoji: '🛒', sort_order: 0 },
      { id: 'cat-2', house_id: 'house-123', name: 'Limpeza',   emoji: '🧹', sort_order: 1 },
    ]
    const builder = createQueryBuilderMock({ data: mockData, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('categories')
    expect(builder.eq).toHaveBeenCalledWith('house_id', 'house-123')
    expect(builder.order).toHaveBeenCalledWith('sort_order')
    expect(result.current.categories).toEqual(mockData)
  })

  it('adiciona uma nova categoria calculando o próximo sort_order', async () => {
    const initialCategories = [
      { id: 'cat-1', house_id: 'house-123', name: 'Mercearia', emoji: '🛒', sort_order: 2 },
    ]
    const createdCategory = {
      id: 'cat-2',
      house_id: 'house-123',
      name: 'Poções',
      emoji: '🧪',
      sort_order: 3,
    }

    const fetchBuilder  = createQueryBuilderMock({ data: initialCategories, error: null })
    const insertBuilder = createQueryBuilderMock()
    insertBuilder.single.mockResolvedValue({ data: createdCategory, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(insertBuilder)

    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let returned
    await act(async () => {
      returned = await result.current.addCategory({ name: '  Poções  ', emoji: '🧪' })
    })

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      house_id:   'house-123',
      name:       'Poções',
      emoji:      '🧪',
      sort_order: 3,
    })
    expect(returned).toEqual(createdCategory)
    expect(result.current.categories).toHaveLength(2)
    expect(result.current.categories[1]).toEqual(createdCategory)
  })

  it('edita e remove uma categoria existente', async () => {
    const initialCategories = [
      { id: 'cat-1', house_id: 'house-123', name: 'Mercearia', emoji: '🛒', sort_order: 0 },
      { id: 'cat-2', house_id: 'house-123', name: 'Limpeza',   emoji: '🧹', sort_order: 1 },
    ]
    const updatedCat = { ...initialCategories[0], name: 'Dispensa' }

    const fetchBuilder  = createQueryBuilderMock({ data: initialCategories, error: null })
    const updateBuilder = createQueryBuilderMock()
    updateBuilder.single.mockResolvedValue({ data: updatedCat, error: null })
    const deleteBuilder = createQueryBuilderMock({ data: null, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(deleteBuilder)

    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateCategory('cat-1', { name: 'Dispensa' })
    })
    expect(result.current.categories[0].name).toBe('Dispensa')

    await act(async () => {
      await result.current.deleteCategory('cat-2')
    })
    expect(result.current.categories).toHaveLength(1)
    expect(result.current.categories[0].id).toBe('cat-1')
  })

  it('propaga erro do Supabase ao falhar na adição ou exclusão', async () => {
    const fetchBuilder = createQueryBuilderMock({ data: [], error: null })
    const errorBuilder = createQueryBuilderMock()
    errorBuilder.single.mockResolvedValue({ data: null, error: new Error('Permissão negada') })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(errorBuilder)

    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.addCategory({ name: 'Teste', emoji: '📦' })
      })
    ).rejects.toThrow('Permissão negada')
  })
})
