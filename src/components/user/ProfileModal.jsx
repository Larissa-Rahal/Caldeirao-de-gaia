import { useState, useEffect, useRef } from 'react'
import { Camera, Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function ProfileModal({ open, onClose }) {
  const { user, profile, updateProfile } = useAuth()

  const [tab,           setTab]           = useState('info')  // 'info' | 'password'
  const [name,          setName]          = useState('')
  const [savingInfo,    setSavingInfo]    = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [currentPwd,    setCurrentPwd]    = useState('')
  const [newPwd,        setNewPwd]        = useState('')
  const [confirmPwd,    setConfirmPwd]    = useState('')
  const [showPwd,       setShowPwd]       = useState(false)
  const [savingPwd,     setSavingPwd]     = useState(false)
  const [pwdError,      setPwdError]      = useState('')

  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (open && profile) {
      setName(profile.full_name ?? '')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdError('')
    }
  }, [open, profile])

  // ── Guardar nome ───────────────────────────────────────────
  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSavingInfo(true)
    try {
      await updateProfile({ full_name: name.trim() })
      toast.success('Perfil atualizado!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Upload de avatar ───────────────────────────────────────
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Máximo 3 MB.'); return }

    setAvatarLoading(true)
    try {
      // Upload para o bucket avatars
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Adiciona timestamp para forçar refresh da imagem
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

      await updateProfile({ avatar_url: avatarUrl })
      toast.success('Foto atualizada!')
    } catch (err) {
      toast.error('Erro ao carregar foto: ' + err.message)
    } finally {
      setAvatarLoading(false)
      e.target.value = ''
    }
  }

  // ── Alterar palavra-passe ──────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault()
    setPwdError('')

    if (newPwd.length < 6)         { setPwdError('Mínimo 6 caracteres.'); return }
    if (newPwd !== confirmPwd)      { setPwdError('As palavras-passe não coincidem.'); return }

    setSavingPwd(true)
    try {
      // Verifica a palavra-passe atual fazendo re-auth
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: currentPwd,
      })
      if (signInErr) { setPwdError('Palavra-passe atual incorreta.'); setSavingPwd(false); return }

      // Atualiza
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error

      toast.success('Palavra-passe alterada!')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdError(err.message)
    } finally {
      setSavingPwd(false)
    }
  }

  // Força reload do avatar para evitar cache
  const avatarSrc = profile?.avatar_url || null

  return (
    <Modal open={open} onClose={onClose} title="O meu perfil">

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5 -mx-1">
        {[
          { key: 'info',     label: 'Informações' },
          { key: 'password', label: 'Palavra-passe' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Informações ── */}
      {tab === 'info' && (
        <form onSubmit={handleSaveInfo} className="flex flex-col gap-5">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                name={profile?.full_name ?? profile?.email ?? '?'}
                src={avatarSrc}
                size="lg"
                className="w-20 h-20 text-2xl"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center shadow hover:bg-primary-700 transition"
                title="Alterar foto"
              >
                {avatarLoading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Camera size={13} />
                }
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Carregar foto de perfil"
              />
            </div>
            <p className="text-xs text-gray-400">Clica na câmara para alterar · máx. 3 MB</p>
          </div>

          {/* Nome */}
          <Input
            label="Nome de exibição"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="O teu nome"
            maxLength={60}
          />

          {/* Email (só leitura) */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
              {user?.email}
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">verificado</span>
            </div>
            <p className="text-xs text-gray-400">O email não pode ser alterado.</p>
          </div>

          <Button type="submit" loading={savingInfo} disabled={!name.trim() || name === profile?.full_name}>
            Guardar alterações
          </Button>
        </form>
      )}

      {/* ── Palavra-passe ── */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="relative">
            <Input
              label="Palavra-passe atual"
              type={showPwd ? 'text' : 'password'}
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 transition"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nova palavra-passe"
              type={showPwd ? 'text' : 'password'}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="relative">
            <Input
              label="Confirmar nova palavra-passe"
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Repete a nova palavra-passe"
              autoComplete="new-password"
            />
          </div>

          {/* Indicador de força */}
          {newPwd.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                    newPwd.length >= i * 3
                      ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
              <div className="flex gap-2 text-xs flex-wrap">
                {[
                  { ok: newPwd.length >= 8,            label: '8+ chars' },
                  { ok: /[A-Z]/.test(newPwd),           label: 'Maiúscula' },
                  { ok: /[0-9]/.test(newPwd),           label: 'Número' },
                  { ok: /[^A-Za-z0-9]/.test(newPwd),   label: 'Símbolo' },
                ].map(({ ok, label }) => (
                  <span key={label} className={`flex items-center gap-0.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                    {ok ? <Check size={10} /> : <X size={10} />} {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pwdError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{pwdError}</p>
          )}

          <Button
            type="submit"
            loading={savingPwd}
            disabled={!currentPwd || !newPwd || !confirmPwd}
          >
            Alterar palavra-passe
          </Button>
        </form>
      )}
    </Modal>
  )
}
