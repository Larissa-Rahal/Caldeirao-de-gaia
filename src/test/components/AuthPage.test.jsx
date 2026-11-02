import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '@/contexts/AuthContext'
import { AuthPage } from '@/pages/AuthPage'
import { makeAuthContext } from '../helpers'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  __esModule: true,
}))

function renderAuth(ctxOverrides = {}) {
  const ctx = makeAuthContext(ctxOverrides)
  render(
    <AuthContext.Provider value={ctx}>
      <AuthPage />
    </AuthContext.Provider>
  )
  return ctx
}

describe('AuthPage — Login', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost/' },
    })
  })

  it('mostra o formulário de login por defeito', () => {
    renderAuth()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('mostra o título EstoqueCasa', () => {
    renderAuth()
    expect(screen.getByText('EstoqueCasa')).toBeInTheDocument()
  })

  it('mostra erro se email estiver vazio', async () => {
    renderAuth()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    // Usa getAllByRole porque pode haver múltiplos alerts — verifica o primeiro
    const alerts = screen.getAllByRole('alert')
    expect(alerts.some(a => a.textContent.includes('Email'))).toBe(true)
  })

  it('mostra erro se password tiver menos de 6 chars', async () => {
    renderAuth()
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Palavra-passe'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Mínimo 6 caracteres')).toBeInTheDocument()
  })

  it('chama signIn com email e password', async () => {
    const signIn = vi.fn().mockResolvedValue({})
    renderAuth({ signIn })

    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Palavra-passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email:    'user@test.com',
        password: 'password123',
      })
    })
  })

  it('navega para registo ao clicar em "Cria uma aqui"', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Cria uma aqui'))
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })
})

describe('AuthPage — Registo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost/' },
    })
  })

  it('mostra campo Nome ao mudar para registo', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Cria uma aqui'))
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('mostra erro se nome estiver vazio no registo', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Cria uma aqui'))
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.type(screen.getByLabelText('Palavra-passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(screen.getByText('Nome obrigatório')).toBeInTheDocument()
  })

  it('chama signUp com nome, email e password', async () => {
    const signUp = vi.fn().mockResolvedValue({})
    renderAuth({ signUp })

    await userEvent.click(screen.getByText('Cria uma aqui'))
    await userEvent.type(screen.getByLabelText('Nome'), 'João')
    await userEvent.type(screen.getByLabelText('Email'), 'joao@test.com')
    await userEvent.type(screen.getByLabelText('Palavra-passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        fullName: 'João',
        email:    'joao@test.com',
        password: 'password123',
      })
    })
  })
})

describe('AuthPage — convite na URL', () => {
  it('mostra banner de convite quando há código na URL', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?invite=ABC123', href: 'http://localhost/?invite=ABC123' },
    })
    renderAuth()
    expect(screen.getByText(/ABC123/)).toBeInTheDocument()
  })

  it('muda para modo registo automaticamente com convite', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?invite=ABC123', href: 'http://localhost/?invite=ABC123' },
    })
    renderAuth()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })
})
