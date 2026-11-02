import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CATEGORIES,
  STATUS_CONFIG,
  STATUS_CYCLE,
  buildInviteUrl,
} from '@/lib/defaults'

describe('DEFAULT_CATEGORIES', () => {
  it('tem pelo menos 5 categorias', () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(5)
  })

  it('cada categoria tem name, emoji e sort_order', () => {
    DEFAULT_CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('name')
      expect(cat).toHaveProperty('emoji')
      expect(cat).toHaveProperty('sort_order')
    })
  })

  it('sort_orders são únicos e sequenciais', () => {
    const orders = DEFAULT_CATEGORIES.map(c => c.sort_order).sort((a, b) => a - b)
    orders.forEach((o, i) => expect(o).toBe(i))
  })
})

describe('STATUS_CONFIG', () => {
  const statuses = ['in_stock', 'running_low', 'out_of_stock']

  it('tem configuração para os 3 estados', () => {
    statuses.forEach(s => expect(STATUS_CONFIG).toHaveProperty(s))
  })

  it('cada estado tem label, bg, text, border, dot e icon', () => {
    statuses.forEach(s => {
      expect(STATUS_CONFIG[s]).toHaveProperty('label')
      expect(STATUS_CONFIG[s]).toHaveProperty('bg')
      expect(STATUS_CONFIG[s]).toHaveProperty('text')
      expect(STATUS_CONFIG[s]).toHaveProperty('border')
      expect(STATUS_CONFIG[s]).toHaveProperty('dot')
      expect(STATUS_CONFIG[s]).toHaveProperty('icon')
    })
  })

  it('não tem configuração para "all" (evitar crash no HomePage)', () => {
    expect(STATUS_CONFIG['all']).toBeUndefined()
  })
})

describe('STATUS_CYCLE', () => {
  it('in_stock → running_low', () => {
    expect(STATUS_CYCLE['in_stock']).toBe('running_low')
  })

  it('running_low → out_of_stock', () => {
    expect(STATUS_CYCLE['running_low']).toBe('out_of_stock')
  })

  it('out_of_stock → in_stock (ciclo completo)', () => {
    expect(STATUS_CYCLE['out_of_stock']).toBe('in_stock')
  })

  it('ciclo completo em 3 passos volta ao estado inicial', () => {
    let status = 'in_stock'
    status = STATUS_CYCLE[status]
    status = STATUS_CYCLE[status]
    status = STATUS_CYCLE[status]
    expect(status).toBe('in_stock')
  })
})

describe('buildInviteUrl()', () => {
  it('constrói URL com o código de convite', () => {
    const url = buildInviteUrl('ABC123')
    expect(url).toContain('ABC123')
    expect(url).toContain('invite=')
  })

  it('URL é válida', () => {
    const url = buildInviteUrl('XYZ789')
    expect(() => new URL(url)).not.toThrow()
  })
})
