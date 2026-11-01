import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/defaults'

export function StatusBadge({ status, className }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      cfg.bg, cfg.text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    green:   'bg-green-100 text-green-700',
    amber:   'bg-amber-100 text-amber-700',
    red:     'bg-red-100 text-red-700',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
