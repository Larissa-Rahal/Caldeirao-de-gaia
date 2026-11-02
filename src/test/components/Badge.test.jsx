import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge, Badge } from '@/components/ui/Badge'

describe('StatusBadge', () => {
  it('mostra "Em Estoque" para in_stock', () => {
    render(<StatusBadge status="in_stock" />)
    expect(screen.getByText('Em Estoque')).toBeInTheDocument()
  })

  it('mostra "Acabando" para running_low', () => {
    render(<StatusBadge status="running_low" />)
    expect(screen.getByText('Acabando')).toBeInTheDocument()
  })

  it('mostra "Em Falta" para out_of_stock', () => {
    render(<StatusBadge status="out_of_stock" />)
    expect(screen.getByText('Em Falta')).toBeInTheDocument()
  })

  it('aplica cor verde para in_stock', () => {
    const { container } = render(<StatusBadge status="in_stock" />)
    expect(container.firstChild.className).toContain('green')
  })

  it('aplica cor âmbar para running_low', () => {
    const { container } = render(<StatusBadge status="running_low" />)
    expect(container.firstChild.className).toContain('amber')
  })

  it('aplica cor vermelha para out_of_stock', () => {
    const { container } = render(<StatusBadge status="out_of_stock" />)
    expect(container.firstChild.className).toContain('red')
  })

  it('não renderiza nada para status inválido', () => {
    const { container } = render(<StatusBadge status="invalido" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('Badge', () => {
  it('renderiza o texto dos filhos', () => {
    render(<Badge>Novo</Badge>)
    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('aplica variante primary', () => {
    const { container } = render(<Badge variant="primary">Label</Badge>)
    expect(container.firstChild.className).toContain('primary')
  })
})
