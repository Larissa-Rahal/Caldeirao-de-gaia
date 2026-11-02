import { useState, useEffect } from 'react'
import { Home, Users, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useHouse } from '@/contexts/HouseContext'
import { getInviteCodeFromUrl, clearInviteFromUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

export function OnboardingPage() {
  const { createHouse, joinHouse } = useHouse()
  const [tab,     setTab]     = useState('create')
  const [name,    setName]    = useState('')
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const inv = getInviteCodeFromUrl()
    if (inv) { setCode(inv.toUpperCase()); setTab('join') }
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Da um nome ao teu caldeirão.'); return }
    setLoading(true)
    try {
      await createHouse(name.trim())
      toast.success(`Caldeirão "${name.trim()}" criado!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (code.trim().length !== 6) { setError('O código tem 6 caracteres.'); return }
    setLoading(true)
    try {
      const res = await joinHouse(code.trim())
      clearInviteFromUrl()
      toast.success(res.already_member ? 'Já és membro deste caldeirão!' : 'Adicionado ao caldeirão com sucesso!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🫧</div>
          <h1 className="text-xl font-bold text-gray-900">Bem-vindo ao Caldeirão de Gaia!</h1>
          <p className="text-sm text-gray-500 mt-1">Começa por criar ou juntar-te a um caldeirão.</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            onClick={() => { setTab('create'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'create' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home size={14} /> Criar caldeirão
          </button>
          <button
            onClick={() => { setTab('join'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'join' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={14} /> Entrar com código
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input
              label="Nome do caldeirão"
              placeholder="Ex: Caldeirão da Família Silva"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              error={error}
              maxLength={60}
              autoFocus
            />
            <Button type="submit" loading={loading} size="lg" className="w-full gap-2">
              Criar caldeirão <ArrowRight size={16} />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              label="Código de convite"
              placeholder="ABC123"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              error={error}
              maxLength={6}
              className="tracking-widest text-center font-mono text-lg uppercase"
              autoFocus
            />
            <Button type="submit" loading={loading} size="lg" className="w-full gap-2">
              Entrar no caldeirão <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}