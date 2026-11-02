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
          if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id))
          } else {
            fetchItems()
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

  async function addItem({ name, categoryId, notes }) {
    const { data, error: err } = await supabase
      .from('items')
      .insert({
        house_id:    activeHouse.id,
        category_id: categoryId ?? null,
        name:        name.trim(),
        notes:       notes?.trim() ?? null,
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
    refetch: fetchItems
  }
}
