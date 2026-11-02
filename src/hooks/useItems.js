import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { STATUS_CYCLE } from '@/lib/defaults'

const ITEM_SELECT =
  '*, product:products(*), category:categories(*), updater:profiles!items_updated_by_fkey(id, full_name)'

/**
 * Normaliza os dados do item garantindo que `name`, `brand`, `barcode` e `default_unit`
 * estejam disponíveis a partir de `products` e que `qty_unit` tenha fallback para `product.default_unit`.
 */
function normalizeItem(row) {
  if (!row) return row
  const product     = row.product ?? {}
  const defaultUnit = product.default_unit ?? 'un'
  return {
    ...row,
    product: {
      ...product,
      name:         product.name         ?? '',
      brand:        product.brand        ?? null,
      barcode:      product.barcode      ?? null,
      default_unit: defaultUnit,
    },
    name:         product.name  ?? '',
    brand:        product.brand ?? null,
    barcode:      product.barcode ?? null,
    default_unit: defaultUnit,
    qty_unit:     row.qty_unit  || defaultUnit,
  }
}

/**
 * Garante que o produto existe na tabela `products`.
 * Reutiliza pelo barcode se fornecido; caso contrário cria ou atualiza o registo em `products`.
 * Retorna o product_id.
 */
export async function upsertProduct({ name, brand, barcode, defaultUnit, imageUrl, userId }) {
  const cleanName    = name?.trim()    || ''
  const cleanBrand   = brand?.trim()   || null
  const cleanBarcode = barcode?.trim() || null
  const cleanUnit    = defaultUnit     || 'un'
  const cleanImage   = imageUrl        || null

  if (cleanBarcode) {
    const { data: existing } = await supabase
      .from('products')
      .select('id, name, brand, default_unit, image_url, created_by')
      .eq('barcode', cleanBarcode)
      .maybeSingle()

    if (existing) {
      if (existing.created_by === userId) {
        const updates = {
          name:         cleanName  || existing.name,
          brand:        cleanBrand ?? existing.brand,
          default_unit: cleanUnit  || existing.default_unit || 'un',
          image_url:    cleanImage ?? existing.image_url,
        }
        await supabase
          .from('products')
          .update(updates)
          .eq('id', existing.id)
      }
      return existing.id
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name:         cleanName,
        brand:        cleanBrand,
        barcode:      cleanBarcode,
        default_unit: cleanUnit,
        image_url:    cleanImage,
        created_by:   userId,
      })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      name:         cleanName,
      brand:        cleanBrand,
      barcode:      null,
      default_unit: cleanUnit,
      image_url:    cleanImage,
      created_by:   userId,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export function useItems() {
  const { user }        = useAuth()
  const { activeHouse } = useHouse()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const channelRef = useRef(null)
  const pendingRef = useRef(new Set())

  const fetchItems = useCallback(async () => {
    if (!activeHouse) { setItems([]); setLoading(false); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('items')
      .select(ITEM_SELECT)
      .eq('house_id', activeHouse.id)
      .order('created_at', { ascending: true })
    if (err) { setError(err.message); setLoading(false); return }
    const normalized = (data ?? [])
      .map(normalizeItem)
      .sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''))
    setItems(normalized)
    setError(null)
    setLoading(false)
  }, [activeHouse])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    if (!activeHouse) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`items:${activeHouse.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `house_id=eq.${activeHouse.id}` },
        async (payload) => {
          const id = payload.new?.id ?? payload.old?.id
          if (id && pendingRef.current.has(id)) return

          if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old?.id))
            return
          }

          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('items')
              .select(ITEM_SELECT)
              .eq('id', payload.new.id)
              .single()
            if (data) {
              const normalized = normalizeItem(data)
              setItems(prev =>
                prev.find(i => i.id === normalized.id)
                  ? prev
                  : [...prev, normalized].sort((a, b) =>
                      (a.product?.name ?? '').localeCompare(b.product?.name ?? ''))
              )
            }
            return
          }

          if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('items')
              .select(ITEM_SELECT)
              .eq('id', payload.new.id)
              .single()
            if (data) {
              const normalized = normalizeItem(data)
              setItems(prev => prev.map(i => i.id === normalized.id ? normalized : i)
                .sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? '')))
            } else {
              setItems(prev => prev.map(i => {
                if (i.id !== payload.new.id) return i
                return normalizeItem({ ...i, ...payload.new, product: i.product, category: i.category, updater: i.updater })
              }))
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouse?.id])

  function optimisticUpdate(itemId, localChanges, serverUpdate) {
    setItems(prev => prev.map(i => i.id === itemId ? normalizeItem({ ...i, ...localChanges }) : i))
    pendingRef.current.add(itemId)
    return serverUpdate()
      .catch(err => { fetchItems(); throw err })
      .finally(() => setTimeout(() => pendingRef.current.delete(itemId), 2000))
  }

  /**
   * Adiciona um novo item ao estoque.
   *   name, brand, barcode, defaultUnit — upsert em products
   *   categoryId, notes, imageUrl       — metadados do item
   *   qty_value, qty_unit               — quantidade tipada (com fallback para default_unit)
   */
  async function addItem({ name, brand, barcode, defaultUnit, categoryId, notes, imageUrl, qty_value, qty_unit }) {
    const resolvedDefaultUnit = defaultUnit || qty_unit || 'un'
    const productId = await upsertProduct({
      name,
      brand,
      barcode,
      defaultUnit: resolvedDefaultUnit,
      imageUrl,
      userId: user.id,
    })

    const { data, error: err } = await supabase
      .from('items')
      .insert({
        house_id:    activeHouse.id,
        product_id:  productId,
        category_id: categoryId    || null,
        notes:       notes?.trim() || null,
        image_url:   imageUrl      || null,
        qty_value:   qty_value != null && qty_value !== '' ? Number(qty_value) : null,
        qty_unit:    qty_unit      || resolvedDefaultUnit,
        status:      'in_stock',
        created_by:  user.id,
        updated_by:  user.id,
      })
      .select(ITEM_SELECT)
      .single()
    if (err) throw err

    const normalized = normalizeItem(data)
    setItems(prev => [...prev, normalized].sort((a, b) =>
      (a.product?.name ?? '').localeCompare(b.product?.name ?? '')))
    pendingRef.current.add(normalized.id)
    setTimeout(() => pendingRef.current.delete(normalized.id), 2000)
    return normalized
  }

  /**
   * Edita um item existente.
   * Se nome/marca/barcode/default_unit mudou, faz upsert em products e vincula o product_id.
   */
  async function updateItem(itemId, { name, brand, barcode, defaultUnit, categoryId, notes, imageUrl, qty_value, qty_unit }) {
    const item = items.find(i => i.id === itemId)
    if (!item) throw new Error('Item não encontrado')

    let productId = item.product_id

    const nameChanged    = name        !== undefined && (name?.trim()    || '') !== (item.product?.name         ?? '')
    const brandChanged   = brand       !== undefined && (brand?.trim()   || '') !== (item.product?.brand        ?? '')
    const barcodeChanged = barcode     !== undefined && (barcode?.trim() || '') !== (item.product?.barcode      ?? '')
    const unitChanged    = defaultUnit !== undefined && (defaultUnit     || 'un') !== (item.product?.default_unit ?? 'un')

    if (nameChanged || brandChanged || barcodeChanged || unitChanged) {
      productId = await upsertProduct({
        name:        name        !== undefined ? name        : item.product?.name,
        brand:       brand       !== undefined ? brand       : item.product?.brand,
        barcode:     barcode     !== undefined ? barcode     : item.product?.barcode,
        defaultUnit: defaultUnit !== undefined ? defaultUnit : (qty_unit || item.product?.default_unit || 'un'),
        imageUrl:    imageUrl    !== undefined ? imageUrl    : item.product?.image_url,
        userId:      user.id,
      })
    }

    const resolvedQtyUnit = qty_unit !== undefined
      ? (qty_unit || defaultUnit || item.product?.default_unit || 'un')
      : (item.qty_unit || item.product?.default_unit || 'un')

    const { data, error: err } = await supabase
      .from('items')
      .update({
        product_id:  productId,
        category_id: categoryId !== undefined ? (categoryId || null)    : item.category_id,
        notes:       notes      !== undefined ? (notes?.trim() || null) : item.notes,
        image_url:   imageUrl   !== undefined ? (imageUrl || null)      : item.image_url,
        qty_value:   qty_value  !== undefined
          ? (qty_value != null && qty_value !== '' ? Number(qty_value) : null)
          : item.qty_value,
        qty_unit:    resolvedQtyUnit,
        updated_by:  user.id,
      })
      .eq('id', itemId)
      .select(ITEM_SELECT)
      .single()
    if (err) throw err

    const normalized = normalizeItem(data)
    pendingRef.current.add(itemId)
    setItems(prev => prev.map(i => i.id === itemId ? normalized : i)
      .sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? '')))
    setTimeout(() => pendingRef.current.delete(itemId), 2000)
    return normalized
  }

  function cycleStatus(itemId, currentStatus) {
    const next = STATUS_CYCLE[currentStatus]
    const localChanges  = { status: next, updated_by: user.id, updated_at: new Date().toISOString(),
      ...(next === 'out_of_stock' ? { qty_value: null } : {}) }
    const serverChanges = { status: next, updated_by: user.id,
      ...(next === 'out_of_stock' ? { qty_value: null } : {}) }
    return optimisticUpdate(itemId, localChanges,
      () => supabase.from('items').update(serverChanges).eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err }))
  }

  function setStatus(itemId, status) {
    const localChanges  = { status, updated_by: user.id, updated_at: new Date().toISOString(),
      ...(status === 'out_of_stock' ? { qty_value: null } : {}) }
    const serverChanges = { status, updated_by: user.id,
      ...(status === 'out_of_stock' ? { qty_value: null } : {}) }
    return optimisticUpdate(itemId, localChanges,
      () => supabase.from('items').update(serverChanges).eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err }))
  }

  function adjustQty(itemId, delta) {
    const item = items.find(i => i.id === itemId)
    if (!item) return Promise.resolve()
    const newVal    = Math.max(0, (Number(item.qty_value) || 0) + delta)
    const newStatus = newVal === 0 ? 'out_of_stock' : newVal === 1 ? 'running_low' : 'in_stock'
    return optimisticUpdate(
      itemId,
      { qty_value: newVal, status: newStatus, updated_by: user.id, updated_at: new Date().toISOString() },
      () => supabase.from('items')
        .update({ qty_value: newVal, status: newStatus, updated_by: user.id })
        .eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err })
    )
  }

  function updateQtyValue(itemId, value) {
    return optimisticUpdate(
      itemId,
      { qty_value: value, updated_by: user.id, updated_at: new Date().toISOString() },
      () => supabase.from('items')
        .update({ qty_value: value, updated_by: user.id })
        .eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err })
    )
  }

  /**
   * Soma uma quantidade comprada (ex.: via leitura de Nota Fiscal) ao item existente
   * e marca o status como 'in_stock'.
   */
  function restockItem(itemId, addedQty, unit) {
    const item = items.find(i => i.id === itemId)
    if (!item) return Promise.resolve()
    const currentVal   = Number(item.qty_value) || 0
    const delta        = Math.max(0, Number(addedQty) || 1)
    const newVal       = Number((currentVal + delta).toFixed(3))
    const resolvedUnit = item.qty_unit || unit || item.product?.default_unit || 'un'
    return optimisticUpdate(
      itemId,
      {
        qty_value:  newVal,
        qty_unit:   resolvedUnit,
        status:     'in_stock',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      () => supabase.from('items')
        .update({
          qty_value:  newVal,
          qty_unit:   resolvedUnit,
          status:     'in_stock',
          updated_by: user.id,
        })
        .eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err })
    )
  }

  async function deleteItem(itemId) {
    setItems(prev => prev.filter(i => i.id !== itemId))
    pendingRef.current.add(itemId)
    const { error: err } = await supabase.from('items').delete().eq('id', itemId)
    if (err) { fetchItems(); throw err }
    setTimeout(() => pendingRef.current.delete(itemId), 2000)
  }

  const itemsByCategory = items.reduce((acc, item) => {
    const key = item.category_id ?? '__none__'
    if (!acc[key]) acc[key] = { category: item.category, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  return {
    items, itemsByCategory, loading, error,
    addItem, cycleStatus, setStatus, updateItem, deleteItem,
    adjustQty, updateQtyValue, restockItem,
    refetch: fetchItems,
  }
}
