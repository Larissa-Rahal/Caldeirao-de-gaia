import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseContext } from '@/contexts/HouseContext'
import { HouseSwitcher } from '@/components/layout/HouseSwitcher'
import { makeHouseContext, makeHouse } from '../helpers'

function renderSwitcher(ctxOverrides = {}, onCreateHouse = vi.fn()) {
  const ctx = makeHouseContext(ctxOverrides)
  render(
    <HouseContext.Provider value={ctx}>
      <HouseSwitcher onCreateHouse={onCreateHouse} />
    </HouseContext.Provider>
  )
  return ctx
}

describe('HouseSwitcher', () => {
  it('mostra o nome da casa activa', () => {
    renderSwitcher()
    expect(screen.getByText('Casa Teste')).toBeInTheDocument()
  })

  it('abre dropdown ao clicar', async () => {
    renderSwitcher({
      houses: [
        makeHouse({ id: 'h1', name: 'Casa A' }),
        makeHouse({ id: 'h2', name: 'Casa B' }),
      ],
    })
    await userEvent.click(screen.getByRole('button', { name: /Selecionar casa/ }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Nova casa')).toBeInTheDocument()
  })

  it('mostra todas as casas no dropdown', async () => {
    renderSwitcher({
      houses: [
        makeHouse({ id: 'h1', name: 'Casa A' }),
        makeHouse({ id: 'h2', name: 'Casa B' }),
      ],
    })
    await userEvent.click(screen.getByRole('button', { name: /Selecionar casa/ }))
    expect(screen.getByRole('option', { name: /Casa A/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Casa B/ })).toBeInTheDocument()
  })

  it('chama setActiveHouse ao selecionar outra casa', async () => {
    const setActiveHouse = vi.fn()
    const casa2 = makeHouse({ id: 'h2', name: 'Casa B' })
    renderSwitcher({
      houses: [makeHouse({ id: 'h1', name: 'Casa A' }), casa2],
      setActiveHouse,
    })
    await userEvent.click(screen.getByRole('button', { name: /Selecionar casa/ }))
    await userEvent.click(screen.getByRole('option', { name: /Casa B/ }))
    expect(setActiveHouse).toHaveBeenCalledWith(casa2)
  })

  it('chama onCreateHouse ao clicar em "Nova casa"', async () => {
    const onCreateHouse = vi.fn()
    renderSwitcher({}, onCreateHouse)
    await userEvent.click(screen.getByRole('button', { name: /Selecionar casa/ }))
    await userEvent.click(screen.getByText('Nova casa'))
    expect(onCreateHouse).toHaveBeenCalledOnce()
  })

  it('mostra rótulo "dono" para casas onde é owner', async () => {
    renderSwitcher({
      houses: [makeHouse({ myRole: 'owner', name: 'Minha Casa' })],
    })
    await userEvent.click(screen.getByRole('button', { name: /Selecionar casa/ }))
    expect(screen.getByText('dono')).toBeInTheDocument()
  })

  it('não renderiza quando não há casa activa', () => {
    const { container } = render(
      <HouseContext.Provider value={makeHouseContext({ activeHouse: null })}>
        <HouseSwitcher onCreateHouse={vi.fn()} />
      </HouseContext.Provider>
    )
    expect(container.firstChild).toBeNull()
  })
})
