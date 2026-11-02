import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HomePage } from '@/pages/HomePage'
import { JoinHouseModal } from '@/components/house/JoinHouseModal'
import { getInviteCodeFromUrl } from '@/lib/utils'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { houses, loading: houseLoading } = useHouse()
  const [joinOpen, setJoinOpen] = useState(false)

  // Quando o utilizador já tem casas e abre um link de convite,
  // mostra o modal de entrada em vez de redirecionar para o Onboarding
  useEffect(() => {
    if (!user || houseLoading) return
    const code = getInviteCodeFromUrl()
    if (!code) return

    if (houses.length > 0) {
      // Já tem casas — abre o modal de entrada diretamente
      setJoinOpen(true)
    }
    // Se não tem casas, o OnboardingPage trata disso
  }, [user, houseLoading, houses.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || houseLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-primary-600">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl animate-bounce">🫧</div>
          <div className="text-white/70 text-sm">A carregar...</div>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (houses.length === 0) return <OnboardingPage />

  return (
    <>
      <HomePage />
      {/* Modal de convite — abre automaticamente quando há ?invite= na URL */}
      <JoinHouseModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '340px',
          }
        }}
      />
    </>
  )
}
