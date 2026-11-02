import { useState, useMemo } from 'react'
import { Search, RefreshCw, LayoutGrid, List, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemFormModal } from '@/components/items/ItemFormModal'
import { ReceiptScannerModal } from '@/components/items/ReceiptScannerModal'
import { MarketModal } from '@/components/house/MarketModal'
import { CauldronEmblem, StatusGem, CornerVine, AddOrbButton } from '@/components/ui/GrimoireOrnaments'
import { useItems } from '@/hooks/useItems'
import { useCategories } from '@/hooks/useCategories'
import { STATUS_CONFIG } from '@/lib/defaults'
import { COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CreateHouseModal } from '@/components/house/CreateHouseModal'
import { JoinHouseModal } from '@/components/house/JoinHouseModal'
import { SettingsModal } from '@/components/house/SettingsModal'
import { ActivityLog } from '@/components/house/ActivityLog'
import { Modal } from '@/components/ui/Modal'

const STATUS_FILTERS = ['all', 'in_stock', 'running_low', 'out_of_stock']
const VIEW_KEY = 'caldeirão_view'

export function HomePage() {
  const { items, loading, cycleStatus, setStatus, addItem, updateItem, deleteItem, adjustQty, updateQtyValue, restockItem } = useItems()
  const { categories, addCategory, deleteCategory } = useCategories()

  const [search,          setSearch]          = useState('')
  const [searchOpen,      setSearchOpen]      = useState(false)
  const [statusFilter,    setStatusFilter]    = useState('all')
  const [categoryFilter,  setCategoryFilter]  = useState('all')
  const [viewMode,        setViewMode]        = useState(() => localStorage.getItem(VIEW_KEY) ?? 'grid')
  const [addOpen,         setAddOpen]         = useState(false)
  const [editItem,        setEditItem]        = useState(null)
  const [createHouseOpen, setCreateHouseOpen] = useState(false)
  const [joinHouseOpen,   setJoinHouseOpen]   = useState(false)
  const [settingsOpen,    setSettingsOpen]    = useState(false)
  const [marketOpen,      setMarketOpen]      = useState(false)
  const [receiptOpen,     setReceiptOpen]     = useState(false)
  const [historyOpen,     setHistoryOpen]     = useState(false)

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
    toast.success('Item adicionado ao caldeirão!')
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
    if (!confirm('Excluir este item do caldeirão?')) return
    try { await deleteItem(itemId); toast.success('Item excluído.') }
    catch { toast.error('Erro ao excluir.') }
  }

  return (
    <div className="grimoire-shell min-h-dvh flex flex-col relative overflow-x-hidden">
      <Header
        onCreateHouse={() => setCreateHouseOpen(true)}
        onJoinHouse={() => setJoinHouseOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMarket={() => setMarketOpen(true)}
        onOpenReceiptScanner={() => setReceiptOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        needsMarket={needsMarket}
      />

      {/* Moldura Mística de Livro de Feitiços / Alquimia */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-5 py-3 sm:py-5 pb-28">
        <div className="grimoire-frame relative rounded-3xl border-2 border-gold/65 p-4 sm:p-7 min-h-[calc(100dvh-5.5rem)]">

          {/* Ornamentos de Trepadeiras, Folhas, Lua e Estrelas nos 4 Cantos */}
          <CornerVine position="top-left"     className="w-24 h-24 sm:w-36 sm:h-36 absolute top-0 left-0 z-0 opacity-90" />
          <CornerVine position="top-right"    className="w-24 h-24 sm:w-36 sm:h-36 absolute top-0 right-0 z-0 opacity-90" />
          <CornerVine position="bottom-left"  className="w-24 h-24 sm:w-36 sm:h-36 absolute bottom-0 left-0 z-0 opacity-80" />
          <CornerVine position="bottom-right" className="w-24 h-24 sm:w-36 sm:h-36 absolute bottom-0 right-0 z-0 opacity-80" />

          {/* ── CABEÇALHO DO GRIMÓRIO: Caldeirão + Título Dourado + Barra de Gemas ── */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 mb-5 border-b border-gold/25">

            {/* Emblema do Caldeirão + Título */}
            <div className="flex items-center gap-3 sm:gap-4 pl-2 sm:pl-6">
              <CauldronEmblem className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 -my-2 drop-shadow-emblem" />
              <div>
                <h1 className="grimoire-title font-serif font-extrabold text-2xl sm:text-4xl tracking-wide leading-tight select-none">
                  Caldeirão<br className="hidden sm:inline" /> de Gaia
                </h1>
                <p className="text-xs text-grimoire-muted mt-0.5 hidden sm:block">
                  Grimório &amp; Inventário Alquímico da Casa
                </p>
              </div>
            </div>

            {/* Barra de Gemas de Status + Busca + Seletor de Vista (GRADE / LISTA) */}
            <div className="flex flex-col items-stretch lg:items-end gap-3 pr-1 sm:pr-4">

              {/* Cápsula Dourada de Status com Gemas Mágicas */}
              <div className="grimoire-statusbar relative flex items-center flex-wrap sm:flex-nowrap gap-1.5 sm:gap-3 px-3.5 sm:px-5 py-2 rounded-full border-2 border-gold/80">
                {STATUS_FILTERS.map(s => {
                  const cfg    = STATUS_CONFIG[s]
                  const active = statusFilter === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      aria-pressed={active}
                      className={cn(
                        'grimoire-status-btn flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-serif font-bold transition-all whitespace-nowrap',
                        active
                          ? 'grimoire-status-btn-active ring-1 ring-gold-light'
                          : 'hover:opacity-90'
                      )}
                    >
                      {s !== 'all' && <StatusGem status={s} size={16} />}
                      <span>{s === 'all' ? 'Todos' : cfg?.label}</span>
                      <span className="grimoire-count font-sans text-xs font-bold ml-0.5">
                        {counts[s]}
                      </span>
                    </button>
                  )
                })}

                {/* Botão Lupa Dourada integrado na moldura */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(v => !v)}
                  title="Buscar ingrediente"
                  className={cn(
                    'ml-auto sm:ml-1 p-1.5 rounded-full border transition',
                    search || searchOpen
                      ? 'bg-gold text-header-pill border-gold-bright'
                      : 'bg-header-pill text-gold-light border-gold/60 hover:border-gold-bright'
                  )}
                >
                  <Search size={14} />
                </button>
              </div>

              {/* Linha secundária: Campo de Busca (expansível ou ativo) + Botão GRADE / LISTA */}
              <div className="flex items-center justify-between lg:justify-end gap-3 w-full">
                {(searchOpen || search) ? (
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-light pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Buscar ingrediente, marca..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-7 py-1.5 rounded-full border border-gold/70 bg-input text-xs sm:text-sm text-grimoire-text outline-none focus:ring-2 focus:ring-gold-light"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-grimoire-muted hover:text-grimoire-text"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={toggleView}
                  title={viewMode === 'grid' ? 'Mudar para lista compacta' : 'Mudar para cartas em grade'}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gold/50 bg-header-pill/80 hover:border-gold-light text-gold-light font-serif font-bold text-xs tracking-widest uppercase transition"
                >
                  {viewMode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                  <span>{viewMode === 'grid' ? 'GRADE' : 'LISTA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── CORPO DO GRIMÓRIO: Painel Lateral ("Seções do Caldeirão") + Grade de Cartas ── */}
          <div className="relative z-10 flex flex-col lg:flex-row gap-6">

            {/* Painel de Navegação Lateral — "Seções do Caldeirão" (fixo ao rolar no desktop) */}
            {categories.length > 0 && (
              <aside className="lg:w-56 flex-shrink-0 flex flex-col lg:sticky lg:top-20 lg:self-start">
                <h2 className="grimoire-section-heading font-serif font-bold text-sm sm:text-base tracking-wide mb-3 px-1 lg:text-center">
                  Seções do Caldeirão
                </h2>

                {/* Lista de Medalhões (Horizontal no mobile, Vertical no desktop) */}
                <div className="flex lg:flex-col gap-2.5 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
                  <CategoryMedallion
                    emoji="✨"
                    name="Todas"
                    active={categoryFilter === 'all'}
                    onClick={() => setCategoryFilter('all')}
                  />
                  {categories.map(cat => (
                    <CategoryMedallion
                      key={cat.id}
                      emoji={cat.emoji}
                      name={cat.name}
                      active={categoryFilter === cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                    />
                  ))}
                </div>
              </aside>
            )}

            {/* Divisor Vertical Místico com Estrela e Lua (apenas Desktop) */}
            {categories.length > 0 && (
              <div className="hidden lg:flex flex-col items-center py-4 select-none pointer-events-none" aria-hidden="true">
                <span className="text-gold-light text-sm mb-2">✦</span>
                <div className="w-px flex-1 bg-gradient-to-b from-gold/80 via-gold/40 to-gold/80" />
                <span className="text-gold-light text-xs my-2">⚜</span>
                <div className="w-px flex-1 bg-gradient-to-b from-gold/80 via-gold/40 to-gold/80" />
                <span className="text-gold-light text-sm mt-2">☾</span>
              </div>
            )}

            {/* Área Principal das Cartas de Ingredientes */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-gold">
                  <RefreshCw size={26} className="animate-spin" />
                  <p className="font-serif text-sm text-gold-light">Consultando o grimório...</p>
                </div>

              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <CauldronEmblem className="w-24 h-24 opacity-75" />
                  <p className="font-serif text-base text-grimoire-text">
                    {items.length === 0
                      ? 'O caldeirão está vazio. Adicione o primeiro ingrediente mágico!'
                      : 'Nenhum ingrediente corresponde aos encantamentos de busca.'}
                  </p>
                </div>

              ) : categoryFilter === 'all' && viewMode === 'grid' ? (
                /* Vista em Grade Unificada de Cartas Mágicas (fiel à arte conceitual) */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                  {filtered.map(item => (
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
                /* Vista agrupada quando em Lista ou filtrada por seção */
                <div className="flex flex-col gap-6">
                  {grouped.map(([key, group]) => (
                    <section key={key} aria-labelledby={`cat-${key}`}>
                      <h2
                        id={`cat-${key}`}
                        className="font-serif text-xs sm:text-sm font-bold text-gold-light uppercase tracking-wider mb-3 px-1 flex items-center gap-2"
                      >
                        <span>{group.label}</span>
                        <span className="text-grimoire-muted font-sans font-normal text-xs">
                          ({group.items.length})
                        </span>
                      </h2>

                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
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
                        <div className="flex flex-col gap-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* FAB — Orbe Mágica "+ Adicionar" */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-30">
        <AddOrbButton onClick={() => setAddOpen(true)} />
      </div>

      {/* Modais */}
      <ItemFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddItem}
        categories={categories}
        existingItems={items}
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
      <ReceiptScannerModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        items={items}
        categories={categories}
        onRestockItem={restockItem}
        onAddItem={addItem}
      />
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="📜 Histórico do Caldeirão"
      >
        <div className="max-h-[65vh] overflow-y-auto -mx-5 px-5">
          <ActivityLog />
        </div>
      </Modal>
    </div>
  )
}

/**
 * Botão de Categoria estilo Medalhão Alquímico com moldura dourada e folhas laterais
 */
function CategoryMedallion({ emoji, name, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center flex-shrink-0 lg:w-full text-left focus:outline-none transition-transform active:scale-95"
    >
      {/* Ornamento de folhas à esquerda do medalhão */}
      <svg
        viewBox="0 0 24 44"
        className="w-4 h-9 -mr-2 z-10 pointer-events-none select-none hidden sm:block"
        fill="none"
        aria-hidden="true"
      >
        <path d="M18 6 C8 14, 8 30, 18 38" stroke={COLORS.gold.base} strokeWidth="1.5" />
        <path d="M14 14 C6 10, 4 18, 12 20 Z" fill={COLORS.foliage.mid} stroke={COLORS.gold.base} strokeWidth="0.9" />
        <path d="M12 24 C4 22, 4 30, 12 30 Z" fill={COLORS.foliage.light} stroke={COLORS.gold.base} strokeWidth="0.9" />
      </svg>

      {/* Medalhão circular dourado */}
      <div
        className={cn(
          'relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all shadow-md flex-shrink-0',
          active
            ? 'grimoire-medallion-active border-gold-bright ring-2 ring-gold-dark/50 shadow-medallion-glow'
            : 'grimoire-medallion border-gold/80 group-hover:border-gold-light'
        )}
      >
        <span className="text-base sm:text-lg leading-none select-none">{emoji}</span>
      </div>

      {/* Placa horizontal com nome da seção */}
      <div
        className={cn(
          'flex-1 -ml-3 pl-5 pr-3.5 py-1.5 sm:py-2 rounded-r-full border-y border-r transition-all min-w-0',
          active
            ? 'grimoire-plaque-active border-gold-light shadow-plaque-glow'
            : 'grimoire-plaque border-gold/55 group-hover:border-gold-light'
        )}
      >
        <span className="block font-serif font-semibold text-xs sm:text-sm truncate">
          {name}
        </span>
      </div>
    </button>
  )
}
