import { useState, useMemo } from 'react'
import { Plus, Search, RefreshCw, LayoutGrid, List, ShoppingCart, Filter, ChevronDown, Check, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemFormModal } from '@/components/items/ItemFormModal'
import { Button } from '@/components/ui/Button'
import { MarketModal } from '@/components/house/MarketModal'
import { useItems } from '@/hooks/useItems'
import { useCategories } from '@/hooks/useCategories'
import { STATUS_CONFIG } from '@/lib/defaults'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CreateHouseModal } from '@/components/house/CreateHouseModal'
import { JoinHouseModal } from '@/components/house/JoinHouseModal'
import { SettingsModal } from '@/components/house/SettingsModal'

const STATUS_FILTERS = ['all', 'in_stock', 'running_low', 'out_of_stock']
const VIEW_KEY = 'caldeirão_view'

export function HomePage() {
  const { items, loading, cycleStatus, setStatus, addItem, updateItem, deleteItem, adjustQty, updateQtyValue } = useItems()
  const { categories, addCategory, deleteCategory } = useCategories()

  const [search,          setSearch]          = useState('')
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [categoryFilter,  setCategoryFilter]  = useState('all')
  const [catMenuOpen,     setCatMenuOpen]     = useState(false)
  const [viewMode,        setViewMode]        = useState(() => localStorage.getItem(VIEW_KEY) ?? 'grid')
  const [addOpen,         setAddOpen]         = useState(false)
  const [editItem,        setEditItem]        = useState(null)
  const [createHouseOpen, setCreateHouseOpen] = useState(false)
  const [joinHouseOpen,   setJoinHouseOpen]   = useState(false)
  const [settingsOpen,    setSettingsOpen]    = useState(false)
  const [marketOpen,      setMarketOpen]      = useState(false)

  function toggleView() {
    const next = viewMode === 'grid' ? 'compact' : 'grid'
    setViewMode(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return items.filter(item => {
      const name          = item.product?.name    ?? item.name    ?? ''
      const brand         = item.product?.brand   ?? item.brand   ?? ''
      const barcode       = item.product?.barcode ?? item.barcode ?? ''
      const matchSearch   = !query
        || name.toLowerCase().includes(query)
        || brand.toLowerCase().includes(query)
        || barcode.toLowerCase().includes(query)
      const matchStatus   = statusFilter === 'all' || item.status === statusFilter
      const matchCategory = categoryFilter === 'all' || item.category_id === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [items, search, statusFilter, categoryFilter])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(item => {
      const key   = item.category_id ?? '__none__'
      const label = item.category
        ? `${item.category.emoji} ${item.category.name}`
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

  const counts = useMemo(() => ({
    all:          items.length,
    in_stock:     items.filter(i => i.status === 'in_stock').length,
    running_low:  items.filter(i => i.status === 'running_low').length,
    out_of_stock: items.filter(i => i.status === 'out_of_stock').length,
  }), [items])

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === categoryFilter) ?? null,
    [categories, categoryFilter]
  )

  const needsMarket = counts.running_low + counts.out_of_stock

  async function handleCycleStatus(itemId, currentStatus) {
    try { await cycleStatus(itemId, currentStatus) }
    catch { toast.error('Erro ao atualizar status.') }
  }

  async function handleSetStatus(itemId, status) {
    try { await setStatus(itemId, status) }
    catch { toast.error('Erro ao atualizar status.') }
  }

  async function handleAddItem(data) {
    await addItem(data)
    toast.success('Item adicionado!')
  }

  async function handleEditItem(data) {
    await updateItem(editItem.id, {
      name:        data.name,
      brand:       data.brand,
      barcode:     data.barcode,
      defaultUnit: data.defaultUnit,
      categoryId:  data.categoryId,
      qty_value:   data.qty_value,
      qty_unit:    data.qty_unit,
      notes:       data.notes,
      imageUrl:    data.imageUrl,
    })
    toast.success('Item atualizado!')
    setEditItem(null)
  }

  async function handleDeleteItem(itemId) {
    if (!confirm('Excluir este item?')) return
    try { await deleteItem(itemId); toast.success('Item excluído.') }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <Header
        onCreateHouse={() => setCreateHouseOpen(true)}
        onJoinHouse={() => setJoinHouseOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-24">

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar itens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>

          <button
            onClick={toggleView}
            title={viewMode === 'grid' ? 'Mudar para lista' : 'Mudar para grade'}
            aria-label={viewMode === 'grid' ? 'Vista em lista' : 'Vista em grade'}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition flex-shrink-0"
          >
            {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
          </button>

          <button
            onClick={() => setMarketOpen(true)}
            title="Modo Mercado"
            aria-label="Abrir lista de compras"
            className={cn(
              'relative px-3 py-2.5 rounded-xl border transition flex-shrink-0',
              needsMarket > 0
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            )}
          >
            <ShoppingCart size={18} />
            {needsMarket > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {needsMarket > 9 ? '9+' : needsMarket}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 min-w-0">
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

          {categories.length > 0 && (
            <div className="relative flex-shrink-0">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCatMenuOpen(v => !v)}
                  aria-expanded={catMenuOpen}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                    selectedCategory
                      ? 'bg-primary-600 text-white border-primary-600 pr-2'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Filter size={13} />
                  <span className="max-w-[120px] truncate">
                    {selectedCategory
                      ? `${selectedCategory.emoji} ${selectedCategory.name}`
                      : 'Categorias'}
                  </span>
                  {selectedCategory ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => {
                        e.stopPropagation()
                        setCategoryFilter('all')
                        setCatMenuOpen(false)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          setCategoryFilter('all')
                          setCatMenuOpen(false)
                        }
                      }}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-white/20 transition"
                      title="Limpar filtro de categoria"
                    >
                      <X size={12} />
                    </span>
                  ) : (
                    <ChevronDown size={13} className={cn('transition-transform', catMenuOpen && 'rotate-180')} />
                  )}
                </button>
              </div>

              {catMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setCatMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 z-40 w-56 rounded-2xl shadow-xl border border-gray-100 py-1.5 max-h-72 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setCategoryFilter('all'); setCatMenuOpen(false) }}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition hover:bg-gray-50',
                        categoryFilter === 'all' ? 'text-primary-700 font-semibold' : 'text-gray-700'
                      )}
                    >
                      <span>Todas as categorias</span>
                      {categoryFilter === 'all' && <Check size={14} className="text-primary-700" />}
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    {categories.map(cat => {
                      const active = categoryFilter === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setCategoryFilter(cat.id); setCatMenuOpen(false) }}
                          className={cn(
                            'w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium transition hover:bg-gray-50',
                            active ? 'text-primary-700 font-semibold' : 'text-gray-700'
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span>{cat.emoji}</span>
                            <span className="truncate">{cat.name}</span>
                          </span>
                          {active && <Check size={14} className="text-primary-700 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <RefreshCw size={24} className="animate-spin" />
            <p className="text-sm">Carregando itens...</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="text-5xl">🫧</span>
            <p className="text-sm">
              {items.length === 0
                ? 'O caldeirão está vazio. Adicione o primeiro ingrediente!'
                : 'Nenhum item corresponde aos filtros.'}
            </p>
          </div>

        ) : (
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

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {group.items.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        viewMode="grid"
                        onCycleStatus={handleCycleStatus}
                        onSetStatus={handleSetStatus}
                        onAdjustQty={adjustQty}
                        onUpdateQtyValue={updateQtyValue}
                        onEdit={setEditItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {group.items.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        viewMode="compact"
                        onCycleStatus={handleCycleStatus}
                        onSetStatus={handleSetStatus}
                        onAdjustQty={adjustQty}
                        onUpdateQtyValue={updateQtyValue}
                        onEdit={setEditItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}
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
      <CreateHouseModal open={createHouseOpen} onClose={() => setCreateHouseOpen(false)} />
      <JoinHouseModal   open={joinHouseOpen}   onClose={() => setJoinHouseOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        categories={categories}
        addCategory={addCategory}
        deleteCategory={deleteCategory}
      />
      <MarketModal
        open={marketOpen}
        onClose={() => setMarketOpen(false)}
        items={items}
        categories={categories}
        onSetStatus={handleSetStatus}
      />
    </div>
  )
}
