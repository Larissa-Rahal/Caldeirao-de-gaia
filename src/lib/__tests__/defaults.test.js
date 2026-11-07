import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CATEGORIES,
  STATUS_CONFIG,
  STATUS_CYCLE,
  getCategoryPlaceholder,
  buildInviteUrl,
  buildInviteMessage,
} from '@/lib/defaults'

describe('src/lib/defaults.js', () => {
  describe('DEFAULT_CATEGORIES', () => {
    it('contém as 8 categorias padrão ordenadas por sort_order', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(8)
      expect(DEFAULT_CATEGORIES[0]).toEqual({ name: 'Mercearia', emoji: '🛒', sort_order: 0 })
      expect(DEFAULT_CATEGORIES[7]).toEqual({ name: 'Outros', emoji: '📦', sort_order: 7 })
      DEFAULT_CATEGORIES.forEach((cat, idx) => {
        expect(cat.name).toBeTruthy()
        expect(cat.emoji).toBeTruthy()
        expect(cat.sort_order).toBe(idx)
      })
    })
  })

  describe('STATUS_CONFIG & STATUS_CYCLE', () => {
    it('define configuração completa para in_stock, running_low e out_of_stock', () => {
      expect(STATUS_CONFIG.in_stock.label).toBe('Em Estoque')
      expect(STATUS_CONFIG.running_low.label).toBe('Acabando')
      expect(STATUS_CONFIG.out_of_stock.label).toBe('Em Falta')
    })

    it('cicla corretamente entre os estados de estoque', () => {
      expect(STATUS_CYCLE.in_stock).toBe('running_low')
      expect(STATUS_CYCLE.running_low).toBe('out_of_stock')
      expect(STATUS_CYCLE.out_of_stock).toBe('in_stock')
    })
  })

  describe('getCategoryPlaceholder()', () => {
    it('retorna um data URI SVG válido para diferentes itens e categorias', () => {
      const sugarSvg  = getCategoryPlaceholder('Mercearia', '🛒', 'Açúcar')
      const oliveSvg  = getCategoryPlaceholder('Mercearia', '🛒', 'Azeite')
      const coffeeSvg = getCategoryPlaceholder('Mercearia', '🛒', 'Café')
      const cheeseSvg = getCategoryPlaceholder('Geladeira', '❄️', 'Queijo')
      const pharmaSvg = getCategoryPlaceholder('Farmácia', '💊', 'Antisséptico')
      const potionSvg = getCategoryPlaceholder('Limpeza', '🧹', 'Detergente')

      for (const uri of [sugarSvg, oliveSvg, coffeeSvg, cheeseSvg, pharmaSvg, potionSvg]) {
        expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
        const decoded = decodeURIComponent(uri.replace('data:image/svg+xml;charset=utf-8,', ''))
        expect(decoded).toContain('<svg')
        expect(decoded).toContain('</svg>')
      }

      // Garante que itens distintos geram ilustrações temáticas distintas
      expect(sugarSvg).not.toBe(coffeeSvg)
      expect(oliveSvg).not.toBe(pharmaSvg)
    })

    it('funciona mesmo quando parâmetros são nulos ou indefinidos', () => {
      const fallback = getCategoryPlaceholder(null, null)
      expect(fallback).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    })
  })

  describe('buildInviteUrl() & buildInviteMessage()', () => {
    it('retorna a URL pública com ?invite=CODIGO quando o código é informado', () => {
      expect(buildInviteUrl('C99AB3')).toBe('https://estoque-casa-five.vercel.app/?invite=C99AB3')
      expect(buildInviteUrl()).toBe('https://estoque-casa-five.vercel.app/')
    })

    it('formata a mensagem de convite com código em negrito e link com ?invite=CODIGO', () => {
      const msg = buildInviteMessage('Caldeirão TESTE', 'C99AB3')
      expect(msg).toBe(
        '🫧 Oi! Te convido para o Caldeirão de Gaia — Caldeirão TESTE.\n\nUse o código *C99AB3 ou entre pelo link:*\nhttps://estoque-casa-five.vercel.app/?invite=C99AB3'
      )
    })
  })
})
