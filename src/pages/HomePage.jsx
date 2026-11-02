import { useState, useMemo } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemFormModal } from '@/components/items/ItemFormModal'
import { Button } from '@/components/ui/Button'
import { useItems } from '@/hooks/useItems'
import { useCategories } from '@/hooks/useCategories'
import { useHouse } from '@/contexts/HouseContext'
import { STATUS_CONFIG } from '@/lib/defaults'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CreateHouseModal } from '@/components/house/CreateHouseModal'
import { SettingsModal } from '@/components/house/SettingsModal'

const STATUS_FILTERS = ['all', 'in_stock', 'running_low', 'out_of_stock']

export function HomePage() {
  const { activeHouse } = useHouse()
  const { items, loading, cycleStatus, addItem, updateItem, deleteItem } = useItems()
  const { categories, addCategory, deleteCategory } = useCategories()

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [categoryFilter,  setCategoryFilter]  = useState('all')
  const [addOpen,         setAddOpen]         = useState(false)
  const [editItem,        setEditItem]        = useState(null)
  const [createHouseOpen, setCreateHouseOpen] = useState(false)
  const [settingsOpen,    setSettingsOpen]    = useState(false)

  // Filtragem combinada
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch   = item.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus   = statusFilter === 'all' || item.status === statusFilter
      const matchCategory = categoryFilter === 'all' || item.category_id === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [items, search, statusFilter, categoryFilter])

  // Agrupamento por categoria (ordenado por sort_order)
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(item => {
      const key   = item.category_id ?? '__none__'
      const label = item.categories
        ? `${item.categories.emoji} ${item.categories.name}`
        : '📦 Sem categoria'
      if (!map[key]) map[key] = { label, items: [] }
      map[key].items.push(item)
    })
    return Object.entries(map).sort(([a], [b]) => {
      const catA = categories.find(c => c.id === a)
      const catB = categories.find(c => c.id === b)
      return (catA?.sort_order ?? 999) - (catB?.sort_order ?? 999)
    })
  }, [filtered, categories])

  // Contagens por status
  const counts = useMemo(() => ({
    all:          items.length,
    in_stock:     items.filter(i => i.status === 'in_stock').length,
    running_low:  items.filter(i => i.status === 'running_low').length,
    out_of_stock: items.filter(i => i.status === 'out_of_stock').length,
  }), [items])

  async function handleCycleStatus(itemId, currentStatus) {
    try { await cycleStatus(itemId, currentStatus) }
    catch { toast.error('Erro ao atualizar estado.') }
  }

  async function handleAddItem(data) {
    await addItem(data)
    toast.success('Item adicionado!')
  }

  async function handleEditItem(data) {
    await updateItem(editItem.id, {
      name:        data.name,
      category_id: data.categoryId,
      quantity:    data.quantity,
      notes:       data.notes,
      image_url:   data.imageUrl,
    })
    toast.success('Item atualizado!')
    setEditItem(null)
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('Eliminar este item?')) return
    try { await deleteItem(itemId); toast.success('Item eliminado.') }
    catch { toast.error('Erro ao eliminar.') }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <Header
        onCreateHouse={() => setCreateHouseOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-24">

        {/* ── Barra de pesquisa ── */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Pesquisar itens..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          />
        </div>

        {/* ── Filtros de status ── */}
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide mb-3">
          <div className="flex gap-2 pb-1 w-max min-w-full">
            {STATUS_FILTERS.map(s => {
              const cfg    = STATUS_CONFIG[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={active}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    active
                      ? s === 'all'
                        ? 'bg-gray-900 text-white'
                        : cn(cfg?.bg, cfg?.text, 'border', cfg?.border)
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {s === 'all' ? 'Todos' : cfg?.label}
                  <span className={cn(
                    'min-w-[18px] text-center px-1 py-0.5 rounded-full text-xs font-semibold',
                    active && s !== 'all' ? cfg?.text : 'text-gray-400'
                  )}>
                    {counts[s]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Filtros de categoria ── */}
        {categories.length > 0 && (
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide mb-5">
            <div className="flex gap-2 pb-1 w-max min-w-full">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  categoryFilter === 'all'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                    categoryFilter === cat.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Conteúdo principal ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <RefreshCw size={24} className="animate-spin" />
            <p className="text-sm">A carregar itens...</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="text-5xl">📦</span>
            <p className="text-sm">
              {items.length === 0
                ? 'Ainda não há itens. Adiciona o primeiro!'
                : 'Nenhum item corresponde aos filtros.'}
            </p>
          </div>

        ) : (
          /* Grid: 1 coluna em mobile, 2 em tablet, 3 em desktop */
          <div className="flex flex-col gap-6">
            {grouped.map(([key, group]) => (
              <section key={key} aria-labelledby={`cat-${key}`}>
                <h2
                  id={`cat-${key}`}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 px-1"
                >
                  {group.label}
                  <span className="ml-1.5 text-gray-400 font-normal normal-case">
                    ({group.items.length})
                  </span>
                </h2>

                {/* Grid responsivo de cartões */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.items.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onCycleStatus={handleCycleStatus}
                      onEdit={setEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* FAB — Adicionar item */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-20">
        <Button
          onClick={() => setAddOpen(true)}
          size="lg"
          className="rounded-2xl shadow-lg shadow-primary-500/30 gap-2 pr-5"
          aria-label="Adicionar item"
        >
          <Plus size={20} />
          Adicionar
        </Button>
      </div>

      {/* Modais */}
      <ItemFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddItem}
        categories={categories}
      />
      <ItemFormModal
        open={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        onSubmit={handleEditItem}
        initialData={editItem}
        categories={categories}
      />
      <CreateHouseModal
        open={createHouseOpen}
        onClose={() => setCreateHouseOpen(false)}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        categories={categories}
        addCategory={addCategory}
        deleteCategory={deleteCategory}
      />
    </div>
  )
}
