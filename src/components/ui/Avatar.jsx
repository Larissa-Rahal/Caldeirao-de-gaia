import { cn, getInitials } from '@/lib/utils'

const colors = [
  'bg-violet-500', 'bg-blue-500', 'bg-green-500',
  'bg-amber-500',  'bg-pink-500', 'bg-teal-500',
]

function colorFromString(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const color = colorFromString(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold text-white',
      color, sizes[size], className
    )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
