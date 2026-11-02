import { useState } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { HouseSwitcher } from './HouseSwitcher'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/contexts/AuthContext'

export function Header({ onCreateHouse, onOpenSettings }) {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  return (
    <header className="sticky top-0 z-30 bg-primary-600 shadow-md">
      <div className="w-full max-w-5xl mx-auto flex items-center gap-3 px-4 sm:px-6 h-14">
        {/* Logo */}
        <span className="text-white font-bold text-lg tracking-tight select-none">🏠</span>

        {/* Nome da app — visível só em desktop */}
        <span className="hidden md:block text-white font-semibold text-sm tracking-wide mr-1">
          EstoqueCasa
        </span>

        {/* Seletor de casa */}
        <div className="flex-1 min-w-0">
          <HouseSwitcher onCreateHouse={onCreateHouse} />
        </div>

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu do utilizador"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <Avatar
              name={profile?.full_name ?? profile?.email ?? '?'}
              size="sm"
              className="cursor-pointer ring-2 ring-white/40 hover:ring-white/80 transition"
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); onOpenSettings() }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings size={15} /> Definições da casa
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
