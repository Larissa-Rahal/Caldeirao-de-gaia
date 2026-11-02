import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cn, timeAgo, getInitials, getInviteCodeFromUrl, clearInviteFromUrl } from '@/lib/utils'

describe('cn()', () => {
  it('junta classes simples', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('suporta objetos condicionais', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('')
  })
})

describe('getInitials()', () => {
  it('extrai iniciais de nome completo', () => {
    expect(getInitials('Ana Silva')).toBe('AS')
  })

  it('extrai só a primeira inicial de nome único', () => {
    expect(getInitials('Carlos')).toBe('C')
  })

  it('usa só as duas primeiras palavras', () => {
    expect(getInitials('Maria João Santos')).toBe('MJ')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(getInitials('')).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(getInitials()).toBe('')
  })
})

describe('timeAgo()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  it('mostra "agora mesmo" para menos de 60 segundos', () => {
    const date = new Date('2024-06-15T11:59:30Z').toISOString()
    expect(timeAgo(date)).toBe('agora mesmo')
  })

  it('mostra minutos para menos de 1 hora', () => {
    const date = new Date('2024-06-15T11:45:00Z').toISOString()
    expect(timeAgo(date)).toBe('há 15 min')
  })

  it('mostra horas para menos de 1 dia', () => {
    const date = new Date('2024-06-15T09:00:00Z').toISOString()
    expect(timeAgo(date)).toBe('há 3 h')
  })

  it('mostra dias para menos de 30 dias', () => {
    const date = new Date('2024-06-12T12:00:00Z').toISOString()
    expect(timeAgo(date)).toBe('há 3 dias')
  })

  it('retorna string vazia para valor nulo', () => {
    expect(timeAgo(null)).toBe('')
    expect(timeAgo('')).toBe('')
  })
})

describe('getInviteCodeFromUrl()', () => {
  it('extrai código de convite da URL', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?invite=ABC123', href: 'http://localhost/?invite=ABC123' },
    })
    expect(getInviteCodeFromUrl()).toBe('ABC123')
  })

  it('retorna null quando não há código', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost/' },
    })
    expect(getInviteCodeFromUrl()).toBeNull()
  })
})
