import React from 'react'
import { COLORS } from '@/lib/colors'

/**
 * Ilustração SVG do Caldeirão Místico borbulhante com fumaça arcana
 */
export function CauldronEmblem({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="cauldronGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={COLORS.gems.out_of_stock.mid} stopOpacity="0.45" />
          <stop offset="60%" stopColor={COLORS.cauldron.potionStart} stopOpacity="0.18" />
          <stop offset="100%" stopColor={COLORS.common.black} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="smokeGrad" x1="70" y1="8" x2="70" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={COLORS.cauldron.smokePink} stopOpacity="0.85" />
          <stop offset="55%" stopColor={COLORS.cauldron.smokePurple} stopOpacity="0.65" />
          <stop offset="100%" stopColor={COLORS.cauldron.potionStart} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="potionGrad" x1="35" y1="58" x2="105" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={COLORS.cauldron.potionStart} />
          <stop offset="50%" stopColor={COLORS.cauldron.potionMid} />
          <stop offset="100%" stopColor={COLORS.cauldron.potionEnd} />
        </linearGradient>
        <linearGradient id="potBody" x1="70" y1="56" x2="70" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={COLORS.cauldron.bodyTop} />
          <stop offset="45%" stopColor={COLORS.cauldron.bodyMid} />
          <stop offset="100%" stopColor={COLORS.cauldron.bodyBot} />
        </linearGradient>
        <linearGradient id="goldRim" x1="25" y1="50" x2="115" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={COLORS.gold.dark} />
          <stop offset="50%" stopColor={COLORS.gold.soft} />
          <stop offset="100%" stopColor={COLORS.gold.deep} />
        </linearGradient>
      </defs>

      {/* Aura mística */}
      <circle cx="70" cy="70" r="64" fill="url(#cauldronGlow)" />

      {/* Fumaça mágica violeta */}
      <path
        d="M58 54 C46 42, 52 26, 65 20 C74 15, 68 6, 75 4 C84 10, 78 22, 86 28 C96 35, 90 48, 80 54 Z"
        fill="url(#smokeGrad)"
      />
      <path
        d="M48 52 C38 44, 42 30, 52 26 C46 36, 52 44, 58 52 Z"
        fill={COLORS.cauldron.smokeLilac}
        fillOpacity="0.5"
      />
      <path
        d="M90 52 C100 42, 96 28, 86 24 C91 34, 86 44, 82 52 Z"
        fill={COLORS.cauldron.smokePink}
        fillOpacity="0.45"
      />

      {/* Estrelas e bolhas mágicas */}
      <circle cx="56" cy="46" r="3" fill={COLORS.cauldron.potionMid} />
      <circle cx="72" cy="40" r="4" fill={COLORS.cauldron.potionStart} fillOpacity="0.85" />
      <circle cx="84" cy="48" r="2.5" fill={COLORS.cauldron.potionShine} />
      <circle cx="64" cy="28" r="2" fill={COLORS.orb.coreLight} />
      <path d="M36 30 L38 35 L43 37 L38 39 L36 44 L34 39 L29 37 L34 35 Z" fill={COLORS.cauldron.sparkYellow} fillOpacity="0.85" />
      <path d="M104 24 L105.5 28 L109.5 29.5 L105.5 31 L104 35 L102.5 31 L98.5 29.5 L102.5 28 Z" fill={COLORS.cauldron.sparkYellow} fillOpacity="0.8" />

      {/* Pés de bronze do caldeirão */}
      <path d="M44 114 L38 128 C37 130, 43 132, 46 128 L52 116 Z" fill="url(#goldRim)" />
      <path d="M96 114 L102 128 C103 130, 97 132, 94 128 L88 116 Z" fill="url(#goldRim)" />
      <path d="M68 118 L66 130 C66 132, 74 132, 74 130 L72 118 Z" fill={COLORS.gold.deep} />

      {/* Argolas laterais de ouro */}
      <circle cx="28" cy="78" r="8" stroke="url(#goldRim)" strokeWidth="3.5" fill="none" />
      <circle cx="112" cy="78" r="8" stroke="url(#goldRim)" strokeWidth="3.5" fill="none" />

      {/* Corpo do caldeirão */}
      <path
        d="M34 58 C24 74, 26 106, 48 118 C60 124, 80 124, 92 118 C114 106, 116 74, 106 58 Z"
        fill="url(#potBody)"
        stroke={COLORS.cauldron.stroke}
        strokeWidth="2"
      />
      {/* Brilho lateral no bojo */}
      <path
        d="M42 68 C35 80, 38 100, 50 110"
        stroke={COLORS.cauldron.highlight}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Borda superior do caldeirão */}
      <ellipse cx="70" cy="57" rx="39" ry="9" fill={COLORS.cauldron.rimDark} stroke="url(#goldRim)" strokeWidth="3" />

      {/* Poção verde brilhante */}
      <ellipse cx="70" cy="57" rx="34" ry="6.5" fill="url(#potionGrad)" />
      <ellipse cx="64" cy="56" rx="14" ry="2.5" fill={COLORS.cauldron.potionShine} fillOpacity="0.65" />

      {/* Ervas na base */}
      <path d="M26 126 Q38 120 48 126 Q38 130 26 126 Z" fill={COLORS.foliage.herb} />
      <path d="M114 126 Q102 120 92 126 Q102 130 114 126 Z" fill={COLORS.foliage.herb} />
    </svg>
  )
}

