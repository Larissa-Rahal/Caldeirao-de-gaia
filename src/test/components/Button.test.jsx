import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renderiza o texto dos filhos', () => {
    render(<Button>Clica aqui</Button>)
    expect(screen.getByRole('button', { name: 'Clica aqui' })).toBeInTheDocument()
  })

  it('chama onClick ao ser clicado', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clica</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('fica desativado quando loading=true', () => {
    render(<Button loading>A guardar...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('fica desativado quando disabled=true', () => {
    render(<Button disabled>Desativado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('não chama onClick quando desativado', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Desativado</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('mostra spinner quando loading=true', () => {
    render(<Button loading>A carregar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('aplica variante secondary', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-white')
  })

  it('aplica variante danger', () => {
    render(<Button variant="danger">Eliminar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-red')
  })
})
