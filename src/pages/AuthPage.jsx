import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { getInviteCodeFromUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode,    setMode]    = useState('login')  // 'login' | 'register'
  const [form,    setForm]    = useState({ email: '', password: '', fullName: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  // Se há código de convite na URL, sugere registo
  useEffect(() => {
    if (getInviteCodeFromUrl()) setMode('register')
  }, [])

  function set(field) {
    return (e) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.email.trim())    errs.email    = 'Email obrigatório'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email inválido'
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    if (mode === 'register' && !form.fullName.trim()) errs.fullName = 'Nome obrigatório'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Bem-vindo de volta!')
      } else {
        await signUp({ email: form.email, password: form.password, fullName: form.fullName })
        toast.success('Conta criada! Podes entrar agora.')
        setMode('login')
      }
    } catch (err) {
      toast.error(err.message === 'Invalid login credentials'
        ? 'Email ou palavra-passe incorretos.'
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const inviteCode = getInviteCodeFromUrl()

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col items-center justify-center px-4 py-10">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🫧</div>
          <h1 className="text-2xl font-bold text-gray-900">Caldeirão de Gaia</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Entra na tua conta' : 'Cria a tua conta'}
          </p>
        </div>

        {/* Banner de convite */}
        {inviteCode && (
          <div className="mb-5 p-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700 text-center">
            🎉 Tens um convite! Código: <strong>{inviteCode}</strong><br />
            {mode === 'login' ? 'Entra ou cria conta' : 'Cria conta'} para aceitar.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {mode === 'register' && (
            <Input
              label="Nome"
              type="text"
              placeholder="O teu nome"
              value={form.fullName}
              onChange={set('fullName')}
              error={errors.fullName}
              autoComplete="name"
              autoFocus
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="tu@exemplo.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoComplete="email"
            autoFocus={mode === 'login'}
          />
          <Input
            label="Palavra-passe"
            type="password"
            placeholder="••••••"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        {/* Toggle modo */}
        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === 'login' ? 'Não tens conta?' : 'Já tens conta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
            className="text-primary-600 font-medium hover:underline"
          >
            {mode === 'login' ? 'Cria uma aqui' : 'Entra aqui'}
          </button>
        </p>
      </div>
    </div>
  )
}