/**
 * Gemas facetadas de status (Verde = Em Estoque, Âmbar = Acabando, Roxo = Em Falta)
 */
export function StatusGem({ status = 'in_stock', size = 18, className = '' }) {
  const p = COLORS.gems[status] || COLORS.gems.in_stock

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: `drop-shadow(0 0 5px ${p.glow})` }}
      aria-hidden="true"
    >
      {/* Moldura dourada da gema */}
      <polygon
        points="12,1 21,8 18,21 6,21 3,8"
        fill={p.outer}
        stroke={COLORS.gold.amber}
        strokeWidth="1.4"
      />
      {/* Faceta principal */}
      <polygon points="12,2.5 19.5,8.5 17,19.5 7,19.5 4.5,8.5" fill={p.mid} />
      {/* Faceta superior clara */}
      <polygon points="12,2.5 19.5,8.5 12,12 4.5,8.5" fill={p.light} fillOpacity="0.75" />
      {/* Faceta central */}
      <polygon points="12,5.5 16.5,9.5 14.5,17 9.5,17 7.5,9.5" fill={p.mid} />
      {/* Brilho especular */}
      <polygon points="12,3.5 15,8 12,10 8.5,8" fill={p.shine} fillOpacity="0.9" />
    </svg>
  )
}

/**
 * Ornamento de canto com ramos dourados, folhas místicas, lua e estrelas
 */
export function CornerVine({ position = 'top-left', className = '' }) {
  const transforms = {
    'top-left': '',
    'top-right': 'scale(-1, 1)',
    'bottom-left': 'scale(1, -1)',
    'bottom-right': 'scale(-1, -1)',
  }

  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: transforms[position] }}
      aria-hidden="true"
    >
      {/* Moldura em ângulo dourada */}
      <path d="M6 170 L6 16 Q6 6 16 6 L170 6" stroke={COLORS.gold.base} strokeWidth="2" strokeOpacity="0.7" />
      <path d="M12 150 L12 20 Q12 12 20 12 L150 12" stroke={COLORS.gold.deep} strokeWidth="1" strokeOpacity="0.55" />

      {/* Ramo principal curvo */}
      <path
        d="M8 120 C14 70, 32 32, 118 10"
        stroke={COLORS.gold.base}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 85 C28 64, 52 48, 76 54"
        stroke={COLORS.gold.dark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Folhas verdes com nervura dourada */}
      <path d="M18 90 C6 76, 12 58, 28 64 C28 78, 22 86, 18 90 Z" fill={COLORS.foliage.dark} stroke={COLORS.gold.base} strokeWidth="1.2" />
      <path d="M36 58 C24 44, 32 26, 48 34 C46 46, 40 54, 36 58 Z" fill={COLORS.foliage.forest} stroke={COLORS.gold.base} strokeWidth="1.2" />
      <path d="M68 32 C60 16, 76 6, 90 16 C84 26, 76 30, 68 32 Z" fill={COLORS.foliage.dark} stroke={COLORS.gold.base} strokeWidth="1.2" />
      <path d="M44 68 C56 60, 72 66, 68 78 C56 80, 48 74, 44 68 Z" fill={COLORS.foliage.mid} stroke={COLORS.gold.base} strokeWidth="1.1" />
      <path d="M22 115 C10 108, 8 92, 20 94 C24 102, 24 110, 22 115 Z" fill={COLORS.foliage.forest} stroke={COLORS.gold.base} strokeWidth="1.1" />
      <path d="M100 18 C98 8, 112 4, 122 12 C114 18, 106 18, 100 18 Z" fill={COLORS.foliage.forest} stroke={COLORS.gold.base} strokeWidth="1.1" />

      {/* Lua crescente dourada */}
      <path
        d="M36 86 A10 10 0 1 1 24 72 A8 8 0 1 0 36 86 Z"
        fill={COLORS.gold.light}
        opacity="0.85"
      />

      {/* Estrelas místicas */}
      <path d="M56 96 L57.5 100 L61.5 101.5 L57.5 103 L56 107 L54.5 103 L50.5 101.5 L54.5 100 Z" fill={COLORS.gold.soft} opacity="0.85" />
      <circle cx="84" cy="44" r="2" fill={COLORS.gold.soft} opacity="0.7" />
      <circle cx="26" cy="134" r="1.8" fill={COLORS.gold.soft} opacity="0.7" />
    </svg>
  )
}

/**
 * Cantoneiras botânicas para os 4 cantos dos Cards de Itens (estilo carta de tarô/alquimia)
 */
