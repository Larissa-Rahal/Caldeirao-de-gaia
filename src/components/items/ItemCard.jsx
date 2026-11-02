import { useState, useRef } from 'react'
import { MoreVertical, Trash2, ExternalLink } from 'lucide-react'
import { STATUS_CONFIG, STATUS_CYCLE, getCategoryPlaceholder } from '@/lib/defaults'
import { CardCornerLeaves, StatusGem } from '@/components/ui/GrimoireOrnaments'
import { timeAgo, cn } from '@/lib/utils'

const UNIT_TYPES = ['un', 'unid', 'cx', 'pct', 'par']

export function ItemCard({
  item, onCycleStatus, onEdit, onDelete,
  onSetStatus, onAdjustQty, onUpdateQtyValue,
  viewMode = 'grid'
}) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [editingQty, setEditingQty] = useState(false)
  const [qtyDraft,   setQtyDraft]   = useState('')
  const qtyInputRef = useRef(null)

  const productName  = item.product?.name         ?? item.name         ?? ''
  const productBrand = item.product?.brand        ?? item.brand        ?? null
  const defaultUnit  = item.product?.default_unit ?? item.default_unit ?? 'un'
  const qtyUnit      = item.qty_unit || defaultUnit

  const cfg         = STATUS_CONFIG[item.status]
  const nextCfg     = STATUS_CONFIG[STATUS_CYCLE[item.status]]
  const updaterName = item.updater?.full_name ?? 'Alguém'
  const placeholder = getCategoryPlaceholder(
    item.category?.name ?? '',
    item.category?.emoji ?? '📦',
    productName
  )

  const hasQty     = item.qty_value != null
  const isUnit     = hasQty && UNIT_TYPES.includes(qtyUnit)
  const isWeight   = hasQty && !isUnit
  const qtyDisplay = hasQty
    ? `${item.qty_value}${qtyUnit ? ' ' + qtyUnit : ''}`
    : cfg.label

  const statusTextColors = {
    in_stock:     'grimoire-status-instock',
    running_low:  'grimoire-status-low',
    out_of_stock: 'grimoire-status-out',
  }

  const cardAuraClasses = {
    in_stock:     'border-[#B88928]/80 hover:border-[#E5B842] hover:shadow-[0_0_24px_rgba(74,222,128,0.18)]',
    running_low:  'border-[#D97706]/85 hover:border-[#FBBF24] hover:shadow-[0_0_24px_rgba(245,158,11,0.22)]',
    out_of_stock: 'border-[#7E22CE]/75 hover:border-[#C084FC] hover:shadow-[0_0_24px_rgba(168,85,247,0.22)]',
  }

  function handleStatusClick(e) {
    e.stopPropagation()
    onCycleStatus(item.id, item.status)
  }

  function handleGoogleShopping(e) {
    e.stopPropagation()
    const query = [productName, productBrand].filter(Boolean).join(' ')
    window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&hl=pt`, '_blank', 'noopener')
  }

  function handleAdjust(delta, e) {
    e.stopPropagation()
    onAdjustQty?.(item.id, delta)
  }

  function handleQtyClick(e) {
    e.stopPropagation()
    if (!hasQty) {
      onEdit?.(item)
      return
    }
    setQtyDraft(item.qty_value != null ? String(item.qty_value) : '')
    setEditingQty(true)
    setTimeout(() => qtyInputRef.current?.select(), 30)
  }

  function handleQtyBlur() {
    setEditingQty(false)
    const parsed = parseFloat(qtyDraft.replace(',', '.'))
    if (!isNaN(parsed) && parsed !== Number(item.qty_value)) {
      onUpdateQtyValue?.(item.id, parsed)
    }
  }

  function handleQtyKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); qtyInputRef.current?.blur() }
    if (e.key === 'Escape') { setEditingQty(false) }
  }

  // Modo Lista Compacta (estilo Grimório)
  if (viewMode === 'compact') {
    return (
      <div className={cn(
        'grimoire-card relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 transition-all',
        cardAuraClasses[item.status]
      )}>
        <div
          onClick={() => onEdit(item)}
          title="Clique para editar detalhes"
          className="grimoire-thumb w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#B88928]/40 cursor-pointer"
        >
          <img
            src={item.image_url || item.product?.image_url || placeholder}
            alt={productName}
            className="w-full h-full object-contain p-0.5"
            onError={e => { e.target.src = placeholder }}
          />
        </div>

        <div
          onClick={() => onEdit(item)}
          title="Clique para editar detalhes"
          className="flex-1 min-w-0 cursor-pointer"
        >
          <p className={cn(
            'grimoire-card-title font-serif font-bold text-sm truncate',
            item.status === 'out_of_stock' && 'line-through opacity-60'
          )}>
            {productName}
            {productBrand && (
              <span className="grimoire-card-sub font-sans text-xs font-normal ml-1.5">· {productBrand}</span>
            )}
          </p>
          <p className="grimoire-card-sub text-[11px] truncate">
            {item.category ? `${item.category.emoji} ${item.category.name} · ` : ''}
            {updaterName} · {timeAgo(item.updated_at)}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <ParchmentScroll
            hasQty={hasQty}
            isWeight={isWeight}
            editingQty={editingQty}
            qtyInputRef={qtyInputRef}
            qtyDraft={qtyDraft}
            setQtyDraft={setQtyDraft}
            handleQtyBlur={handleQtyBlur}
            handleQtyKeyDown={handleQtyKeyDown}
            handleQtyClick={handleQtyClick}
            handleAdjust={handleAdjust}
            qtyValue={item.qty_value}
            qtyDisplay={qtyDisplay}
            compact
          />

          <button
            onClick={handleStatusClick}
            title={`Mudar para: ${nextCfg.label}`}
            className="grimoire-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#B88928]/50 hover:border-[#E5B842] transition text-xs font-medium whitespace-nowrap"
          >
            <StatusGem status={item.status} size={14} className="flex-shrink-0" />
            <span className={statusTextColors[item.status]}>{cfg.label}</span>
          </button>

          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#C59B27] hover:bg-white/10 transition"
              aria-label="Opções do item"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <ItemMenu
                onClose={() => setMenuOpen(false)}
                onDelete={() => onDelete(item.id)}
                onShop={handleGoogleShopping}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Modo Grade — Carta Mágica / Alquimia (fiel à arte conceitual)
  return (
    <div
      className={cn(
        'grimoire-card group relative flex flex-col justify-between rounded-2xl border-2 p-3 transition-all duration-200',
        cardAuraClasses[item.status]
      )}
      style={{ minHeight: '268px' }}
    >
      {/* Moldura interna dourada fina */}
      <div className="absolute inset-1.5 rounded-xl border border-[#C59B27]/30 pointer-events-none" />

      {/* Folhas ornamentais nos 4 cantos */}
      <CardCornerLeaves />

      {/* Menu ⋮ no canto superior direito */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
          className="p-1 rounded-lg text-[#C59B27]/80 hover:text-[#E5B842] hover:bg-black/10 transition"
          aria-label="Opções do item"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <ItemMenu
            onClose={() => setMenuOpen(false)}
            onDelete={() => onDelete(item.id)}
            onShop={handleGoogleShopping}
          />
        )}
      </div>

      {/* Cabeçalho da Carta: Nome (até 2 linhas legíveis) + Status em linha única */}
      <div className="relative z-10 flex flex-col items-center text-center pt-1 px-3">
        <h3
          className={cn(
            'grimoire-card-title font-serif font-bold text-[13px] sm:text-[15px] leading-tight line-clamp-2 min-h-[2.25rem] flex items-center justify-center',
            item.status === 'out_of_stock' && 'line-through opacity-60'
          )}
          title={productName}
        >
          {productName}
        </h3>

        <button
          type="button"
          onClick={handleStatusClick}
          title={`Clique para mudar para: ${nextCfg.label}`}
          className="mt-1 inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-black/10 active:scale-95 transition whitespace-nowrap"
        >
          <StatusGem status={item.status} size={13} className="flex-shrink-0" />
          <span className={cn('text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap', statusTextColors[item.status])}>
            {cfg.label}
          </span>
        </button>
      </div>

      {/* Ilustração Central do Ingrediente / Produto */}
      <div
        onClick={() => onEdit(item)}
        className="relative z-10 my-1.5 flex items-center justify-center h-28 sm:h-30 cursor-pointer"
        title="Clique para editar detalhes"
      >
        <img
          src={item.image_url || item.product?.image_url || placeholder}
          alt={productName}
          className="max-h-full max-w-[85%] object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] group-hover:scale-105 transition-transform duration-200"
          onError={e => { e.target.src = placeholder }}
        />
      </div>

      {/* Subtítulo opcional (Marca / Notas) */}
      {(productBrand || item.notes) && (
        <p className="grimoire-card-sub relative z-10 text-[11px] text-center truncate px-2 mb-1">
          {[productBrand, item.notes].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Rodapé: Pergaminho de Quantidade */}
      <div className="relative z-10 flex justify-center pt-0.5">
        <ParchmentScroll
          hasQty={hasQty}
          isWeight={isWeight}
          editingQty={editingQty}
          qtyInputRef={qtyInputRef}
          qtyDraft={qtyDraft}
          setQtyDraft={setQtyDraft}
          handleQtyBlur={handleQtyBlur}
          handleQtyKeyDown={handleQtyKeyDown}
          handleQtyClick={handleQtyClick}
          handleAdjust={handleAdjust}
          qtyValue={item.qty_value}
          qtyDisplay={qtyDisplay}
        />
      </div>
    </div>
  )
}

/**
 * Seletor de Quantidade em formato de Pergaminho Antigo com botões de bronze - e +
 */
function ParchmentScroll({
  hasQty,
  editingQty,
  qtyInputRef,
  qtyDraft,
  setQtyDraft,
  handleQtyBlur,
  handleQtyKeyDown,
  handleQtyClick,
  handleAdjust,
  qtyValue,
  qtyDisplay,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none',
        compact ? 'w-32' : 'w-full max-w-[160px]'
      )}
      onClick={e => e.stopPropagation()}
    >
      {/* Rolo esquerdo do pergaminho */}
      <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-[#8C6239] via-[#DEC094] to-[#6E4926] border border-[#4A2E12] shadow-md flex-shrink-0 -mr-1 z-10" />

      {/* Corpo do pergaminho */}
      <div className="flex-1 flex items-center justify-between gap-1 px-2 py-1 bg-gradient-to-b from-[#EAD2AC] via-[#D5B485] to-[#B68F5C] border-y border-[#5C3A1E] shadow-inner min-h-[28px]">
        <button
          type="button"
          onClick={e => handleAdjust(-1, e)}
          disabled={!hasQty || Number(qtyValue) <= 0}
          title="Diminuir"
          className="w-5 h-5 flex items-center justify-center rounded bg-gradient-to-b from-[#8C5828] to-[#522D10] text-[#FDE68A] border border-[#3B1E08] font-bold text-xs leading-none hover:brightness-110 active:scale-95 disabled:opacity-35 transition"
        >
          −
        </button>

        {editingQty ? (
          <input
            ref={qtyInputRef}
            type="number"
            step="any"
            value={qtyDraft}
            onChange={e => setQtyDraft(e.target.value)}
            onBlur={handleQtyBlur}
            onKeyDown={handleQtyKeyDown}
            className="w-14 text-center text-xs font-bold rounded bg-[#FFF8EB] text-[#2C1A0B] border border-[#8C5828] outline-none px-1 py-0.5"
            style={{ backgroundColor: '#FFF8EB', color: '#2C1A0B' }}
            inputMode="decimal"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={handleQtyClick}
            title={hasQty ? 'Clique para editar o valor' : 'Clique para definir quantidade'}
            className="flex-1 text-center text-xs font-bold text-[#2C1A0B] truncate px-1 hover:underline whitespace-nowrap"
          >
            {qtyDisplay}
          </button>
        )}

        <button
          type="button"
          onClick={e => handleAdjust(+1, e)}
          title="Aumentar"
          className="w-5 h-5 flex items-center justify-center rounded bg-gradient-to-b from-[#8C5828] to-[#522D10] text-[#FDE68A] border border-[#3B1E08] font-bold text-xs leading-none hover:brightness-110 active:scale-95 transition"
        >
          +
        </button>
      </div>

      {/* Rolo direito do pergaminho */}
      <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-[#8C6239] via-[#DEC094] to-[#6E4926] border border-[#4A2E12] shadow-md flex-shrink-0 -ml-1 z-10" />
    </div>
  )
}

function ItemMenu({ onClose, onDelete, onShop }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
        <button
          onClick={e => { e.stopPropagation(); onClose(); onShop(e) }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          <ExternalLink size={14} /> Ver preços
        </button>
        <div className="border-t border-gray-100 my-0.5" />
        <button
          onClick={e => { e.stopPropagation(); onClose(); onDelete() }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </>
  )
}
