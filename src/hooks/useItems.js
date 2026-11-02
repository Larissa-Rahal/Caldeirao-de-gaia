import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { STATUS_CYCLE } from '@/lib/defaults'

const ITEM_SELECT =
  '*, product:products(*), category:categories(id, name, emoji), updater:profiles!items_updated_by_fkey(id, full_name)'

/**
 * Garante que o produto existe na tabela `products`.
 * Reutiliza pelo barcode se fornecido; caso contrário cria sempre novo.
 * Retorna o product_id.
 */
async function upsertProduct({ name, brand, barcode, defaultUnit, imageUrl, userId }) {
  if (barcode?.trim()) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('barcode', barcode.trim())
      .maybeSingle()

    if (existing) return existing.id

    const { data, error } = await supabase
      .from('products')
      .insert({
        name:         name.trim(),
        brand:        brand?.trim()   || null,
        barcode:      barcode.trim(),
        default_unit: defaultUnit     || 'un',
        image_url:    imageUrl        || null,
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
      name:         name.trim(),
      brand:        brand?.trim()     || null,
      barcode:      null,
      default_unit: defaultUnit       || 'un',
      image_url:    imageUrl          || null,
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
    setItems(data ?? [])
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
              setItems(prev =>
                prev.find(i => i.id === data.id)
                  ? prev
                  : [...prev, data].sort((a, b) =>
                      (a.product?.name ?? '').localeCompare(b.product?.name ?? ''))
              )
            }
            return
          }

          if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(i => {
              if (i.id !== payload.new.id) return i
              return { ...i, ...payload.new, product: i.product, category: i.category, updater: i.updater }
            }))
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
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...localChanges } : i))
    pendingRef.current.add(itemId)
    return serverUpdate()
      .catch(err => { fetchItems(); throw err })
      .finally(() => setTimeout(() => pendingRef.current.delete(itemId), 2000))
  }

  /**
   * Adiciona um novo item ao estoque.
   *   name, brand, barcode, defaultUnit — upsert em products
   *   categoryId, notes, imageUrl       — metadados do item
   *   quantity: { value, unit }         — qty_value / qty_unit
   */
  async function addItem({ name, brand, barcode, defaultUnit, categoryId, notes, imageUrl, quantity }) {
    const productId = await upsertProduct({
      name, brand, barcode,
      defaultUnit: defaultUnit || quantity?.unit || 'un',
      imageUrl,
      userId: user.id,
    })

    const { data, error: err } = await supabase
      .from('items')
      .insert({
        house_id:    activeHouse.id,
        product_id:  productId,
        category_id: categoryId ?? null,
        notes:       notes?.trim() ?? null,
        image_url:   imageUrl     ?? null,
        qty_value:   quantity?.value ?? null,
        qty_unit:    quantity?.unit  ?? defaultUnit ?? 'un',
        status:      'in_stock',
        created_by:  user.id,
        updated_by:  user.id,
      })
      .select(ITEM_SELECT)
      .single()
    if (err) throw err

    setItems(prev => [...prev, data].sort((a, b) =>
      (a.product?.name ?? '').localeCompare(b.product?.name ?? '')))
    pendingRef.current.add(data.id)
    setTimeout(() => pendingRef.current.delete(data.id), 2000)
    return data
  }

  /**
   * Edita um item existente.
   * Se nome/marca/barcode mudou, faz upsert num novo product.
   * Parâmetros: mesmos de addItem + itemId obrigatório.
   */
  async function updateItem(itemId, { name, brand, barcode, defaultUnit, categoryId, notes, imageUrl, quantity }) {
    const item = items.find(i => i.id === itemId)
    if (!item) throw new Error('Item não encontrado')

    let productId = item.product_id

    const nameChanged    = name    != null && name.trim()    !== (item.product?.name    ?? '')
    const brandChanged   = brand   != null && brand.trim()   !== (item.product?.brand   ?? '')
    const barcodeChanged = barcode != null && barcode.trim() !== (item.product?.barcode ?? '')

    if (nameChanged || brandChanged || barcodeChanged) {
      productId = await upsertProduct({
        name:        name        ?? item.product?.name,
        brand:       brand       ?? item.product?.brand,
        barcode:     barcode     ?? item.product?.barcode,
        defaultUnit: defaultUnit ?? item.product?.default_unit,
        imageUrl:    imageUrl    ?? item.product?.image_url,
        userId:      user.id,
      })
    }

    const { data, error: err } = await supabase
      .from('items')
      .update({
        product_id:  productId,
        category_id: categoryId !== undefined ? (categoryId || null) : item.category_id,
        notes:       notes      !== undefined ? (notes?.trim()   || null) : item.notes,
        image_url:   imageUrl   !== undefined ? (imageUrl        || null) : item.image_url,
        qty_value:   quantity   !== undefined ? (quantity?.value ?? null) : item.qty_value,
        qty_unit:    quantity   !== undefined ? (quantity?.unit  ?? null) : item.qty_unit,
        updated_by:  user.id,
      })
      .eq('id', itemId)
      .select(ITEM_SELECT)
      .single()
    if (err) throw err

    pendingRef.current.add(itemId)
    setItems(prev => prev.map(i => i.id === itemId ? data : i)
      .sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? '')))
    setTimeout(() => pendingRef.current.delete(itemId), 2000)
    return data
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

  function adjustQuantity(itemId, delta) {
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

  function updateQuantityValue(itemId, value) {
    return optimisticUpdate(
      itemId,
      { qty_value: value, updated_by: user.id, updated_at: new Date().toISOString() },
      () => supabase.from('items')
        .update({ qty_value: value, updated_by: user.id })
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
    adjustQuantity, updateQuantityValue,
    refetch: fetchItems,
  }
}
