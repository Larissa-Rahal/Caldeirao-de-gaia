import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemCard } from '@/components/items/ItemCard'
import { makeItem } from '../helpers'

function renderCard(overrides = {}, handlers = {}) {
  const item = makeItem(overrides)
  const props = {
    item,
    onCycleStatus: vi.fn(),
    onEdit:        vi.fn(),
    onDelete:      vi.fn(),
    ...handlers,
  }
  render(<ItemCard {...props} />)
  return { item, ...props }
}

describe('ItemCard', () => {
  it('mostra o nome do item', () => {
    renderCard({ name: 'Detergente' })
    expect(screen.getByText('Detergente')).toBeInTheDocument()
  })

  it('mostra a categoria com emoji', () => {
    renderCard({
      categories: { id: 'cat-1', name: 'Limpeza', emoji: '🧹' },
    })
    expect(screen.getByText(/Limpeza/)).toBeInTheDocument()
  })

  it('mostra a nota quando existe', () => {
    renderCard({ notes: 'Marca X' })
    expect(screen.getByText('Marca X')).toBeInTheDocument()
  })

  it('não mostra nota quando null', () => {
    renderCard({ notes: null })
    expect(screen.queryByText('Marca X')).not.toBeInTheDocument()
  })

  it('chama onCycleStatus ao clicar no dot de estado', async () => {
    const onCycleStatus = vi.fn()
    renderCard({ status: 'in_stock' }, { onCycleStatus })
    const dot = screen.getByLabelText(/Estado.*Clica para mudar/i)
    await userEvent.click(dot)
    expect(onCycleStatus).toHaveBeenCalledWith('item-1', 'in_stock')
  })

  it('aplica linha riscada quando out_of_stock', () => {
    renderCard({ status: 'out_of_stock' })
    const nome = screen.getByText('Leite')
    expect(nome.className).toContain('line-through')
  })

  it('não aplica linha riscada quando in_stock', () => {
    renderCard({ status: 'in_stock' })
    const nome = screen.getByText('Leite')
    expect(nome.className).not.toContain('line-through')
  })

  it('abre menu de opções ao clicar nos 3 pontos', async () => {
    renderCard()
    await userEvent.click(screen.getByLabelText('Mais opções'))
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('chama onEdit ao clicar em Editar', async () => {
    const onEdit = vi.fn()
    const { item } = renderCard({}, { onEdit })
    await userEvent.click(screen.getByLabelText('Mais opções'))
    await userEvent.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(item)
  })

  it('chama onDelete ao clicar em Eliminar', async () => {
    const onDelete = vi.fn()
    renderCard({}, { onDelete })
    await userEvent.click(screen.getByLabelText('Mais opções'))
    await userEvent.click(screen.getByText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith('item-1')
  })

  it('mostra quem fez a última atualização', () => {
    renderCard({ profiles: { id: 'user-1', full_name: 'João Silva' } })
    expect(screen.getByText(/João Silva/)).toBeInTheDocument()
  })
})
