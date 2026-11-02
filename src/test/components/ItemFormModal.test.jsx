import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemFormModal } from '@/components/items/ItemFormModal'
import { makeCategory, makeItem } from '../helpers'

const cats = [
  makeCategory({ id: 'cat-1', name: 'Mercearia', emoji: '🛒' }),
  makeCategory({ id: 'cat-2', name: 'Limpeza',   emoji: '🧹', sort_order: 1 }),
]

function renderModal(props = {}) {
  const defaults = {
    open:        true,
    onClose:     vi.fn(),
    onSubmit:    vi.fn().mockResolvedValue(undefined),
    categories:  cats,
    initialData: null,
  }
  render(<ItemFormModal {...defaults} {...props} />)
  return defaults
}

describe('ItemFormModal — adicionar item', () => {
  it('não renderiza quando open=false', () => {
    renderModal({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra título "Adicionar item"', () => {
    renderModal()
    expect(screen.getByText('Adicionar item')).toBeInTheDocument()
  })

  it('mostra as categorias no select', () => {
    renderModal()
    expect(screen.getByRole('option', { name: /Mercearia/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Limpeza/ })).toBeInTheDocument()
  })

  it('mostra erro se submeter sem nome', async () => {
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(screen.getByText('O nome é obrigatório.')).toBeInTheDocument()
  })

  it('chama onSubmit com os dados corretos', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderModal({ onSubmit })

    // Usa placeholder em vez de getByLabelText para evitar problema de htmlFor
    await userEvent.type(screen.getByPlaceholderText(/Leite, Detergente/), 'Arroz')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'cat-1')
    await userEvent.type(screen.getByPlaceholderText(/Marca preferida/), 'Marca A')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name:       'Arroz',
        categoryId: 'cat-1',
        notes:      'Marca A',
      })
    })
  })

  it('chama onClose após submissão bem-sucedida', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })

    await userEvent.type(screen.getByPlaceholderText(/Leite, Detergente/), 'Pão')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('mostra erro se onSubmit lançar exceção', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Erro de rede'))
    renderModal({ onSubmit })

    await userEvent.type(screen.getByPlaceholderText(/Leite, Detergente/), 'Teste')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(screen.getByText('Erro de rede')).toBeInTheDocument())
  })
})

describe('ItemFormModal — editar item', () => {
  const item = makeItem({ name: 'Leite', category_id: 'cat-1', notes: 'Sem lactose' })

  it('mostra título "Editar item"', () => {
    renderModal({ initialData: item })
    expect(screen.getByText('Editar item')).toBeInTheDocument()
  })

  it('preenche o formulário com dados existentes', () => {
    renderModal({ initialData: item })
    expect(screen.getByDisplayValue('Leite')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sem lactose')).toBeInTheDocument()
  })

  it('botão de submit mostra "Guardar"', () => {
    renderModal({ initialData: item })
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })
})
