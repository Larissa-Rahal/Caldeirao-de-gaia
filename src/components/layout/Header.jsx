import { useState } from 'react'
import { LogOut, Sun, Moon, UserCog, ShoppingCart, ReceiptText, History } from 'lucide-react'
import { HouseSwitcher } from './HouseSwitcher'
import { Avatar } from '@/components/ui/Avatar'
import { PushNotificationToggle } from '@/components/ui/PushNotificationToggle'
import { ProfileModal } from '@/components/user/ProfileModal'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function Header({
  onCreateHouse,
  onJoinHouse,
  onOpenSettings,
  onOpenMarket,
  onOpenReceiptScanner,
  onOpenHistory,
  needsMarket = 0,
}) {
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
      <header className="grimoire-header sticky top-0 z-40 border-b border-gold/35 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-8 h-14">

          {/* Seletor de Caldeirão */}
          <div className="flex items-center gap-2.5 min-w-0">
            <HouseSwitcher
              onCreateHouse={onCreateHouse}
              onJoinHouse={onJoinHouse}
              onOpenSettings={onOpenSettings}
            />
          </div>

          {/* Ações à direita: Nota Fiscal, Modo Mercado, Tema, Perfil */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {onOpenReceiptScanner && (
              <button
                onClick={onOpenReceiptScanner}
                title="Fotografar Nota Fiscal"
                aria-label="Fotografar ou enviar nota fiscal"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/50 bg-header-pill/85 text-gold-bright hover:border-gold-light hover:bg-header-hover transition text-xs font-medium"
              >
                <ReceiptText size={15} className="text-gold-light" />
                <span className="hidden sm:inline font-serif tracking-wide">Nota Fiscal</span>
              </button>
            )}

            {onOpenMarket && (
              <button
                onClick={onOpenMarket}
                title="Modo Mercado (Lista de Compras)"
                aria-label="Abrir lista de compras"
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition',
                  needsMarket > 0
                    ? 'border-gold-light bg-header-alert/90 text-gold-bright hover:bg-header-hover'
                    : 'border-gold/40 bg-header-pill/85 text-gold-cream hover:border-gold'
                )}
              >
                <ShoppingCart size={15} className="text-gold-light" />
                <span className="hidden sm:inline font-serif tracking-wide">Mercado</span>
                {needsMarket > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[11px] rounded-full font-bold leading-tight">
                    {needsMarket > 99 ? '99+' : needsMarket}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={toggle}
              aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              title={isDark ? 'Tema claro' : 'Tema escuro'}
              className="p-2 rounded-full border border-gold/40 bg-header-pill/85 text-gold-light hover:border-gold-light hover:bg-header-hover transition"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menu do utilizador"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className="rounded-full ring-2 ring-gold/70 hover:ring-gold-bright transition"
              >
                <Avatar
                  name={profile?.full_name ?? profile?.email ?? '?'}
                  src={profile?.avatar_url}
                  size="sm"
                  className="cursor-pointer"
                />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-2 z-20 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">

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

                    {onOpenHistory && (
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          onOpenHistory()
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <History size={15} /> Histórico
                      </button>
                    )}

                    <button
                      onClick={openProfile}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <UserCog size={15} /> Editar perfil
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
        </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
