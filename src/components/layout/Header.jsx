import { useState } from 'react'
import { Settings, LogOut, Sun, Moon, UserCog } from 'lucide-react'
import { HouseSwitcher } from './HouseSwitcher'
import { Avatar } from '@/components/ui/Avatar'
import { PushNotificationToggle } from '@/components/ui/PushNotificationToggle'
import { ProfileModal } from '@/components/user/ProfileModal'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'

export function Header({ onCreateHouse, onJoinHouse, onOpenSettings }) {
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  function openProfile() {
    setMenuOpen(false)
    setProfileOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-primary-600 shadow-md">
        <div className="w-full max-w-5xl mx-auto flex items-center gap-3 px-4 sm:px-6 h-14">

          <span className="text-lg select-none">🫧</span>

          {/* Nome da app — só desktop */}
          <span className="hidden md:block text-white font-semibold text-sm tracking-wide mr-1">
            Caldeirão de Gaia
          </span>

          <div className="flex-1 min-w-0">
            <HouseSwitcher onCreateHouse={onCreateHouse} onJoinHouse={onJoinHouse} />
          </div>

          <button
            onClick={toggle}
            aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            title={isDark ? 'Tema claro' : 'Tema escuro'}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu do utilizador"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <Avatar
                name={profile?.full_name ?? profile?.email ?? '?'}
                src={profile?.avatar_url}
                size="sm"
                className="cursor-pointer ring-2 ring-white/40 hover:ring-white/80 transition"
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-2 z-20 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">

                  <button
                    onClick={openProfile}
                    className="w-full flex items-center gap-3 px-3.5 py-3 border-b border-gray-100 hover:bg-gray-50 transition text-left"
                  >
                    <Avatar
                      name={profile?.full_name ?? profile?.email ?? '?'}
                      src={profile?.avatar_url}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile?.full_name ?? 'Sem nome'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    </div>
                  </button>

                  <div className="px-2 py-2 border-b border-gray-100">
                    <PushNotificationToggle />
                  </div>

                  <button
                    onClick={openProfile}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <UserCog size={15} /> Editar perfil
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); onOpenSettings() }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Settings size={15} /> Configurações da casa
                  </button>

                  <div className="border-t border-gray-100 my-0.5" />

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

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
