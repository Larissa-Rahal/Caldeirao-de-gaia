import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Check, CheckCheck, Share2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn, copyToClipboard } from '@/lib/utils'
import { getCategoryPlaceholder } from '@/lib/defaults'
import toast from 'react-hot-toast'

/**
 * Modo Mercado — checklist de itens Acabando + Em Falta.
 * Marcar um item repõe-o para Em Estoque automaticamente.
 */
export function MarketModal({ open, onClose, items, categories, onSetStatus }) {
  const [checked, setChecked] = useState(new Set())

  // Reseta os checks sempre que o modal abre
  useEffect(() => {
    if (open) setChecked(new Set())
  }, [open])

  // Só mostra itens que precisam de reposição
  const needed = useMemo(() =>
    items
      .filter(i => i.status === 'running_low' || i.status === 'out_of_stock')
      .sort((a, b) => {
        // Em Falta primeiro
        if (a.status === 'out_of_stock' && b.status !== 'out_of_stock') return -1
        if (b.status === 'out_of_stock' && a.status !== 'out_of_stock') return  1
        return a.name.localeCompare(b.name)
      }),
    [items]
  )

  // Agrupados por categoria para a lista de compras
  const grouped = useMemo(() => {
    const map = {}
    needed.forEach(item => {
      const key   = item.category_id ?? '__none__'
      const label = item.categories ? `${item.categories.emoji} ${item.categories.name}` : '📦 Sem categoria'
      if (!map[key]) map[key] = { label, items: [] }
      map[key].items.push(item)
    })
    return Object.entries(map).sort(([a], [b]) => {
      const catA = categories.find(c => c.id === a)
      const catB = categories.find(c => c.id === b)
      return (catA?.sort_order ?? 999) - (catB?.sort_order ?? 999)
    })
  }, [needed, categories])

  function toggleCheck(itemId) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
        // Repõe automaticamente
        onSetStatus(itemId, 'in_stock')
      }
      return next
    })
  }

  async function handleRepoeAll() {
    const unchecked = needed.filter(i => !checked.has(i.id))
    await Promise.all(unchecked.map(i => onSetStatus(i.id, 'in_stock')))
    setChecked(new Set(needed.map(i => i.id)))
    toast.success('Todos os itens repostos!')
  }

  async function handleShare() {
    const lines = grouped.flatMap(([, g]) => [
      `\n${g.label}`,
      ...g.items.map(i => `  ${checked.has(i.id) ? '✅' : '☐'} ${i.name}${i.quantity ? ` (${i.quantity})` : ''}`)
    ])
    const text = `🛒 Lista de Compras — Caldeirão de Gaia\n${lines.join('\n')}`

    if (navigator.share) {
      await navigator.share({ title: 'Lista de Compras', text })
    } else {
      await copyToClipboard(text)
      toast.success('Lista copiada!')
    }
  }

  const allChecked = needed.length > 0 && checked.size === needed.length

  return (
    <Modal open={open} onClose={onClose} title="🛒 Modo Mercado">
      {needed.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
          <span className="text-4xl">✨</span>
          <p className="text-sm text-center">
            Tudo em ordem! Nenhum item a repor.
          </p>
        </div>
      ) : (
        <>
          {/* Cabeçalho com contagem */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{needed.length}</span> itens a comprar
              {checked.size > 0 && ` · ${checked.size} já no carrinho`}
            </p>
            <div className="flex gap-2">
              <button onClick={handleShare}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Partilhar lista">
                <Share2 size={16} />
              </button>
              <button onClick={handleRepoeAll}
                className="p-2 rounded-xl text-green-600 hover:bg-green-50 transition"
                title="Repor todos">
                <CheckCheck size={16} />
              </button>
            </div>
          </div>

          {/* Lista agrupada por categoria */}
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto -mx-5 px-5">
            {grouped.map(([key, group]) => (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {group.items.map(item => {
                    const isChecked = checked.has(item.id)
                    const placeholder = getCategoryPlaceholder(
                      item.categories?.name ?? '', item.categories?.emoji ?? '📦'
                    )
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                          isChecked
                            ? 'bg-green-50 border-green-200 opacity-60'
                            : item.status === 'out_of_stock'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-amber-50 border-amber-200'
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        )}>
                          {isChecked && <Check size={11} className="text-white" />}
                        </div>

                        {/* Imagem */}
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                          <img src={item.image_url || placeholder} alt={item.name}
                            className="w-full h-full object-contain p-0.5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', isChecked && 'line-through text-gray-400')}>
                            {item.name}
                          </p>
                          {item.quantity && (
                            <p className="text-xs text-gray-400">{item.quantity}</p>
                          )}
                        </div>

                        {/* Badge status */}
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                          item.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {item.status === 'out_of_stock' ? 'Em Falta' : 'Acabando'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {allChecked && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-sm text-green-700 font-medium">🎉 Compras concluídas! Todos os itens repostos.</p>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
