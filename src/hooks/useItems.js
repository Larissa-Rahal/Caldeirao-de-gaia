import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { STATUS_CYCLE } from '@/lib/defaults'

export function useItems() {
  const { user } = useAuth()
  const { activeHouse } = useHouse()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const channelRef = useRef(null)

  const fetchItems = useCallback(async () => {
    if (!activeHouse) { setItems([]); setLoading(false); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('items')
      .select('*, categories(id, name, emoji), profiles!items_updated_by_fkey(id, full_name)')
      .eq('house_id', activeHouse.id)
      .order('name')
    if (err) { setError(err.message); setLoading(false); return }
    setItems(data ?? [])
    setError(null)
    setLoading(false)
  }, [activeHouse])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    if (!activeHouse) return

    // Limpa canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channelName = `items:${activeHouse.id}:${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `house_id=eq.${activeHouse.id}` },
        (payload) => {
          // Para todos os eventos faz refetch — mais simples e fiável
          // O deleteItem já atualiza o estado local imediatamente
          fetchItems()
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

  async function addItem({ name, categoryId, notes, imageUrl, quantity }) {
    const { data, error: err } = await supabase
      .from('items')
      .insert({
        house_id:    activeHouse.id,
        category_id: categoryId ?? null,
        name:        name.trim(),
        notes:       notes?.trim() ?? null,
        image_url:   imageUrl ?? null,
        qty_value:   quantity?.value ?? null,
        qty_unit:    quantity?.unit  ?? null,
        status:      'in_stock',
        created_by:  user.id,
        updated_by:  user.id,
      })
      .select()
      .single()
    if (err) throw err
    return data
  }

  async function cycleStatus(itemId, currentStatus) {
    const next = STATUS_CYCLE[currentStatus]
    const { error: err } = await supabase
      .from('items')
      .update({ status: next, updated_by: user.id })
      .eq('id', itemId)
    if (err) throw err
  }

  async function setStatus(itemId, status) {
    const { error: err } = await supabase
      .from('items')
      .update({ status, updated_by: user.id })
      .eq('id', itemId)
    if (err) throw err
  }

  /** Incrementa ou decrementa qty_value de um item unitário */
  async function adjustQuantity(itemId, delta) {
    // Atualização optimista local
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i
      const newVal = Math.max(0, (Number(i.qty_value) || 0) + delta)
      // Auto-status: 0 → em falta, 1 → acabando, 2+ → em estoque
      const newStatus = newVal === 0 ? 'out_of_stock' : newVal === 1 ? 'running_low' : 'in_stock'
      return { ...i, qty_value: newVal, status: newStatus }
    }))

    const item = items.find(i => i.id === itemId)
    if (!item) return

    const newVal    = Math.max(0, (Number(item.qty_value) || 0) + delta)
    const newStatus = newVal === 0 ? 'out_of_stock' : newVal === 1 ? 'running_low' : 'in_stock'

    const { error: err } = await supabase
      .from('items')
      .update({ qty_value: newVal, status: newStatus, updated_by: user.id })
      .eq('id', itemId)
    if (err) { fetchItems(); throw err }   // reverte se falhar
  }

  /** Actualiza qty_value directamente (para peso/volume) */
  async function updateQuantityValue(itemId, value) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, qty_value: value } : i))
    const { error: err } = await supabase
      .from('items')
      .update({ qty_value: value, updated_by: user.id })
      .eq('id', itemId)
    if (err) { fetchItems(); throw err }
  }

  async function updateItem(itemId, updates) {
    const { data, error: err } = await supabase
      .from('items')
      .update({ ...updates, updated_by: user.id })
      .eq('id', itemId)
      .select()
      .single()
    if (err) throw err
    return data
  }

  async function deleteItem(itemId) {
    const { error: err } = await supabase.from('items').delete().eq('id', itemId)
    if (err) throw err
    // Atualiza o estado local imediatamente — não depende do Realtime para DELETE
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const itemsByCategory = items.reduce((acc, item) => {
    const key = item.category_id ?? '__none__'
    if (!acc[key]) acc[key] = { category: item.categories, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  return {
    items, itemsByCategory, loading, error,
    addItem, cycleStatus, setStatus, updateItem, deleteItem,
    adjustQuantity, updateQuantityValue,
    refetch: fetchItems
  }
}
