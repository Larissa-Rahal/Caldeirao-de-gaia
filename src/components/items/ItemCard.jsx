import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { STATUS_CONFIG } from '@/lib/defaults'
import { timeAgo, cn } from '@/lib/utils'

/**
 * Cartão de item com toggle de status por toque/clique.
 * Exibe: nome, categoria, status, última alteração (quem + quando).
 */
export function ItemCard({ item, onCycleStatus, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pressing, setPressing] = useState(false)

  const cfg = STATUS_CONFIG[item.status]
  const updaterName = item.profiles?.full_name ?? 'Alguém'

  function handleStatusClick(e) {
    e.stopPropagation()
    onCycleStatus(item.id, item.status)
  }

  return (
    <div className={cn(
      'relative flex items-start gap-3 p-4 rounded-2xl border transition-all duration-150',
      'bg-white hover:shadow-sm active:scale-[0.99]',
      cfg.border,
      pressing && 'scale-[0.98]'
    )}>

      {/* Status dot / toggle */}
      <button
        onClick={handleStatusClick}
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-full flex-shrink-0 border-2 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          item.status === 'in_stock'     && 'bg-green-500 border-green-500 focus:ring-green-400',
          item.status === 'running_low'  && 'bg-amber-500 border-amber-500 focus:ring-amber-400',
          item.status === 'out_of_stock' && 'bg-red-500   border-red-500   focus:ring-red-400',
        )}
        aria-label={`Estado: ${cfg.label}. Clica para mudar.`}
        title={`Mudar estado (atual: ${cfg.label})`}
      />

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium text-gray-900 truncate',
          item.status === 'out_of_stock' && 'line-through text-gray-400'
        )}>
          {item.name}
        </p>

        {item.notes && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.notes}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.categories && (
            <span className="text-xs text-gray-400">
              {item.categories.emoji} {item.categories.name}
            </span>
          )}
          <span className="text-xs text-gray-400" title={new Date(item.updated_at).toLocaleString('pt-PT')}>
            {updaterName} · {timeAgo(item.updated_at)}
          </span>
        </div>
      </div>

      {/* Badge de status */}
      <StatusBadge status={item.status} className="flex-shrink-0 hidden sm:inline-flex" />

      {/* Menu de opções */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Mais opções"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(item) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(item.id) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
