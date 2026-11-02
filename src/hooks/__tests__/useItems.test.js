import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useItems } from '@/hooks/useItems'
import { supabase } from '@/lib/supabase'
import { useHouse } from '@/contexts/HouseContext'
import { useAuth } from '@/contexts/AuthContext'
import { createQueryBuilderMock } from '@/test/setup'

vi.mock('@/contexts/HouseContext', () => ({
  useHouse: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('src/hooks/useItems.js', () => {
  const mockUser  = { id: 'user-1', email: 'lala@test.com' }
  const mockHouse = { id: 'house-1', name: 'Casa Rahal' }

  const sampleRawItem = {
    id:          'item-1',
    house_id:    'house-1',
    product_id:  'prod-1',
    category_id: 'cat-1',
    status:      'in_stock',
    qty_value:   2,
    qty_unit:    null,
    notes:       null,
    image_url:   null,
    product: {
      id:           'prod-1',
      name:         'Café Torrado',
      brand:        'Melitta',
      barcode:      '7891000',
      default_unit: 'pct',
      image_url:    null,
    },
    category: {
      id:    'cat-1',
      name:  'Mercearia',
      emoji: '🛒',
    },
    updater: {
      id:        'user-1',
      full_name: 'Larissa',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
    useHouse.mockReturnValue({ activeHouse: mockHouse })
  })

  it('retorna lista vazia quando não há activeHouse', async () => {
    useHouse.mockReturnValue({ activeHouse: null })

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.items).toEqual([])
  })

  it('lista itens da casa, normaliza campos de product e agrupa em itemsByCategory', async () => {
    const fetchBuilder = createQueryBuilderMock({ data: [sampleRawItem], error: null })
    supabase.from.mockReturnValue(fetchBuilder)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toHaveLength(1)
    const item = result.current.items[0]
    expect(item.name).toBe('Café Torrado')
    expect(item.brand).toBe('Melitta')
    expect(item.barcode).toBe('7891000')
    expect(item.default_unit).toBe('pct')
    // fallback de qty_unit para product.default_unit
    expect(item.qty_unit).toBe('pct')
    expect(result.current.itemsByCategory['cat-1'].items).toHaveLength(1)
  })

  it('normaliza itens com qty_value = 0 para out_of_stock e sincroniza quantidade ao mudar status ou valor', async () => {
    const zeroQtyInStockRow = {
      ...sampleRawItem,
      id:        'item-zero',
      qty_value: 0,
      qty_unit:  'L',
      status:    'in_stock',
    }
    const fetchBuilder  = createQueryBuilderMock({ data: [zeroQtyInStockRow], error: null })
    const updateBuilder = createQueryBuilderMock({ data: null, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(updateBuilder)
      .mockReturnValueOnce(updateBuilder)

    const { result } = renderHook(() => useItems())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Normalizado automaticamente para out_of_stock por ter qty_value = 0
    expect(result.current.items[0].status).toBe('out_of_stock')

    // Ao marcar como in_stock (ex: Modo Mercado), qty_value passa de 0 para 1
    await act(async () => {
      await result.current.setStatus('item-zero', 'in_stock')
    })
    expect(result.current.items[0].status).toBe('in_stock')
    expect(result.current.items[0].qty_value).toBe(1)

    // Ao zerar a quantidade manualmente (updateQtyValue), status volta para out_of_stock
    await act(async () => {
      await result.current.updateQtyValue('item-zero', 0)
    })
    expect(result.current.items[0].qty_value).toBe(0)
    expect(result.current.items[0].status).toBe('out_of_stock')
  })

  it('preenche estado error quando a listagem do Supabase falha', async () => {
    const fetchBuilder = createQueryBuilderMock({
      data:  null,
      error: { message: 'Falha ao consultar tabela items' },
    })
    supabase.from.mockReturnValue(fetchBuilder)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Falha ao consultar tabela items')
    expect(result.current.items).toEqual([])
  })

  it('adiciona um novo item criando/reutilizando registro em products e inserindo em items', async () => {
    const fetchBuilder = createQueryBuilderMock({ data: [], error: null })

    // 1. Consulta products por nome (não encontrou)
    const searchProductBuilder = createQueryBuilderMock()
    searchProductBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })

    // 2. Insere novo produto em products
    const insertProductBuilder = createQueryBuilderMock()
    insertProductBuilder.single.mockResolvedValue({ data: { id: 'prod-new' }, error: null })

    // 3. Insere item em items
    const insertedItemRow = {
      ...sampleRawItem,
      id:         'item-new',
      product_id: 'prod-new',
      qty_value:  1,
      qty_unit:   'kg',
      product: {
        id:           'prod-new',
        name:         'Arroz',
        brand:        'Camil',
        barcode:      null,
        default_unit: 'kg',
      },
    }
    const insertItemBuilder = createQueryBuilderMock()
    insertItemBuilder.single.mockResolvedValue({ data: insertedItemRow, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(searchProductBuilder)
      .mockReturnValueOnce(insertProductBuilder)
      .mockReturnValueOnce(insertItemBuilder)

    const { result } = renderHook(() => useItems())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addItem({
        name:        'Arroz',
        brand:       'Camil',
        barcode:     null,
        defaultUnit: 'kg',
        categoryId:  'cat-1',
        qty_value:   1,
        qty_unit:    'kg',
      })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('Arroz')
    expect(result.current.items[0].qty_value).toBe(1)
    expect(result.current.items[0].qty_unit).toBe('kg')
  })

  it('edita um item existente e atualiza o estado local', async () => {
    const fetchBuilder = createQueryBuilderMock({ data: [sampleRawItem], error: null })

    const updatedRow = {
      ...sampleRawItem,
      qty_value: 5,
      notes:     'Torra média',
    }
    const updateItemBuilder = createQueryBuilderMock()
    updateItemBuilder.single.mockResolvedValue({ data: updatedRow, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(updateItemBuilder)

    const { result } = renderHook(() => useItems())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateItem('item-1', {
        qty_value: 5,
        notes:     'Torra média',
      })
    })

    expect(result.current.items[0].qty_value).toBe(5)
    expect(result.current.items[0].notes).toBe('Torra média')
  })

  it('altera status (cycleStatus), ajusta quantidade (adjustQty / restockItem) e remove item (deleteItem)', async () => {
    const fetchBuilder  = createQueryBuilderMock({ data: [sampleRawItem], error: null })
    const updateBuilder = createQueryBuilderMock({ data: null, error: null })
    const deleteBuilder = createQueryBuilderMock({ data: null, error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder)
      .mockReturnValueOnce(updateBuilder) // cycleStatus
      .mockReturnValueOnce(updateBuilder) // adjustQty
      .mockReturnValueOnce(updateBuilder) // restockItem
      .mockReturnValueOnce(deleteBuilder) // deleteItem

    const { result } = renderHook(() => useItems())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // cycleStatus: in_stock -> running_low
    await act(async () => {
      await result.current.cycleStatus('item-1', 'in_stock')
    })
    expect(result.current.items[0].status).toBe('running_low')

    // adjustQty: 2 - 1 = 1
    await act(async () => {
      await result.current.adjustQty('item-1', -1)
    })
    expect(result.current.items[0].qty_value).toBe(1)

    // restockItem: 1 + 3 = 4 (status -> in_stock)
    await act(async () => {
      await result.current.restockItem('item-1', 3, 'pct')
    })
    expect(result.current.items[0].qty_value).toBe(4)
    expect(result.current.items[0].status).toBe('in_stock')

    // deleteItem
    await act(async () => {
      await result.current.deleteItem('item-1')
    })
    expect(result.current.items).toHaveLength(0)
  })

  it('faz rollback recarregando os itens caso uma atualização ou exclusão no Supabase retorne erro', async () => {
    const fetchBuilder1 = createQueryBuilderMock({ data: [sampleRawItem], error: null })
    const failedDelete  = createQueryBuilderMock({ data: null, error: new Error('Erro ao deletar') })
    const fetchBuilder2 = createQueryBuilderMock({ data: [sampleRawItem], error: null })

    supabase.from
      .mockReturnValueOnce(fetchBuilder1)
      .mockReturnValueOnce(failedDelete)
      .mockReturnValueOnce(fetchBuilder2)

    const { result } = renderHook(() => useItems())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.deleteItem('item-1')
      })
    ).rejects.toThrow('Erro ao deletar')

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1)
    })
  })
})
