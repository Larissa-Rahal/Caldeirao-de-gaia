import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, ChevronRight, ExternalLink } from 'lucide-react'
import { STATUS_CONFIG, STATUS_CYCLE } from '@/lib/defaults'
import { timeAgo, cn } from '@/lib/utils'

export function ItemCard({ item, onCycleStatus, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const cfg     = STATUS_CONFIG[item.status]
  const nextCfg = STATUS_CONFIG[STATUS_CYCLE[item.status]]
  const updaterName = item.profiles?.full_name ?? 'Alguém'

  function handleStatusClick(e) {
    e.stopPropagation()
    onCycleStatus(item.id, item.status)
  }

  function handleGoogleShopping(e) {
    e.stopPropagation()
    const query = encodeURIComponent(item.name)
    window.open(`https://www.google.com/search?tbm=shop&q=${query}&hl=pt`, '_blank', 'noopener')
  }

  return (
    // overflow-visible no container para o menu não ficar cortado
    <div className={cn(
      'relative flex flex-col rounded-2xl border bg-white',
      'transition-all duration-150 hover:shadow-md',
      cfg.border
    )}>

      {/* Imagem — container separado com overflow-hidden só aqui */}
      {item.image_url && (
        <div className="w-full rounded-t-2xl overflow-hidden bg-gray-50 border-b border-gray-100"
             style={{ height: '140px' }}>
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain p-3"
            onError={e => { e.target.closest('div').style.display = 'none' }}
          />
        </div>
      )}

      {/* Corpo */}
      <div className="flex flex-col gap-2.5 p-3.5">

        {/* Nome + menu */}
        <div className="flex items-start gap-2">
          <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dot)} aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold text-gray-900 leading-snug',
              item.status === 'out_of_stock' && 'line-through text-gray-400'
            )}>
              {item.name}
            </p>
            {item.notes && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{item.notes}</p>
            )}
          </div>

          {/* Menu ⋯ — z-index alto para sobrepor outros cards */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Mais opções"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                {/* Overlay para fechar */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                {/* Dropdown — z-50 e posição fixa em relação ao viewport */}
                <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(item) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); handleGoogleShopping(e) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <ExternalLink size={14} /> Ver preços
                  </button>
                  <div className="border-t border-gray-100 my-0.5" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(item.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Categoria + status */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400 truncate leading-tight">
            {item.categories ? `${item.categories.emoji} ${item.categories.name} · ` : ''}
            {updaterName} · {timeAgo(item.updated_at)}
          </p>

          <button
            onClick={handleStatusClick}
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
              'border transition-all duration-150 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              cfg.bg, cfg.text, cfg.border,
              item.status === 'in_stock'     && 'focus:ring-green-400',
              item.status === 'running_low'  && 'focus:ring-amber-400',
              item.status === 'out_of_stock' && 'focus:ring-red-400',
            )}
            title={`Mudar para: ${nextCfg.label}`}
            aria-label={`Estado: ${cfg.label}. Clica para mudar para ${nextCfg.label}`}
          >
            {cfg.label}
            <ChevronRight size={12} className="opacity-50" />
          </button>
        </div>
      </div>
    </div>
  )
}
