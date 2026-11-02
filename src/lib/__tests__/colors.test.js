import { describe, it, expect } from 'vitest'
import { COLORS } from '@/lib/colors'

describe('src/lib/colors.js', () => {
  it('exporta a paleta central COLORS em formato rgb/rgba (common, gold, foliage, illustrations)', () => {
    expect(COLORS.common.black).toBe('rgb(0, 0, 0)')
    expect(COLORS.common.white).toBe('rgb(255, 255, 255)')
    expect(COLORS.gold.base).toBe('rgb(197, 155, 39)')
    expect(COLORS.gold.light).toBe('rgb(229, 184, 66)')
    expect(COLORS.foliage.mid).toBe('rgb(45, 106, 79)')
    expect(COLORS.illustrations.amberMid).toBe('rgb(245, 158, 11)')
    expect(COLORS.illustrations.rubyMain).toBe('rgb(225, 29, 72)')
  })

  it('contém as paletas completas das gemas de status (in_stock, running_low, out_of_stock)', () => {
    for (const status of ['in_stock', 'running_low', 'out_of_stock']) {
      const gem = COLORS.gems[status]
      expect(gem).toBeDefined()
      expect(gem.outer).toMatch(/^rgb\(/)
      expect(gem.mid).toMatch(/^rgb\(/)
      expect(gem.light).toMatch(/^rgb\(/)
      expect(gem.shine).toMatch(/^rgb\(/)
      expect(gem.glow).toMatch(/^rgba\(/)
    }
  })
})
