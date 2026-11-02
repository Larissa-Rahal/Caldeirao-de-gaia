import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('não renderiza nada quando open=false', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Teste"><p>Conteúdo</p></Modal>)
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza o conteúdo quando open=true', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Teste"><p>Conteúdo</p></Modal>)
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('mostra o título', () => {
    render(<Modal open={true} onClose={vi.fn()} title="O meu modal"><p>x</p></Modal>)
    expect(screen.getByText('O meu modal')).toBeInTheDocument()
  })

  it('chama onClose ao clicar no botão fechar', async () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Teste"><p>x</p></Modal>)
    await userEvent.click(screen.getByLabelText('Fechar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose ao clicar no overlay', async () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Teste"><p>Conteúdo</p></Modal>)
    // O overlay é o div com aria-hidden=true antes do painel
    const overlay = document.querySelector('[aria-hidden="true"]')
    await userEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose ao pressionar Escape', async () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Teste"><p>x</p></Modal>)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('tem role="dialog" e aria-modal', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Teste"><p>x</p></Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
