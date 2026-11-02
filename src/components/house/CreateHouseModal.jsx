import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useHouse } from '@/contexts/HouseContext'
import toast from 'react-hot-toast'

export function CreateHouseModal({ open, onClose }) {
  const { createHouse, setActiveHouse } = useHouse()
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      const house = await createHouse(name.trim())
      setActiveHouse(house)
      toast.success(`Caldeirão "${house.name}" criado! 🫧`)
      setName('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo caldeirão">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do caldeirão"
          placeholder="Ex: Caldeirão da Família Silva"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          error={error}
          maxLength={60}
          autoFocus
        />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1">Criar</Button>
        </div>
      </form>
    </Modal>
  )
}
