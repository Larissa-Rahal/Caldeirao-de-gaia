import { Bell, BellOff, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushNotificationToggle() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  if (!supported) return null

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 text-xs text-gray-400">
        <BellOff size={14} />
        Notificações bloqueadas no browser
      </div>
    )
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
        subscribed
          ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin flex-shrink-0" />
      ) : subscribed ? (
        <Bell size={16} className="flex-shrink-0 text-primary-500" />
      ) : (
        <BellOff size={16} className="flex-shrink-0 text-gray-400" />
      )}

      <div className="flex-1 text-left">
        <p>{subscribed ? 'Notificações ativas' : 'Ativar notificações'}</p>
        <p className="text-xs font-normal text-gray-400 mt-0.5">
          {subscribed
            ? 'Recebes alertas quando alguém altera um item'
            : 'Saber quando alguém altera o estoque'}
        </p>
      </div>

      {/* Toggle visual */}
      <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${
        subscribed ? 'bg-primary-500' : 'bg-gray-300'
      }`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
          subscribed ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </div>
    </button>
  )
}
