import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useHouse } from '@/contexts/HouseContext'

export function useCategories() {
  const { activeHouse } = useHouse()
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const channelRef = useRef(null)

  const fetchCategories = useCallback(async () => {
    if (!activeHouse) { setCategories([]); setLoading(false); return }
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('house_id', activeHouse.id)
      .order('sort_order')
    setCategories(data ?? [])
    setLoading(false)
  }, [activeHouse])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  useEffect(() => {
    if (!activeHouse) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Nome único por casa + timestamp para evitar colisão no StrictMode
    const channelName = `categories:${activeHouse.id}:${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `house_id=eq.${activeHouse.id}` },
        () => fetchCategories()
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

  async function addCategory({ name, emoji }) {
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1)
    const { data, error } = await supabase
      .from('categories')
      .insert({ house_id: activeHouse.id, name: name.trim(), emoji, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (error) throw error
    setCategories(prev => [...prev, data])
    return data
  }

  async function updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