export function CardCornerLeaves() {
  const Corner = ({ style }) => (
    <svg className="w-7 h-7 pointer-events-none select-none" style={style} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M2 24 L2 6 Q2 2 6 2 L24 2" stroke={COLORS.gold.amber} strokeWidth="1.5" strokeOpacity="0.85" />
      <path d="M4 18 C4 10, 10 4, 18 4" stroke={COLORS.gold.dark} strokeWidth="1.2" />
      <path d="M5 14 C2 9, 6 4, 11 7 C10 11, 7 13, 5 14 Z" fill={COLORS.foliage.mid} stroke={COLORS.gold.amber} strokeWidth="0.9" />
      <path d="M14 5 C9 2, 4 6, 7 11 C11 10, 13 7, 14 5 Z" fill={COLORS.foliage.light} stroke={COLORS.gold.amber} strokeWidth="0.9" />
    </svg>
  )

  return (
    <>
      <div className="absolute top-1 left-1"><Corner /></div>
      <div className="absolute top-1 right-1"><Corner style={{ transform: 'scaleX(-1)' }} /></div>
      <div className="absolute bottom-1 left-1"><Corner style={{ transform: 'scaleY(-1)' }} /></div>
      <div className="absolute bottom-1 right-1"><Corner style={{ transform: 'scale(-1, -1)' }} /></div>
    </>
  )
}

/**
 * Botão Flutuante de Orbe Mágica "+ Adicionar" com ramos de ouro
 */
export function AddOrbButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar item ao caldeirão"
      className="group relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 focus:outline-none transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 140 140" className="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="orbCore" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={COLORS.orb.coreLight} />
            <stop offset="28%" stopColor={COLORS.orb.coreMid} />
            <stop offset="65%" stopColor={COLORS.orb.coreDeep} />
            <stop offset="100%" stopColor={COLORS.orb.coreDark} />
          </radialGradient>
          <linearGradient id="orbGold" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={COLORS.gold.bright} />
            <stop offset="50%" stopColor={COLORS.gold.amber} />
            <stop offset="100%" stopColor={COLORS.gold.bronze} />
          </linearGradient>
        </defs>

        {/* Brilho externo da orbe */}
        <circle cx="70" cy="74" r="54" fill={COLORS.cauldron.smokePurple} fillOpacity="0.32" className="group-hover:fill-opacity-50 transition-all" />

        {/* Ramos de louro dourados à esquerda */}
        <path d="M18 98 C8 78, 10 52, 26 36" stroke="url(#orbGold)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 84 C4 80, 4 70, 14 72 Z" fill={COLORS.foliage.mid} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M12 66 C2 60, 4 50, 14 54 Z" fill={COLORS.foliage.light} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M18 48 C10 40, 14 32, 24 38 Z" fill={COLORS.foliage.mid} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M26 108 C14 106, 10 96, 20 96 Z" fill={COLORS.gold.amber} />

        {/* Ramos de louro dourados à direita */}
        <path d="M122 98 C132 78, 130 52, 114 36" stroke="url(#orbGold)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M126 84 C136 80, 136 70, 126 72 Z" fill={COLORS.foliage.mid} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M128 66 C138 60, 136 50, 126 54 Z" fill={COLORS.foliage.light} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M122 48 C130 40, 126 32, 116 38 Z" fill={COLORS.foliage.mid} stroke="url(#orbGold)" strokeWidth="1.2" />
        <path d="M114 108 C126 106, 130 96, 120 96 Z" fill={COLORS.gold.amber} />

        {/* Argola superior de amuleto */}
        <circle cx="70" cy="18" r="7" stroke="url(#orbGold)" strokeWidth="3.5" fill={COLORS.orb.topLoop} />
        <rect x="65" y="22" width="10" height="6" rx="2" fill="url(#orbGold)" />

        {/* Moldura circular de ouro envelhecido */}
        <circle cx="70" cy="74" r="46" fill={COLORS.orb.ringFill} stroke="url(#orbGold)" strokeWidth="4.5" />
        <circle cx="70" cy="74" r="41" stroke={COLORS.gold.bright} strokeWidth="1" strokeOpacity="0.6" />

        {/* Esfera de cristal roxa */}
        <circle cx="70" cy="74" r="39" fill="url(#orbCore)" />

        {/* Reflexo vítreo e estrelas internas */}
        <ellipse cx="56" cy="54" rx="14" ry="7" transform="rotate(-25 56 54)" fill={COLORS.common.white} fillOpacity="0.35" />
        <circle cx="88" cy="92" r="2" fill={COLORS.orb.coreLight} fillOpacity="0.8" />
        <circle cx="48" cy="86" r="1.5" fill={COLORS.orb.coreLight} fillOpacity="0.7" />
        <path d="M86 52 L87 55 L90 56 L87 57 L86 60 L85 57 L82 56 L85 55 Z" fill={COLORS.common.white} fillOpacity="0.8" />
      </svg>

      {/* Texto centralizado sobre a orbe */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 pointer-events-none">
        <span className="text-white text-xl sm:text-2xl font-bold leading-none drop-shadow-orb-text">
          +
        </span>
        <span className="font-serif font-bold text-[11px] sm:text-xs tracking-wide text-gold-cream drop-shadow-orb-text">
          Adicionar
        </span>
      </div>
    </button>
  )
}
