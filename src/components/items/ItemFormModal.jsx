import { useState, useEffect } from 'react'
import { Search, Upload, ScanLine } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ImagePicker } from './ImagePicker'
import { ImageUploader } from './ImageUploader'
import { BarcodeScanner } from './BarcodeScanner'
import { cn } from '@/lib/utils'

const IMAGE_MODES = [
  { key: 'search',  label: 'Pesquisar', icon: Search },
  { key: 'upload',  label: 'Enviar',    icon: Upload },
  { key: 'barcode', label: 'Código',    icon: ScanLine },
]

export function ItemFormModal({ open, onClose, onSubmit, initialData, categories = [] }) {
  const isEdit = Boolean(initialData)

  const [form,      setForm]      = useState({
    name: '', brand: '', barcode: '', defaultUnit: 'un',
    categoryId: '', notes: '', imageUrl: '',
    qtyType: 'none', qtyValue: '', qtyUnit: 'unid',
  })
  const [imageMode, setImageMode] = useState('search')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (open) {
      const prod   = initialData?.product ?? {}
      const hasQty = initialData?.qty_value != null || initialData?.qty_unit != null
      const isUnit = hasQty && ['unid','cx','pct','par'].includes(initialData?.qty_unit)
      setForm({
        name:        prod.name         ?? '',
        brand:       prod.brand        ?? '',
        barcode:     prod.barcode      ?? '',
        defaultUnit: prod.default_unit ?? 'un',
        categoryId:  initialData?.category_id ?? '',
        notes:       initialData?.notes       ?? '',
        imageUrl:    initialData?.image_url   ?? prod.image_url ?? '',
        qtyType:     !hasQty ? 'none' : isUnit ? 'unit' : 'weight',
        qtyValue:    initialData?.qty_value != null ? String(initialData.qty_value) : '',
        qtyUnit:     initialData?.qty_unit ?? prod.default_unit ?? 'unid',
      })
      setError('')
      setImageMode(initialData?.image_url?.includes('supabase') ? 'upload' : 'search')
    }
  }, [open, initialData])

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleImageChange(url) {
    setForm(prev => ({ ...prev, imageUrl: url ?? '' }))
  }

  function handleModeChange(mode) {
    setImageMode(mode)
    setForm(prev => ({ ...prev, imageUrl: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      const quantity = form.qtyType === 'none' ? null : {
        value: form.qtyValue ? Number(form.qtyValue) : null,
        unit:  form.qtyUnit || null,
      }
      await onSubmit({
        name:        form.name.trim(),
        brand:       form.brand.trim()    || null,
        barcode:     form.barcode.trim()  || null,
        defaultUnit: form.defaultUnit     || 'un',
        categoryId:  form.categoryId      || null,
        quantity,
        notes:       form.notes.trim()    || null,
        imageUrl:    form.imageUrl        || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar item' : 'Adicionar item'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Input
          label="Nome do item *"
          placeholder="Ex: Leite, Detergente..."
          value={form.name}
          onChange={set('name')}
          error={error}
          autoFocus
          maxLength={80}
        />

        {/* Marca e Código de barras */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca (opcional)"
            placeholder="Ex: Nestlé, Ariel..."
            value={form.brand}
            onChange={set('brand')}
            maxLength={60}
          />
          <Input
            label="Cód. barras (opcional)"
            placeholder="Ex: 7891234567890"
            value={form.barcode}
            onChange={set('barcode')}
            maxLength={30}
            inputMode="numeric"
          />
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <select
            value={form.categoryId}
            onChange={set('categoryId')}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sem categoria</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade inteligente */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Quantidade</label>
            <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs">
              {[
                { key: 'none',   label: 'Nenhuma' },
                { key: 'unit',   label: 'Unidades' },
                { key: 'weight', label: 'Peso/Vol' },
              ].map(t => (
                <button key={t.key} type="button"
                  onClick={() => setForm(p => ({ ...p, qtyType: t.key, qtyValue: '', qtyUnit: t.key === 'unit' ? 'unid' : 'kg' }))}
                  className={cn('px-2.5 py-1 rounded-md font-medium transition',
                    form.qtyType === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.qtyType === 'unit' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, qtyValue: String(Math.max(0, (Number(p.qtyValue) || 0) - 1)) }))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 transition font-bold text-base">
                  −
                </button>
                <input type="number" min="0" step="1" value={form.qtyValue}
                  onChange={e => setForm(p => ({ ...p, qtyValue: e.target.value }))}
                  placeholder="0"
                  className="flex-1 text-center text-lg font-semibold bg-transparent outline-none text-gray-900 w-16"
                  inputMode="numeric" />
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, qtyValue: String((Number(p.qtyValue) || 0) + 1) }))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 transition font-bold text-base">
                  +
                </button>
              </div>
              <select value={form.qtyUnit} onChange={e => setForm(p => ({ ...p, qtyUnit: e.target.value }))}
                className="rounded-xl border border-gray-300 bg-white px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="unid">unid.</option>
                <option value="cx">cx.</option>
                <option value="pct">pct.</option>
                <option value="par">par</option>
              </select>
            </div>
          )}

          {form.qtyType === 'weight' && (
            <div className="flex gap-2">
              <input type="number" min="0" step="any" value={form.qtyValue}
                onChange={e => setForm(p => ({ ...p, qtyValue: e.target.value }))}
                placeholder="Ex: 500"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                inputMode="decimal" />
              <select value={form.qtyUnit} onChange={e => setForm(p => ({ ...p, qtyUnit: e.target.value }))}
                className="rounded-xl border border-gray-300 bg-white px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="mg">mg</option>
              </select>
            </div>
          )}

          {form.qtyType === 'none' && (
            <p className="text-xs text-gray-400">Sem controle de quantidade.</p>
          )}
        </div>

        <Input
          label="Nota (opcional)"
          placeholder="Ex: Marca preferida..."
          value={form.notes}
          onChange={set('notes')}
          maxLength={200}
        />

        {/* Imagem do produto */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Imagem do produto</span>
            <div className="flex items-center gap-2">
              {form.imageUrl && (
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition">
                  ✕ Remover
                </button>
              )}
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                {IMAGE_MODES.map(m => {
                  const Icon = m.icon
                  return (
                    <button key={m.key} type="button" onClick={() => handleModeChange(m.key)}
                      className={cn('flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition',
                        imageMode === m.key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                      )}>
                      <Icon size={12} />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {imageMode === 'search' ? (
            <ImagePicker itemName={form.name} value={form.imageUrl} onChange={handleImageChange} />
          ) : imageMode === 'upload' ? (
            <ImageUploader value={form.imageUrl} onChange={handleImageChange} />
          ) : (
            <BarcodeScanner
              onClose={() => setImageMode('search')}
              onResult={(product) => {
                if (product.name && !form.name.trim()) {
                  setForm(prev => ({ ...prev, name: product.name, imageUrl: product.imageUrl ?? '' }))
                } else {
                  setForm(prev => ({ ...prev, imageUrl: product.imageUrl ?? prev.imageUrl }))
                }
                if (product.notes && !form.notes.trim()) {
                  setForm(prev => ({ ...prev, notes: product.notes }))
                }
                setImageMode('search')
              }}
            />
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
