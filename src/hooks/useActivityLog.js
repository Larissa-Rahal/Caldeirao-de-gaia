import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useHouse } from '@/contexts/HouseContext'

const PAGE_SIZE = 30

const ACTION_CONFIG = {
  item_created:   { label: 'adicionou',        icon: '➕', color: 'text-green-600',  bg: 'bg-green-50'  },
  item_updated:   { label: 'editou',            icon: '✏️',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  item_deleted:   { label: 'removeu',           icon: '🗑️',  color: 'text-red-600',    bg: 'bg-red-50'    },
  status_changed: { label: 'alterou estado de', icon: '🔄',  color: 'text-amber-600',  bg: 'bg-amber-50'  },
  member_joined:  { label: 'entrou na casa',    icon: '👋',  color: 'text-primary-600',bg: 'bg-primary-50'},
  member_removed: { label: 'saiu da casa',      icon: '👤',  color: 'text-gray-600',   bg: 'bg-gray-50'   },
}

const STATUS_LABELS = {
  in_stock:     '✅ Em Estoque',
  running_low:  '⚠️ Acabando',
  out_of_stock: '❌ Em Falta',
}

export function useActivityLog() {
  const { activeHouse } = useHouse()
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(false)
  const [page,     setPage]     = useState(0)
  const channelRef = useRef(null)

  const fetchLog = useCallback(async (pageNum = 0) => {
    if (!activeHouse) { setEntries([]); setLoading(false); return }
    if (pageNum === 0) setLoading(true)

    const from = pageNum * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('activity_log')
      .select('*, profiles(id, full_name, email)')
      .eq('house_id', activeHouse.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    const rows = data ?? []
    setEntries(prev => pageNum === 0 ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [activeHouse])

  useEffect(() => {
    setPage(0)
    fetchLog(0)
  }, [fetchLog])

  // Realtime — novo evento aparece no topo sem refresh
  useEffect(() => {
    if (!activeHouse) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`activity_log:${activeHouse.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'activity_log',
          filter: `house_id=eq.${activeHouse.id}`,
        },
        () => fetchLog(0)   // refresh do início para ter o profile join
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channelRef.current); channelRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouse?.id])

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchLog(next)
  }

  return { entries, loading, hasMore, loadMore, ACTION_CONFIG, STATUS_LABELS }
}
