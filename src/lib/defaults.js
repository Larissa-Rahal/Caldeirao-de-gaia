/** Categorias criadas automaticamente ao criar uma nova casa */
export const DEFAULT_CATEGORIES = [
  { name: 'Mercearia',        emoji: '🛒', sort_order: 0 },
  { name: 'Higiene Pessoal',  emoji: '🪥', sort_order: 1 },
  { name: 'Limpeza',          emoji: '🧹', sort_order: 2 },
  { name: 'Frigorífico',      emoji: '❄️',  sort_order: 3 },
  { name: 'Congelados',       emoji: '🧊', sort_order: 4 },
  { name: 'Bebidas',          emoji: '🥤', sort_order: 5 },
  { name: 'Farmácia',         emoji: '💊', sort_order: 6 },
  { name: 'Outros',           emoji: '📦', sort_order: 7 },
]

/** Labels e cores para cada status */
export const STATUS_CONFIG = {
  in_stock: {
    label: 'Em Estoque',
    color: 'green',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500',
    icon: '✅',
  },
  running_low: {
    label: 'Acabando',
    color: 'amber',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: '⚠️',
  },
  out_of_stock: {
    label: 'Em Falta',
    color: 'red',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
    icon: '❌',
  },
}

/** Ciclo de status ao clicar no toggle */
export const STATUS_CYCLE = {
  in_stock:     'running_low',
  running_low:  'out_of_stock',
  out_of_stock: 'in_stock',
}

/** Gera a URL de convite com base no código */
export function buildInviteUrl(code) {
  const base = import.meta.env.VITE_APP_URL || window.location.origin
  return `${base}/?invite=${code}`
}
