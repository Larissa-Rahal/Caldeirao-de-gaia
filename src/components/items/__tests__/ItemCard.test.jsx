import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ItemCard } from '@/components/items/ItemCard'

describe('src/components/items/ItemCard.jsx', () => {
  const mockItem = {
    id:        'item-1',
    status:    'in_stock',
    qty_value: 8,
    qty_unit:  'kg',
    product: {
      name:         'Açúcar',
      brand:        'União',
      default_unit: 'kg',
    },
    category: {
      name:  'Mercearia',
      emoji: '🛒',
    },
  }

  it('renderiza o nome, marca, status e quantidade no pergaminho', () => {
    render(
      <ItemCard
        item={mockItem}
        onCycleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAdjustQty={vi.fn()}
        onUpdateQtyValue={vi.fn()}
      />
    )

    expect(screen.getByText('Açúcar')).toBeInTheDocument()
    expect(screen.getByText('União')).toBeInTheDocument()
    expect(screen.getByText('Em Estoque')).toBeInTheDocument()
    expect(screen.getByText('8 kg')).toBeInTheDocument()
  })

  it('abre edição inline limpa (type="text" sem setas de number) ao clicar no valor do pergaminho e salva no blur', () => {
    const onUpdateQtyValue = vi.fn()

    render(
      <ItemCard
        item={mockItem}
        onCycleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAdjustQty={vi.fn()}
        onUpdateQtyValue={onUpdateQtyValue}
      />
    )

    // Clica no valor "8 kg"
    fireEvent.click(screen.getByText('8 kg'))

    const input = screen.getByLabelText('Editar quantidade')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveClass('grimoire-qty-input')
    expect(input).toHaveValue('8')

    // Altera o valor para "10" e dispara blur
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.blur(input)

    expect(onUpdateQtyValue).toHaveBeenCalledWith('item-1', 10)
  })

  it('ajusta a quantidade pelos botões − e +', () => {
    const onAdjustQty = vi.fn()

    render(
      <ItemCard
        item={mockItem}
        onCycleStatus={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAdjustQty={onAdjustQty}
        onUpdateQtyValue={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTitle('Diminuir'))
    expect(onAdjustQty).toHaveBeenCalledWith('item-1', -1)

    fireEvent.click(screen.getByTitle('Aumentar'))
    expect(onAdjustQty).toHaveBeenCalledWith('item-1', 1)
  })
})
