import { RefreshCw } from 'lucide-react'
import { useActivityLog } from '@/hooks/useActivityLog'
import { timeAgo } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

export function ActivityLog() {
  const { entries, loading, hasMore, loadMore, ACTION_CONFIG, STATUS_LABELS } = useActivityLog()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
        <RefreshCw size={20} className="animate-spin" />
        <p className="text-sm">Carregando histórico...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
        <span className="text-3xl">📋</span>
        <p className="text-sm">Nenhuma atividade registrada ainda.</p>
      </div>
    )
  }

  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.created_at)
    const key  = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([dateLabel, dayEntries]) => (
        <div key={dateLabel}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-medium text-gray-400 capitalize whitespace-nowrap">{dateLabel}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="flex flex-col gap-2">
            {dayEntries.map(entry => (
              <ActivityEntry key={entry.id} entry={entry} actionConfig={ACTION_CONFIG} statusLabels={STATUS_LABELS} />
            ))}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" size="sm" onClick={loadMore}>Carregar mais</Button>
        </div>
      )}
    </div>
  )
}

function ActivityEntry({ entry, actionConfig, statusLabels }) {
  const cfg         = actionConfig[entry.action] ?? actionConfig.item_updated
  const profileName = entry.user?.full_name ?? entry.user?.email?.split('@')[0] ?? 'Alguém'
  const itemName    = entry.item_name ?? 'item'

  function buildDescription() {
    switch (entry.action) {
      case 'item_added':
        return <span><strong>{profileName}</strong> adicionou <strong>"{itemName}"</strong></span>
      case 'item_deleted':
        return <span><strong>{profileName}</strong> removeu <strong>"{itemName}"</strong></span>
      case 'status_changed':
        return (
          <span>
            <strong>{profileName}</strong> alterou <strong>"{itemName}"</strong>
            {' '}de <span className="font-medium">{statusLabels[entry.old_value] ?? entry.old_value}</span>
            {' '}para <span className="font-medium">{statusLabels[entry.new_value] ?? entry.new_value}</span>
          </span>
        )
      case 'item_updated':
        return <span><strong>{profileName}</strong> editou <strong>"{itemName}"</strong></span>
      case 'market_completed':
        return <span><strong>{profileName}</strong> concluiu a lista de compras</span>
      case 'member_joined':
        return <span><strong>{profileName}</strong> entrou no caldeirão</span>
      case 'member_left':
        return <span><strong>{profileName}</strong> saiu do caldeirão</span>
      default:
        return <span><strong>{profileName}</strong> atualizou <strong>"{itemName}"</strong></span>
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bg}`}>
      <Avatar name={profileName} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{buildDescription()}</p>
        <p className="text-xs text-gray-400 mt-0.5"
           title={new Date(entry.created_at).toLocaleString('pt-BR')}>
          {timeAgo(entry.created_at)}
        </p>
      </div>
      <span className="text-lg flex-shrink-0" aria-hidden="true">{cfg.icon}</span>
    </div>
  )
}
