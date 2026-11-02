import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  timeAgo,
  getInviteCodeFromUrl,
  clearInviteFromUrl,
  copyToClipboard,
  getInitials,
} from '@/lib/utils'

describe('src/lib/utils.js', () => {
  describe('cn()', () => {
    it('combina classes condicionais corretamente', () => {
      expect(cn('px-2', 'py-1', false && 'hidden', 'text-sm')).toBe('px-2 py-1 text-sm')
    })

    it('aceita objetos e arrays de classes', () => {
      expect(cn(['flex', 'items-center'], { 'opacity-50': true, 'bg-red-500': false }))
        .toBe('flex items-center opacity-50')
    })
  })

  describe('timeAgo()', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-02T15:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('retorna string vazia quando dateStr é vazio ou nulo', () => {
      expect(timeAgo('')).toBe('')
      expect(timeAgo(null)).toBe('')
      expect(timeAgo(undefined)).toBe('')
    })

    it('retorna "agora mesmo" para menos de 60 segundos', () => {
      expect(timeAgo('2026-11-02T14:59:30Z')).toBe('agora mesmo')
    })

    it('retorna minutos para diferenças entre 1 e 59 minutos', () => {
      expect(timeAgo('2026-11-02T14:45:00Z')).toBe('há 15 min')
    })

    it('retorna horas para diferenças entre 1 e 23 horas', () => {
      expect(timeAgo('2026-11-02T12:00:00Z')).toBe('há 3 h')
    })

    it('retorna dias para diferenças entre 1 e 29 dias', () => {
      expect(timeAgo('2026-10-28T15:00:00Z')).toBe('há 5 dias')
    })

    it('retorna data formatada para 30 dias ou mais', () => {
      const formatted = timeAgo('2026-08-10T15:00:00Z')
      expect(formatted).toBeTruthy()
      expect(formatted).not.toContain('há')
    })
  })

  describe('getInviteCodeFromUrl() & clearInviteFromUrl()', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/')
    })

    it('retorna null quando não há parâmetro invite na URL', () => {
      expect(getInviteCodeFromUrl()).toBeNull()
    })

    it('retorna o código de convite quando presente na URL', () => {
      window.history.replaceState({}, '', '/?invite=5AB9DA')
      expect(getInviteCodeFromUrl()).toBe('5AB9DA')
    })

    it('remove o parâmetro invite da URL ao chamar clearInviteFromUrl()', () => {
      window.history.replaceState({}, '', '/?invite=5AB9DA&foo=bar')
      clearInviteFromUrl()
      expect(getInviteCodeFromUrl()).toBeNull()
      expect(window.location.search).toBe('?foo=bar')
    })
  })

  describe('copyToClipboard()', () => {
    it('usa navigator.clipboard.writeText quando disponível', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      const result = await copyToClipboard('5AB9DA')
      expect(result).toBe(true)
      expect(writeTextMock).toHaveBeenCalledWith('5AB9DA')
    })

    it('faz fallback para document.execCommand("copy") quando navigator.clipboard não existe', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })
      document.execCommand = vi.fn().mockReturnValue(true)

      const result = await copyToClipboard('texto-fallback')
      expect(result).toBe(true)
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
  })

  describe('getInitials()', () => {
    it('retorna as iniciais das duas primeiras palavras em maiúsculas', () => {
      expect(getInitials('Larissa Rahal Coelho')).toBe('LR')
      expect(getInitials('casa')).toBe('C')
    })

    it('retorna string vazia quando o nome é omitido ou vazio', () => {
      expect(getInitials('')).toBe('')
      expect(getInitials()).toBe('')
    })
  })
})
