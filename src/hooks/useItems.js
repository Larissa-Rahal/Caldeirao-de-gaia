import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { STATUS_CYCLE } from '@/lib/defaults'

export function useItems() {
  const { user }        = useAuth()
  const { activeHouse } = useHouse()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const channelRef  = useRef(null)
  // Guarda os IDs das mutações próprias em curso para ignorar no Realtime
  const pendingRef  = useRef(new Set())

  // ── Fetch completo (só no carregamento inicial e troca de casa) ──
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

  // ── Realtime — merge cirúrgico sem refetch ───────────────────────
  useEffect(() => {
    if (!activeHouse) return

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
        async (payload) => {
          const id = payload.new?.id ?? payload.old?.id

          // Se é uma mutação que nós próprios fizemos, já actualizámos
          // o estado local de forma otimista — ignoramos o evento Realtime
          if (id && pendingRef.current.has(id)) return

          // Evento de outro membro — merge sem refetch completo
          if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old?.id))
            return
          }

          if (payload.eventType === 'INSERT') {
            // Novo item de outro membro — busca com joins
            const { data } = await supabase
              .from('items')
              .select('*, categories(id, name, emoji), profiles!items_updated_by_fkey(id, full_name)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setItems(prev => {
                if (prev.find(i => i.id === data.id)) return prev
                return [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
              })
            }
            return
          }

          if (payload.eventType === 'UPDATE') {
            // Actualiza apenas os campos que mudaram, preservando joins
            setItems(prev => prev.map(i => {
              if (i.id !== payload.new.id) return i
              return {
                ...i,
                ...payload.new,
                // Preserva joins que o Realtime não inclui
                categories: i.categories,
                profiles:   i.profiles,
              }
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

  // ── Helper: atualização otimista + sync ──────────────────────────
  function optimisticUpdate(itemId, localChanges, serverUpdate) {
    // 1. Atualiza o estado local imediatamente
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...localChanges } : i))

    // 2. Marca como mutação própria para ignorar no Realtime
    pendingRef.current.add(itemId)

    // 3. Envia para o servidor em background
    return serverUpdate()
      .catch(err => {
        // Reverte se falhar
        fetchItems()
        throw err
      })
      .finally(() => {
        // Remove da lista de pendentes após 2s (tempo para o Realtime chegar)
        setTimeout(() => pendingRef.current.delete(itemId), 2000)
      })
  }

  // ── Mutações ────────────────────────────────────────────────────

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
      .select('*, categories(id, name, emoji), profiles!items_updated_by_fkey(id, full_name)')
      .single()
    if (err) throw err
    // Insere no estado local sem refetch
    setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    pendingRef.current.add(data.id)
    setTimeout(() => pendingRef.current.delete(data.id), 2000)
    return data
  }

  function cycleStatus(itemId, currentStatus) {
    const next = STATUS_CYCLE[currentStatus]
    return optimisticUpdate(
      itemId,
      { status: next, updated_by: user.id, updated_at: new Date().toISOString() },
      () => supabase.from('items').update({ status: next, updated_by: user.id }).eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err })
    )
  }

  function setStatus(itemId, status) {
    return optimisticUpdate(
      itemId,
      { status, updated_by: user.id, updated_at: new Date().toISOString() },
      () => supabase.from('items').update({ status, updated_by: user.id }).eq('id', itemId)
        .then(({ error: err }) => { if (err) throw err })
    )
  }

  function adjustQuantity(itemId, delta) {
    const item   = items.find(i => i.id === itemId)
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

  async function updateItem(itemId, updates) {
    const { data, error: err } = await supabase
      .from('items')
      .update({ ...updates, updated_by: user.id })
      .eq('id', itemId)
      .select('*, categories(id, name, emoji), profiles!items_updated_by_fkey(id, full_name)')
      .single()
    if (err) throw err
    // Atualiza com os dados completos (inclui joins)
    pendingRef.current.add(itemId)
    setItems(prev => prev.map(i => i.id === itemId ? data : i)
      .sort((a, b) => a.name.localeCompare(b.name)))
    setTimeout(() => pendingRef.current.delete(itemId), 2000)
    return data
  }

  async function deleteItem(itemId) {
    // Remove localmente primeiro (sem esperar pelo servidor)
    setItems(prev => prev.filter(i => i.id !== itemId))
    pendingRef.current.add(itemId)
    const { error: err } = await supabase.from('items').delete().eq('id', itemId)
    if (err) {
      fetchItems() // reverte se falhar
      throw err
    }
    setTimeout(() => pendingRef.current.delete(itemId), 2000)
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
