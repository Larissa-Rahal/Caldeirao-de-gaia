import { COLORS } from '@/lib/colors'

/** Categorias criadas automaticamente ao criar uma nova casa */
export const DEFAULT_CATEGORIES = [
  { name: 'Mercearia',       emoji: '🛒', sort_order: 0 },
  { name: 'Higiene Pessoal', emoji: '🪥', sort_order: 1 },
  { name: 'Limpeza',         emoji: '🧹', sort_order: 2 },
  { name: 'Geladeira',       emoji: '❄️',  sort_order: 3 },
  { name: 'Congelados',      emoji: '🧊', sort_order: 4 },
  { name: 'Bebidas',         emoji: '🥤', sort_order: 5 },
  { name: 'Farmácia',        emoji: '💊', sort_order: 6 },
  { name: 'Outros',          emoji: '📦', sort_order: 7 },
]

/**
 * Ilustrações SVG estilo Grimório/Alquimia por nome do item ou categoria.
 * Retorna data URL — funciona em qualquer <img src={...} />.
 */
export function getCategoryPlaceholder(categoryName, emoji, itemName = '') {
  const cat  = (categoryName || '').toLowerCase()
  const item = (itemName || '').toLowerCase()
  const c    = COLORS.illustrations
  const blk  = COLORS.common.black
  const gld  = COLORS.gold.amber

  let illustration = ''

  if (/a[cç][uú]car|sal\b|mel\b|geleia|doce|pote|fermento|leite em p[oó]|maionese|requeij[aã]o|iogurte/.test(item)) {
    // Pote de vidro mágico brilhante com tampa dourada
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.potionMid}" stop-opacity="0.45"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<ellipse cx="60" cy="96" rx="32" ry="10" fill="${c.shadowDark}" opacity="0.45"/>`,
      `<path d="M34 46 C26 56, 26 84, 38 94 C48 100, 72 100, 82 94 C94 84, 94 56, 86 46 Z" fill="${c.glassFill}" fill-opacity="0.32" stroke="${c.glassStroke}" stroke-width="2"/>`,
      `<path d="M33 66 Q60 60 87 66 C90 78, 86 90, 78 94 C68 98, 52 98, 42 94 C34 90, 30 78, 33 66 Z" fill="${c.powderLight}"/>`,
      `<path d="M35 66 Q60 60 85 66 Q60 72 35 66 Z" fill="${c.powderMid}"/>`,
      `<ellipse cx="60" cy="44" rx="26" ry="7" fill="${c.amberDark}" stroke="${c.amberPale}" stroke-width="1.5"/>`,
      `<path d="M40 44 C42 34, 78 34, 80 44 Z" fill="${c.amberMid}" stroke="${c.amberPale}" stroke-width="1.2"/>`,
      `<circle cx="60" cy="31" r="5.5" fill="${c.amberBright}" stroke="${c.amberCream}" stroke-width="1.2"/>`,
      `<circle cx="24" cy="48" r="2" fill="${c.sparkYellow}"/><circle cx="95" cy="52" r="2.2" fill="${c.emeraldLight}"/><circle cx="88" cy="92" r="2" fill="${c.emeraldBright}"/>`,
    ].join('')
  } else if (/azeite|[oó]leo|vinagre|vinho|suco|[aá]gua\b|leite\b|bebida|refrigerante|cerveja|ch[aá]\b/.test(item) || cat.indexOf('bebidas') !== -1) {
    // Frasco de elixir dourado/esmeralda com rolha
    const isMilkOrJuice = /leite|suco|refrigerante/.test(item)
    const liquidMain    = isMilkOrJuice ? c.amberMid : c.limeMid
    const liquidTop     = isMilkOrJuice ? c.amberPale : c.limeLight
    illustration = [
      `<radialGradient id="g" cx="50%" cy="60%" r="48%"><stop offset="0%" stop-color="${liquidMain}" stop-opacity="0.4"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<rect x="53" y="18" width="14" height="10" rx="2.5" fill="${c.amberDeep}" stroke="${c.amberPale}" stroke-width="1.2"/>`,
      `<rect x="50" y="27" width="20" height="6" rx="3" fill="${c.powderMid}" stroke="${c.powderStroke}" stroke-width="1.2"/>`,
      `<path d="M53 33 L51 46 C34 54, 32 78, 40 92 C48 100, 72 100, 80 92 C88 78, 86 54, 69 46 L67 33 Z" fill="${c.limePale}" fill-opacity="0.25" stroke="${c.limeStroke}" stroke-width="2"/>`,
      `<path d="M37 64 Q60 58 83 64 C86 76, 82 88, 76 92 C68 97, 52 97, 44 92 C38 88, 34 76, 37 64 Z" fill="${liquidMain}"/>`,
      `<ellipse cx="60" cy="64" rx="23" ry="5" fill="${liquidTop}"/>`,
      `<path d="M46 54 C38 60, 44 48, 52 46" stroke="${c.amberDark}" stroke-width="2" fill="none"/>`,
      `<circle cx="48" cy="76" r="4" fill="${c.limePale}" opacity="0.6"/><circle cx="92" cy="68" r="2.2" fill="${c.sparkYellow}"/><circle cx="28" cy="74" r="2" fill="${liquidTop}"/>`,
    ].join('')
  } else if (/caf[eé]|cacau|achocolatado|chocolate/.test(item)) {
    // Saco de café fumegante com grão gravado
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.amberDark}" stop-opacity="0.32"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<path d="M52 38 C46 28, 56 20, 52 12 M64 36 C60 26, 70 18, 66 10 M74 40 C70 30, 78 24, 74 16" stroke="${c.powderStroke}" stroke-width="2.2" stroke-linecap="round" opacity="0.65" fill="none"/>`,
      `<path d="M36 48 L84 48 L88 92 C88 96, 82 99, 60 99 C38 99, 32 96, 32 92 Z" fill="${c.coffeeBag}" stroke="${gld}" stroke-width="1.5"/>`,
      `<ellipse cx="60" cy="48" rx="23" ry="8" fill="${c.coffeeDark}" stroke="${c.amberDeep}" stroke-width="1.5"/>`,
      `<circle cx="52" cy="47" r="2.5" fill="${c.coffeeBean}"/><circle cx="60" cy="45" r="2.5" fill="${c.coffeeBean}"/><circle cx="68" cy="48" r="2.5" fill="${c.coffeeBean}"/>`,
      `<ellipse cx="60" cy="74" rx="8" ry="11" transform="rotate(20 60 74)" fill="${c.coffeeDark}" stroke="${c.amberPale}" stroke-width="1"/>`,
      `<path d="M57 65 Q62 74 57 83" stroke="${c.coffeeBag}" stroke-width="1.6" fill="none"/>`,
    ].join('')
  } else if (/aveia|trigo|cereal|granola|erva|tempero|or[eé]gano|manjeric[aã]o|alecrim|folha|hortifr|verdura|legume|ervilha|milho|molho|tomate|alho|cebola|batata|cenoura/.test(item) || cat.indexOf('hortifr') !== -1) {
    // Ramos dourados e botânicos de aveia/ervas/colheita
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.amberMid}" stop-opacity="0.35"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<path d="M46 96 C52 72, 58 46, 72 22" stroke="${c.amberDark}" stroke-width="2.5" stroke-linecap="round"/>`,
      `<path d="M68 96 C62 72, 54 48, 42 26" stroke="${c.limeDark}" stroke-width="2.3" stroke-linecap="round"/>`,
      `<ellipse cx="56" cy="52" rx="4.5" ry="8.5" transform="rotate(-25 56 52)" fill="${c.amberMid}" stroke="${c.amberPale}" stroke-width="1"/>`,
      `<ellipse cx="66" cy="44" rx="4.5" ry="8.5" transform="rotate(25 66 44)" fill="${c.amberBright}" stroke="${c.amberPale}" stroke-width="1"/>`,
      `<ellipse cx="62" cy="32" rx="4.5" ry="8.5" transform="rotate(-15 62 32)" fill="${c.amberMid}" stroke="${c.amberPale}" stroke-width="1"/>`,
      `<ellipse cx="72" cy="58" rx="4.5" ry="8.5" transform="rotate(35 72 58)" fill="${c.limeMid}" stroke="${c.limeLight}" stroke-width="1"/>`,
      `<ellipse cx="46" cy="64" rx="4.5" ry="8.5" transform="rotate(-35 46 64)" fill="${c.limeDark}" stroke="${c.limeLight}" stroke-width="1"/>`,
      `<circle cx="34" cy="42" r="2" fill="${c.sparkYellow}"/><circle cx="84" cy="38" r="2" fill="${c.sparkYellow}"/>`,
    ].join('')
  } else if (/queijo|manteiga|margarina|latic|p[aã]o|pizza|bolo|biscoito|bolacha|torrada|ovos?/.test(item)) {
    // Roda de queijo dourado / provisão de tavernas místicas
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.amberBright}" stop-opacity="0.38"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<path d="M28 58 L60 36 L92 54 L92 80 Q60 96 28 80 Z" fill="${c.amberMid}" stroke="${c.amberPale}" stroke-width="1.8"/>`,
      `<path d="M28 58 L60 36 L92 54 Q60 70 28 58 Z" fill="${c.amberLight}" stroke="${c.amberCream}" stroke-width="1.4"/>`,
      `<circle cx="48" cy="70" r="4" fill="${c.amberDeep}" opacity="0.65"/><circle cx="68" cy="74" r="5" fill="${c.amberDeep}" opacity="0.65"/><circle cx="78" cy="64" r="3" fill="${c.amberDeep}" opacity="0.65"/>`,
      `<circle cx="32" cy="36" r="2" fill="${c.sparkYellow}"/><circle cx="90" cy="38" r="2.2" fill="${c.sparkYellow}"/>`,
    ].join('')
  } else if (/carne|frango|peito|bife|presunto|lingui[cç]a|bacon|peixe|hamb[uú]rguer|salsicha/.test(item) || cat.indexOf('congelados') !== -1 || cat.indexOf('geladeira') !== -1) {
    // Provisão da taverna / corte nobre com ervas e cristal de gelo
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.orangeGlow}" stop-opacity="0.35"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<ellipse cx="60" cy="84" rx="36" ry="12" fill="${c.platterSlate}" stroke="${gld}" stroke-width="1.8"/>`,
      `<path d="M34 74 C32 50, 88 50, 86 74 C86 84, 34 84, 34 74 Z" fill="${c.amberDeep}" stroke="${c.amberPale}" stroke-width="1.6"/>`,
      `<path d="M44 62 Q60 54 76 62" stroke="${c.amberLight}" stroke-width="2" fill="none" opacity="0.75"/>`,
      `<path d="M52 50 C46 42, 56 38, 60 48 C64 38, 74 42, 68 50 Z" fill="${c.emeraldMid}" stroke="${c.emeraldLight}" stroke-width="1"/>`,
      `<circle cx="30" cy="44" r="2" fill="${c.sparkYellow}"/><circle cx="90" cy="46" r="2" fill="${c.sparkYellow}"/>`,
    ].join('')
  } else if (/arroz|feij[aã]o|farinha|lentilha|gr[aã]o|macarr[aã]o|massa/.test(item) || cat.indexOf('mercearia') !== -1) {
    // Saco de estopa rúnico com grãos
    const isDarkGrain = /feij[aã]o|lentilha/.test(item)
    const grainFill   = isDarkGrain ? c.coffeeBean : c.powderLight
    const grainStroke = isDarkGrain ? c.amberDeep  : c.powderStroke
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${gld}" stop-opacity="0.3"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<path d="M36 44 Q60 22 84 44 Z" fill="${grainFill}" stroke="${grainStroke}" stroke-width="1.5"/>`,
      `<path d="M32 44 L88 44 L92 92 C92 97, 82 100, 60 100 C38 100, 28 97, 28 92 Z" fill="${c.burlapFill}" stroke="${gld}" stroke-width="1.6"/>`,
      `<path d="M30 46 Q60 54 90 46" stroke="${c.burlapCord}" stroke-width="3" fill="none"/>`,
      `<path d="M60 60 L60 86 M60 62 L68 68 L60 74 M52 68 L60 74 L52 82" stroke="${c.burlapRune}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
      `<circle cx="30" cy="34" r="2" fill="${c.sparkYellow}"/><circle cx="88" cy="36" r="2" fill="${c.sparkYellow}"/>`,
    ].join('')
  } else if (/antiss[eé]ptico|curativo|gaze|soro|term[oô]metro|rem[eé]dio|vitamina|dipirona|paracetamol|algod[aã]o/.test(item) || cat.indexOf('farm') !== -1) {
    // Elixir de cura rubi/esmeralda da botica
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.rubyGlow}" stop-opacity="0.4"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<rect x="52" y="18" width="16" height="9" rx="2.5" fill="${c.amberDeep}" stroke="${c.amberPale}" stroke-width="1.2"/>`,
      `<path d="M50 27 L70 27 L68 42 L84 56 L84 90 C84 96, 76 100, 60 100 C44 100, 36 96, 36 90 L36 56 L52 42 Z" fill="${c.rubyGlass}" fill-opacity="0.25" stroke="${c.rubyStroke}" stroke-width="2"/>`,
      `<path d="M39 62 L81 62 L81 88 C81 94, 73 97, 60 97 C47 97, 39 94, 39 88 Z" fill="${c.rubyMain}"/>`,
      `<path d="M57 68 L63 68 L63 74 L69 74 L69 80 L63 80 L63 86 L57 86 L57 80 L51 80 L51 74 L57 74 Z" fill="${c.rubyCross}" opacity="0.9"/>`,
      `<circle cx="30" cy="40" r="2" fill="${c.sparkYellow}"/><circle cx="90" cy="44" r="2" fill="${c.sparkYellow}"/>`,
    ].join('')
  } else {
    // Poção alquímica mística (Limpeza, Higiene e Utilidades)
    illustration = [
      `<radialGradient id="g" cx="50%" cy="55%" r="48%"><stop offset="0%" stop-color="${c.potionMid}" stop-opacity="0.45"/><stop offset="100%" stop-color="${blk}" stop-opacity="0"/></radialGradient>`,
      '<circle cx="60" cy="64" r="52" fill="url(#g)"/>',
      `<rect x="53" y="20" width="14" height="9" rx="2" fill="${c.amberDeep}" stroke="${c.amberPale}" stroke-width="1.2"/>`,
      `<path d="M52 29 L68 29 L66 44 C84 52, 88 78, 76 92 C66 100, 54 100, 44 92 C32 78, 36 52, 54 44 Z" fill="${c.potionGlass}" fill-opacity="0.28" stroke="${c.potionStroke}" stroke-width="2"/>`,
      `<path d="M38 68 Q60 62 82 68 C84 78, 80 88, 74 92 C66 98, 54 98, 46 92 C40 88, 36 78, 38 68 Z" fill="${c.potionDeep}"/>`,
      `<ellipse cx="60" cy="68" rx="22" ry="5" fill="${c.potionMid}"/>`,
      `<circle cx="52" cy="80" r="3.5" fill="${c.potionBubble}" opacity="0.65"/><circle cx="88" cy="48" r="2" fill="${c.sparkYellow}"/><circle cx="30" cy="52" r="2" fill="${c.sparkYellow}"/>`,
    ].join('')
  }

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">',
    illustration,
    '</svg>',
  ].join('')

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

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

export const STATUS_CYCLE = {
  in_stock:     'running_low',
  running_low:  'out_of_stock',
  out_of_stock: 'in_stock',
}

export function buildInviteUrl() {
  return 'https://estoque-casa-five.vercel.app/'
}
