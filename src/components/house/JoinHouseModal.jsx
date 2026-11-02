import { useState, useEffect } from 'react'
import { LogIn } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useHouse } from '@/contexts/HouseContext'
import { getInviteCodeFromUrl, clearInviteFromUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

export function JoinHouseModal({ open, onClose }) {
  const { joinHouse, setActiveHouse, houses } = useHouse()
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Pré-preenche com código da URL se existir
  useEffect(() => {
    if (open) {
      const inv = getInviteCodeFromUrl()
      setCode(inv ? inv.toUpperCase() : '')
      setError('')
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) { setError('O código tem 6 caracteres.'); return }

    setLoading(true)
    try {
      const res = await joinHouse(trimmed)
      clearInviteFromUrl()

      // O fetchHouses dentro de joinHouse atualiza a lista —
      // a casa nova fica disponível após o re-render, usamos o house_id retornado
      if (res?.house_id) {
        // Pequeno delay para garantir que fetchHouses completou
        setTimeout(() => {
          const newHouse = houses.find(h => h.id === res.house_id)
          if (newHouse) setActiveHouse(newHouse)
        }, 300)
      }

      toast.success(res?.already_member
        ? 'Já és membro deste caldeirão!'
        : 'Adicionado ao caldeirão com sucesso! ✨'
      )
      onClose()
    } catch (err) {
      setError(err.message === 'Código de convite inválido'
        ? 'Código inválido. Verifica e tenta novamente.'
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Entrar num caldeirão">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
            <LogIn size={26} className="text-primary-600" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Pede o código de 6 letras ao dono do caldeirão<br />
            ou abre o link de convite que te enviaram.
          </p>
        </div>

        <Input
          label="Código de convite"
          placeholder="ABC123"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          error={error}
          maxLength={6}
          className="tracking-widest text-center font-mono text-xl uppercase"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          translate="no"
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1 gap-2">
            <LogIn size={16} /> Entrar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
