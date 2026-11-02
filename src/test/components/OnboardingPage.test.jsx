import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext }  from '@/contexts/AuthContext'
import { HouseContext } from '@/contexts/HouseContext'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { makeAuthContext, makeHouseContext } from '../helpers'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  __esModule: true,
}))

function renderOnboarding(houseOverrides = {}) {
  const auth  = makeAuthContext()
  const house = makeHouseContext(houseOverrides)
  render(
    <AuthContext.Provider value={auth}>
      <HouseContext.Provider value={house}>
        <OnboardingPage />
      </HouseContext.Provider>
    </AuthContext.Provider>
  )
  return { auth, house }
}

describe('OnboardingPage — Criar casa', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost/' },
    })
  })

  it('mostra a mensagem de boas-vindas', () => {
    renderOnboarding()
    expect(screen.getByText('Bem-vindo ao EstoqueCasa!')).toBeInTheDocument()
  })

  it('mostra o campo de nome da casa', () => {
    renderOnboarding()
    expect(screen.getByPlaceholderText(/Casa da Família/)).toBeInTheDocument()
  })

  it('mostra erro se submeter sem nome', async () => {
    renderOnboarding()
    const submitBtn = screen.getAllByRole('button')
      .find(btn => btn.type === 'submit')
    await userEvent.click(submitBtn)
    // A mensagem de erro é renderizada num <p> dentro do formulário
    expect(screen.getByText(/nome/i)).toBeInTheDocument()
  })

  it('chama createHouse com o nome inserido', async () => {
    const createHouse = vi.fn().mockResolvedValue({ id: 'h1', name: 'Minha Casa' })
    renderOnboarding({ createHouse })

    // Limpa e escreve no input de nome (pode já ter valor)
    const input = screen.getByPlaceholderText(/Casa da Fam/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Minha Casa')
    expect(input).toHaveValue('Minha Casa')

    // Submete o formulário directamente
    const form = input.closest('form')
    await userEvent.click(form.querySelector('button[type="submit"]'))

    await waitFor(() => {
      expect(createHouse).toHaveBeenCalledWith('Minha Casa')
    }, { timeout: 3000 })
  })
})

describe('OnboardingPage — Entrar com código', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', href: 'http://localhost/' },
    })
  })

  it('muda para tab "Entrar com código" ao clicar', async () => {
    renderOnboarding()
    await userEvent.click(screen.getByText('Entrar com código'))
    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
  })

  it('mostra erro se código tiver menos de 6 chars', async () => {
    renderOnboarding()
    await userEvent.click(screen.getByText('Entrar com código'))
    await userEvent.type(screen.getByPlaceholderText('ABC123'), 'AB1')
    await userEvent.click(screen.getByRole('button', { name: /Entrar na casa/ }))
    expect(screen.getByText('O código tem 6 caracteres.')).toBeInTheDocument()
  })

  it('converte input para maiúsculas', async () => {
    renderOnboarding()
    await userEvent.click(screen.getByText('Entrar com código'))
    await userEvent.type(screen.getByPlaceholderText('ABC123'), 'abc123')
    expect(screen.getByPlaceholderText('ABC123')).toHaveValue('ABC123')
  })

  it('chama joinHouse com o código correto', async () => {
    const joinHouse = vi.fn().mockResolvedValue({ house_id: 'h1', already_member: false })
    renderOnboarding({ joinHouse })

    await userEvent.click(screen.getByText('Entrar com código'))
    await userEvent.type(screen.getByPlaceholderText('ABC123'), 'XYZ789')
    await userEvent.click(screen.getByRole('button', { name: /Entrar na casa/ }))

    await waitFor(() => {
      expect(joinHouse).toHaveBeenCalledWith('XYZ789')
    })
  })
})

describe('OnboardingPage — convite na URL', () => {
  it('preenche automaticamente o código e activa tab de entrar', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '?invite=INV123', href: 'http://localhost/?invite=INV123' },
    })
    renderOnboarding()
    expect(screen.getByPlaceholderText('ABC123')).toHaveValue('INV123')
  })
})
