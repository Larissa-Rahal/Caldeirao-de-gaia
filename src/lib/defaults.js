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

/**
 * Placeholder SVG por categoria — ícone flat estilo "pote de despensa"
 * Retorna data URL — sem JSX, funciona em ficheiros .js
 */
export function getCategoryPlaceholder(categoryName, emoji) {
  var name  = (categoryName || '').toLowerCase()
  var icon  = emoji || '📦'

  var colorMap = [
    ['mercearia',       '#F5F0E8'],
    ['higiene',         '#F0F0FF'],
    ['limpeza',         '#E8F5F0'],
    ['frigori',         '#E8F4FF'],
    ['congelados',      '#EAF4FF'],
    ['bebidas',         '#FFF0E8'],
    ['farm',            '#FFE8E8'],
    ['hortifr',         '#E8FFE8'],
    ['latic',           '#FFFDE8'],
    ['carnes',          '#FFE8F0'],
  ]

  var bg = '#F0EAF8'
  for (var i = 0; i < colorMap.length; i++) {
    if (name.indexOf(colorMap[i][0]) !== -1) { bg = colorMap[i][1]; break }
  }

  var svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">',
    '<rect width="120" height="120" fill="' + bg + '" rx="16"/>',
    '<text x="60" y="76" font-size="52" text-anchor="middle">' + icon + '</text>',
    '</svg>'
  ].join('')

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** Labels e cores para cada status */
export const STATUS_CONFIG = {
  in_stock: {
    label:  'Em Estoque',
    color:  'green',
    bg:     'bg-green-100',
    text:   'text-green-800',
    border: 'border-green-200',
    dot:    'bg-green-500',
    icon:   '✅',
  },
  running_low: {
    label:  'Acabando',
    color:  'amber',
    bg:     'bg-amber-100',
    text:   'text-amber-800',
    border: 'border-amber-200',
    dot:    'bg-amber-500',
    icon:   '⚠️',
  },
  out_of_stock: {
    label:  'Em Falta',
    color:  'red',
    bg:     'bg-red-100',
    text:   'text-red-800',
    border: 'border-red-200',
    dot:    'bg-red-500',
    icon:   '❌',
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
  var origin = (typeof window !== 'undefined') ? window.location.origin : ''
  return origin + '/?invite=' + code
}
