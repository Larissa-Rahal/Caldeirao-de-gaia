import { useState } from 'react'
import { ChevronDown, Plus, Home, LogIn, Settings } from 'lucide-react'
import { useHouse } from '@/contexts/HouseContext'
import { cn } from '@/lib/utils'

export function HouseSwitcher({ onCreateHouse, onJoinHouse, onOpenSettings }) {
  const { houses, activeHouse, setActiveHouse } = useHouse()
  const [open, setOpen] = useState(false)

  if (!activeHouse) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium',
          'bg-[#1D122E]/90 hover:bg-[#2A1B42] border border-[#C59B27]/60 text-[#F5E6C8] shadow-md transition',
          'max-w-[200px]'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Selecionar caldeirão"
      >
        <Home size={14} className="shrink-0 text-[#E5B842]" />
        <span className="truncate font-serif tracking-wide">{activeHouse.name}</span>
        <ChevronDown size={13} className={cn('shrink-0 text-[#E5B842] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="listbox"
            aria-label="Caldeirões"
            className="absolute left-0 top-full mt-2 z-40 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden"
          >
            {houses.map(house => (
              <button
                key={house.id}
                role="option"
                aria-selected={house.id === activeHouse.id}
                onClick={() => { setActiveHouse(house); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition',
                  house.id === activeHouse.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Home size={14} className="shrink-0 text-[#C59B27]" />
                <span className="truncate">{house.name}</span>
                {house.myRole === 'owner' && (
                  <span className="ml-auto text-xs text-gray-400">dono</span>
                )}
              </button>
            ))}

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onOpenSettings?.() }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <Settings size={14} className="text-[#C59B27]" />
                Configurações da casa
              </button>
            </div>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onCreateHouse?.() }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition"
              >
                <Plus size={14} />
                Novo caldeirão
              </button>
              <button
                onClick={() => { setOpen(false); onJoinHouse?.() }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition"
              >
                <LogIn size={14} />
                Entrar com código
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
