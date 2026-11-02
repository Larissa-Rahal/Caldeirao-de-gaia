/**
 * Paleta central de cores (RGB / RGBA) para uso em componentes JavaScript e SVGs.
 * Sincronizada com `src/styles/colors.css` e `tailwind.config.js`.
 */
export const COLORS = {
  common: {
    black: 'rgb(0, 0, 0)',
    white: 'rgb(255, 255, 255)',
  },

  gold: {
    base:    'rgb(197, 155, 39)',  // #C59B27
    light:   'rgb(229, 184, 66)',  // #E5B842
    bright:  'rgb(253, 230, 138)', // #FDE68A
    soft:    'rgb(243, 208, 120)', // #F3D078
    amber:   'rgb(212, 160, 23)',  // #D4A017
    dark:    'rgb(154, 111, 24)',  // #9A6F18
    deep:    'rgb(138, 94, 16)',   // #8A5E10
    bronze:  'rgb(120, 81, 9)',    // #785109
    cream:   'rgb(255, 245, 214)', // #FFF5D6
  },

  foliage: {
    dark:    'rgb(31, 81, 50)',    // #1F5132
    mid:     'rgb(45, 106, 79)',   // #2D6A4F
    forest:  'rgb(41, 107, 66)',   // #296B42
    light:   'rgb(64, 145, 108)',  // #40916C
    herb:    'rgb(46, 111, 64)',   // #2E6F40
  },

  cauldron: {
    rimDark:     'rgb(30, 20, 41)',     // #1E1429
    bodyTop:     'rgb(59, 45, 74)',     // #3B2D4A
    bodyMid:     'rgb(33, 23, 43)',     // #21172B
    bodyBot:     'rgb(17, 11, 24)',     // #110B18
    stroke:      'rgb(107, 78, 35)',    // #6B4E23
    highlight:   'rgb(126, 107, 150)',  // #7E6B96
    potionStart: 'rgb(34, 197, 94)',    // #22C55E
    potionMid:   'rgb(134, 239, 172)',  // #86EFAC
    potionEnd:   'rgb(22, 163, 74)',    // #16A34A
    potionShine: 'rgb(220, 252, 231)',  // #DCFCE7
    smokePink:   'rgb(232, 121, 249)',  // #E879F9
    smokePurple: 'rgb(147, 51, 234)',   // #9333EA
    smokeLilac:  'rgb(192, 132, 252)',  // #C084FC
    sparkYellow: 'rgb(253, 224, 71)',   // #FDE047
  },

  orb: {
    coreLight: 'rgb(245, 208, 254)', // #F5D0FE
    coreMid:   'rgb(192, 132, 252)', // #C084FC
    coreDeep:  'rgb(126, 34, 206)',  // #7E22CE
    coreDark:  'rgb(59, 7, 100)',    // #3B0764
    ringFill:  'rgb(26, 14, 46)',    // #1A0E2E
    topLoop:   'rgb(26, 16, 40)',    // #1A1028
  },

  gems: {
    in_stock: {
      outer: 'rgb(21, 128, 61)',        // #15803D
      mid:   'rgb(34, 197, 94)',        // #22C55E
      light: 'rgb(134, 239, 172)',      // #86EFAC
      shine: 'rgb(220, 252, 231)',      // #DCFCE7
      glow:  'rgba(34, 197, 94, 0.55)',
    },
    running_low: {
      outer: 'rgb(180, 83, 9)',         // #B45309
      mid:   'rgb(245, 158, 11)',       // #F59E0B
      light: 'rgb(252, 211, 77)',       // #FCD34D
      shine: 'rgb(254, 243, 199)',      // #FEF3C7
      glow:  'rgba(245, 158, 11, 0.55)',
    },
    out_of_stock: {
      outer: 'rgb(107, 33, 168)',       // #6B21A8
      mid:   'rgb(168, 85, 247)',       // #A855F7
      light: 'rgb(216, 180, 254)',      // #D8B4FE
      shine: 'rgb(250, 245, 255)',      // #FAF5FF
      glow:  'rgba(168, 85, 247, 0.55)',
    },
  },

  illustrations: {
    shadowDark:    'rgb(18, 8, 32)',      // #120820
    glassFill:     'rgb(221, 214, 254)',  // #DDD6FE
    glassStroke:   'rgb(196, 181, 253)',  // #C4B5FD
    powderLight:   'rgb(248, 250, 252)',  // #F8FAFC
    powderMid:     'rgb(226, 232, 240)',  // #E2E8F0
    powderStroke:  'rgb(203, 213, 225)',  // #CBD5E1
    amberDeep:     'rgb(180, 83, 9)',     // #B45309
    amberDark:     'rgb(217, 119, 6)',    // #D97706
    amberMid:      'rgb(245, 158, 11)',   // #F59E0B
    amberBright:   'rgb(251, 191, 36)',   // #FBBF24
    amberLight:    'rgb(252, 211, 77)',   // #FCD34D
    amberPale:     'rgb(253, 230, 138)',  // #FDE68A
    amberCream:    'rgb(254, 243, 199)',  // #FEF3C7
    sparkYellow:   'rgb(253, 224, 71)',   // #FDE047
    emeraldBright: 'rgb(74, 222, 128)',   // #4ADE80
    emeraldLight:  'rgb(134, 239, 172)',  // #86EFAC
    emeraldMid:    'rgb(34, 197, 94)',    // #22C55E
    limeDark:      'rgb(101, 163, 13)',   // #65A30D
    limeMid:       'rgb(132, 204, 22)',   // #84CC16
    limeLight:     'rgb(190, 242, 100)',  // #BEF264
    limeStroke:    'rgb(217, 249, 157)',  // #D9F99D
    limePale:      'rgb(236, 252, 203)',  // #ECFCCB
    coffeeBag:     'rgb(146, 98, 57)',    // #926239
    coffeeDark:    'rgb(69, 26, 3)',      // #451A03
    coffeeBean:    'rgb(120, 53, 15)',    // #78350F
    orangeGlow:    'rgb(249, 115, 22)',   // #F97316
    platterSlate:  'rgb(100, 116, 139)',  // #64748B
    burlapFill:    'rgb(166, 123, 91)',   // #A67B5B
    burlapCord:    'rgb(120, 81, 47)',    // #78512F
    burlapRune:    'rgb(92, 58, 33)',     // #5C3A21
    rubyGlow:      'rgb(244, 63, 94)',    // #F43F5E
    rubyMain:      'rgb(225, 29, 72)',    // #E11D48
    rubyStroke:    'rgb(253, 164, 175)',  // #FDA4AF
    rubyGlass:     'rgb(255, 228, 230)',  // #FFE4E6
    rubyCross:     'rgb(255, 241, 242)',  // #FFF1F2
    potionGlass:   'rgb(233, 213, 255)',  // #E9D5FF
    potionStroke:  'rgb(216, 180, 254)',  // #D8B4FE
    potionDeep:    'rgb(147, 51, 234)',   // #9333EA
    potionMid:     'rgb(192, 132, 252)',  // #C084FC
    potionBubble:  'rgb(245, 208, 254)',  // #F5D0FE
  },
}
