import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HomePage } from '@/pages/HomePage'
import { clearInviteFromUrl, getInviteCodeFromUrl } from '@/lib/utils'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { houses, loading: houseLoading, joinHouse } = useHouse()

  // Processar convite da URL após login
  useEffect(() => {
    if (!user) return
    const code = getInviteCodeFromUrl()
    if (!code) return

    joinHouse(code)
      .then(() => clearInviteFromUrl())
      .catch(() => clearInviteFromUrl())
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || houseLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-primary-600">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl animate-bounce">🏠</div>
          <div className="text-white/70 text-sm">A carregar...</div>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />
  if (houses.length === 0) return <OnboardingPage />
  return <HomePage />
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
