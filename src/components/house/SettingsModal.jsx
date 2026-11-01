import { useState } from 'react'
import { Copy, RefreshCw, Link, Trash2, UserMinus, Crown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useHouse } from '@/contexts/HouseContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { copyToClipboard } from '@/lib/utils'
import { buildInviteUrl } from '@/lib/defaults'
import toast from 'react-hot-toast'

export function SettingsModal({ open, onClose }) {
  const { activeHouse, members, updateHouseName, regenerateInviteCode, removeMember } = useHouse()
  const { user } = useAuth()
  const { categories, addCategory, deleteCategory } = useCategories()
  const [tab, setTab] = useState('invite') // 'invite' | 'members' | 'categories'
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📦')

  if (!activeHouse) return null

  const isOwner = activeHouse.myRole === 'owner'
  const inviteUrl = buildInviteUrl(activeHouse.invite_code)

  async function handleCopyCode() {
    await copyToClipboard(activeHouse.invite_code)
    toast.success('Código copiado!')
  }

  async function handleCopyLink() {
    await copyToClipboard(inviteUrl)
    toast.success('Link copiado!')
  }

  async function handleRegenerateCode() {
    if (!confirm('Gerar novo código? O código atual deixará de funcionar.')) return
    try {
      await regenerateInviteCode(activeHouse.id)
      toast.success('Novo código gerado!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleRename(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setRenaming(true)
    try {
      await updateHouseName(activeHouse.id, newName.trim())
      toast.success('Nome atualizado!')
      setNewName('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRenaming(false)
    }
  }

  async function handleRemoveMember(member) {
    if (!confirm(`Remover ${member.profiles?.full_name}?`)) return
    try {
      await removeMember(member.id)
      toast.success('Membro removido.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await addCategory({ name: newCatName.trim(), emoji: newCatEmoji })
      setNewCatName('')
      setNewCatEmoji('📦')
      toast.success('Categoria adicionada!')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDeleteCategory(cat) {
    if (!confirm(`Eliminar categoria "${cat.name}"? Os itens ficarão sem categoria.`)) return
    try {
      await deleteCategory(cat.id)
      toast.success('Categoria eliminada.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const TABS = [
    { key: 'invite',     label: 'Convite' },
    { key: 'members',    label: `Membros (${members.length})` },
    { key: 'categories', label: 'Categorias' },
  ]

  return (
    <Modal open={open} onClose={onClose} title={`Definições · ${activeHouse.name}`}>
      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5 -mx-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Convite ── */}
      {tab === 'invite' && (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Código de convite</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-primary-700">
              {activeHouse.invite_code}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={handleCopyCode} className="gap-2">
              <Copy size={14} /> Copiar código
            </Button>
            <Button variant="secondary" onClick={handleCopyLink} className="gap-2">
              <Link size={14} /> Copiar link
            </Button>
          </div>

          {isOwner && (
            <Button variant="ghost" onClick={handleRegenerateCode} className="gap-2 text-sm text-gray-500">
              <RefreshCw size={14} /> Gerar novo código
            </Button>
          )}

          {isOwner && (
            <form onSubmit={handleRename} className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <Input
                label="Renomear casa"
                placeholder={activeHouse.name}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={60}
              />
              <Button type="submit" variant="secondary" loading={renaming} disabled={!newName.trim()}>
                Guardar nome
              </Button>
            </form>
          )}
        </div>
      )}

      {/* ── Membros ── */}
      {tab === 'members' && (
        <div className="flex flex-col gap-2">
          {members.map(member => {
            const isMe = member.user_id === user?.id
            const isMemberOwner = member.role === 'owner'
            const profile = member.profiles
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <Avatar name={profile?.full_name ?? profile?.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.full_name ?? profile?.email}
                    {isMe && <span className="ml-1 text-xs text-gray-400">(tu)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{profile?.email}</p>
                </div>
                {isMemberOwner && <Crown size={14} className="text-amber-500 shrink-0" />}
                {isOwner && !isMe && !isMemberOwner && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    aria-label={`Remover ${profile?.full_name}`}
                  >
                    <UserMinus size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Categorias ── */}
      {tab === 'categories' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
                <span className="text-xl">{cat.emoji}</span>
                <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                {isOwner && (
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    aria-label={`Eliminar categoria ${cat.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddCategory} className="border-t border-gray-100 pt-3 flex gap-2">
            <input
              type="text"
              placeholder="Emoji"
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              className="w-14 text-center rounded-xl border border-gray-300 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Nova categoria"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={40}
            />
            <Button type="submit" size="md" disabled={!newCatName.trim()}>
              +
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
