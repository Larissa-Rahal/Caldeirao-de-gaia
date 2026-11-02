import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { DEFAULT_CATEGORIES } from '@/lib/defaults'

const HouseContext = createContext(null)
export { HouseContext }

const ACTIVE_HOUSE_KEY = 'estoquecasa_active_house'

export function HouseProvider({ children }) {
  const { user } = useAuth()
  const [houses,      setHouses]      = useState([])
  const [activeHouse, setActiveHouseState] = useState(null)
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)

  // Carrega todas as casas do utilizador
  const fetchHouses = useCallback(async () => {
    if (!user) { setHouses([]); setLoading(false); return }

    const { data, error } = await supabase
      .from('house_members')
      .select('role, houses(*)')
      .eq('user_id', user.id)
      .order('joined_at')

    if (error) { console.error(error); setLoading(false); return }

    const list = (data ?? []).map(row => ({ ...row.houses, myRole: row.role }))
    setHouses(list)

    // Restaurar casa activa do localStorage ou usar a primeira
    const saved = localStorage.getItem(ACTIVE_HOUSE_KEY)
    const found = list.find(h => h.id === saved) ?? list[0] ?? null
    setActiveHouseState(found)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchHouses() }, [fetchHouses])

  // Carrega membros da casa activa
  useEffect(() => {
    if (!activeHouse) { setMembers([]); return }
    supabase
      .from('house_members')
      .select('*, profiles(*)')
      .eq('house_id', activeHouse.id)
      .then(({ data }) => setMembers(data ?? []))
  }, [activeHouse])

  function setActiveHouse(house) {
    setActiveHouseState(house)
    if (house) localStorage.setItem(ACTIVE_HOUSE_KEY, house.id)
  }

  async function ensureProfile() {
    // Garante que o perfil existe antes de criar a casa
    // (pode não existir se o email ainda não foi confirmado quando o trigger disparou)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existing) {
      await supabase.from('profiles').insert({
        id:        user.id,
        email:     user.email,
        full_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      })
    }
  }

  async function createHouse(name) {
    // Garante perfil antes de criar (resolve race condition com trigger)
    await ensureProfile()

    const { data, error } = await supabase
      .from('houses')
      .insert({ name, owner_id: user.id })
      .select()
      .single()
    if (error) throw error

    // Criar categorias padrão
    const cats = DEFAULT_CATEGORIES.map(c => ({ ...c, house_id: data.id }))
    await supabase.from('categories').insert(cats)

    await fetchHouses()
    // Seleccionar a nova casa
    setActiveHouseState(prev => prev ?? data)
    localStorage.setItem(ACTIVE_HOUSE_KEY, data.id)
    return data
  }

  async function joinHouse(inviteCode) {
    await ensureProfile()
    const { data, error } = await supabase.rpc('join_house', { p_invite_code: inviteCode })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    await fetchHouses()
    return data
  }

  async function updateHouseName(houseId, name) {
    const { data, error } = await supabase
      .from('houses')
      .update({ name })
      .eq('id', houseId)
      .select()
      .single()
    if (error) throw error
    setHouses(prev => prev.map(h => h.id === houseId ? { ...h, ...data } : h))
    if (activeHouse?.id === houseId) setActiveHouseState(prev => ({ ...prev, ...data }))
    return data
  }

  async function regenerateInviteCode(houseId) {
    const { data, error } = await supabase.rpc('regenerate_invite_code', { p_house_id: houseId })
    if (error) throw error
    setHouses(prev => prev.map(h => h.id === houseId ? { ...h, invite_code: data } : h))
    if (activeHouse?.id === houseId) setActiveHouseState(prev => ({ ...prev, invite_code: data }))
    return data
  }

  async function removeMember(memberId) {
    const { error } = await supabase
      .from('house_members')
      .delete()
      .eq('id', memberId)
    if (error) throw error
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  return (
    <HouseContext.Provider value={{
      houses, activeHouse, members, loading,
      setActiveHouse, createHouse, joinHouse,
      updateHouseName, regenerateInviteCode, removeMember,
      refetchHouses: fetchHouses
    }}>
      {children}
    </HouseContext.Provider>
  )
}

export function useHouse() {
  const ctx = useContext(HouseContext)
  if (!ctx) throw new Error('useHouse deve ser usado dentro de HouseProvider')
  return ctx
}
