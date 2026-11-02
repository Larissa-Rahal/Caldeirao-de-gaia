import { useState, useRef } from 'react'
import { MoreVertical, Pencil, Trash2, ChevronRight, ExternalLink } from 'lucide-react'
import { STATUS_CONFIG, STATUS_CYCLE, getCategoryPlaceholder } from '@/lib/defaults'
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
  const placeholder = getCategoryPlaceholder(item.category?.name ?? '', item.category?.emoji ?? '📦')

  const hasQty     = item.qty_value != null
  const isUnit     = hasQty && UNIT_TYPES.includes(qtyUnit)
  const isWeight   = hasQty && !isUnit
  const qtyDisplay = hasQty
    ? `${item.qty_value}${qtyUnit ? ' ' + qtyUnit : ''}`
    : null

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
    if (!isWeight) return
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

  function QtyControl({ size = 'sm' }) {
    if (!hasQty) return null
    const isSmall = size === 'sm'
    const btnCls = isSmall
      ? 'w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition'
      : 'w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition'

    if (isUnit) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={e => handleAdjust(-1, e)}
            disabled={Number(item.qty_value) <= 0}
            className={cn(btnCls, 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-30')}
            title="Remover 1"
          >−</button>
          <span className={cn(
            'font-semibold tabular-nums',
            isSmall ? 'text-xs min-w-[24px] text-center' : 'text-sm min-w-[28px] text-center',
            Number(item.qty_value) === 0 && 'text-red-500',
            Number(item.qty_value) === 1 && 'text-amber-500',
          )}>
            {item.qty_value}{qtyUnit ? <span className="text-gray-400 font-normal ml-0.5 text-[10px]">{qtyUnit}</span> : null}
          </span>
          <button
            onClick={e => handleAdjust(+1, e)}
            className={cn(btnCls, 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600')}
            title="Adicionar 1"
          >+</button>
        </div>
      )
    }

    if (isWeight) {
      return editingQty ? (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            ref={qtyInputRef}
            type="number"
            value={qtyDraft}
            onChange={e => setQtyDraft(e.target.value)}
            onBlur={handleQtyBlur}
            onKeyDown={handleQtyKeyDown}
            className={cn(
              'rounded-lg border border-primary-400 bg-white text-center font-semibold outline-none',
              'focus:ring-2 focus:ring-primary-300',
              isSmall ? 'text-xs w-16 py-0.5' : 'text-sm w-20 py-1'
            )}
            inputMode="decimal"
            autoFocus
          />
          {qtyUnit && <span className="text-xs text-gray-400">{qtyUnit}</span>}
        </div>
      ) : (
        <button
          onClick={handleQtyClick}
          title="Clica para editar"
          className={cn(
            'px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-primary-100 hover:text-primary-700 transition',
            isSmall ? 'text-xs' : 'text-sm'
          )}
        >
          {qtyDisplay} ✎
        </button>
      )
    }

    return null
  }

  if (viewMode === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white transition-all',
        cfg.border
      )}>
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
          <img src={item.image_url || item.product?.image_url || placeholder} alt={productName}
            className="w-full h-full object-contain p-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-gray-900 truncate',
            item.status === 'out_of_stock' && 'line-through text-gray-400')}>
            {productName}
            {productBrand && (
              <span className="text-xs font-normal text-gray-400 ml-1.5">· {productBrand}</span>
            )}
          </p>
          {item.category && (
            <p className="text-xs text-gray-400">{item.category.emoji} {item.category.name}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <QtyControl size="sm" />
          <button onClick={handleStatusClick}
            className={cn('flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all',
              cfg.bg, cfg.text, cfg.border)}>
            {cfg.label}
          </button>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <MoreVertical size={14} />
            </button>
            {menuOpen && <ItemMenu onClose={() => setMenuOpen(false)} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onShop={handleGoogleShopping} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative flex flex-col rounded-2xl border bg-white transition-all duration-150 hover:shadow-md',
      cfg.border
    )}>
      <div className="w-full rounded-t-2xl overflow-hidden bg-gray-50 border-b border-gray-100" style={{ height: '140px' }}>
        <img
          src={item.image_url || item.product?.image_url || placeholder}
          alt={productName}
          className="w-full h-full object-contain p-3"
          onError={e => { e.target.src = placeholder }}
        />
      </div>

      <div className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2">
          <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dot)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold text-gray-900 leading-snug',
              item.status === 'out_of_stock' && 'line-through text-gray-400')}>
              {productName}
            </p>
            {(productBrand || item.notes) && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {[productBrand, item.notes].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="relative flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <MoreVertical size={16} />
            </button>
            {menuOpen && <ItemMenu onClose={() => setMenuOpen(false)} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} onShop={handleGoogleShopping} />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400 truncate leading-tight">
            {item.category ? `${item.category.emoji} ${item.category.name} · ` : ''}
            {updaterName} · {timeAgo(item.updated_at)}
          </p>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <QtyControl size="sm" />
            <button onClick={handleStatusClick}
              className={cn(
                'flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold',
                'border transition-all duration-150 active:scale-95',
                cfg.bg, cfg.text, cfg.border,
              )}
              title={`Mudar para: ${nextCfg.label}`}>
              {cfg.label}
              <ChevronRight size={11} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemMenu({ onClose, onEdit, onDelete, onShop }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
        <button onClick={e => { e.stopPropagation(); onClose(); onEdit() }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
          <Pencil size={14} /> Editar
        </button>
        <button onClick={e => { e.stopPropagation(); onClose(); onShop(e) }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
          <ExternalLink size={14} /> Ver preços
        </button>
        <div className="border-t border-gray-100 my-0.5" />
        <button onClick={e => { e.stopPropagation(); onClose(); onDelete() }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </>
  )
}
