import { useState, useEffect, useMemo } from 'react'
import { Upload, ScanLine, Search, Plus, Check, Sparkles, BookOpen, SlidersHorizontal } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ImageUploader } from './ImageUploader'
import { BarcodeScanner } from './BarcodeScanner'
import { supabase } from '@/lib/supabase'
import { getCategoryPlaceholder } from '@/lib/defaults'
import { cn } from '@/lib/utils'

const IMAGE_MODES = [
  { key: 'upload',  label: 'Enviar', icon: Upload },
  { key: 'barcode', label: 'Código', icon: ScanLine },
]

const UNIT_OPTIONS = ['un', 'unid', 'cx', 'pct', 'par']

export function ItemFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  existingItems = [],
}) {
  const isEdit = Boolean(initialData)

  const [tab,             setTab]             = useState('new') // 'catalog' | 'new'
  const [catalogProducts, setCatalogProducts] = useState([])
  const [catalogLoading,  setCatalogLoading]  = useState(false)
  const [catalogSearch,   setCatalogSearch]   = useState('')
  const [catalogCatId,    setCatalogCatId]    = useState('')
  const [addingProdId,    setAddingProdId]    = useState(null)
  const [justAddedIds,    setJustAddedIds]    = useState(new Set())
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [form, setForm] = useState({
    productId: null,
    name: '', brand: '', barcode: '', defaultUnit: 'un',
    categoryId: '', notes: '', imageUrl: '',
    qtyType: 'none', qtyValue: '', qtyUnit: 'un',
  })
  const [imageMode, setImageMode] = useState('upload')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // IDs de produtos que já estão neste Caldeirão
  const existingProductIds = useMemo(() => {
    const s = new Set(justAddedIds)
    for (const item of existingItems) {
      if (item.product_id) s.add(item.product_id)
      if (item.product?.id) s.add(item.product.id)
    }
    return s
  }, [existingItems, justAddedIds])

  useEffect(() => {
    if (!open) return

    const prod         = initialData?.product ?? {}
    const defaultUnit  = prod.default_unit ?? initialData?.default_unit ?? 'un'
    const resolvedUnit = initialData?.qty_unit || defaultUnit
    const hasQty       = initialData?.qty_value != null
    const isUnit       = hasQty && UNIT_OPTIONS.includes(resolvedUnit)

    setForm({
      productId:   initialData?.product_id ?? prod.id ?? null,
      name:        prod.name    ?? initialData?.name    ?? '',
      brand:       prod.brand   ?? initialData?.brand   ?? '',
      barcode:     prod.barcode ?? initialData?.barcode ?? '',
      defaultUnit,
      categoryId:  initialData?.category_id ?? '',
      notes:       initialData?.notes       ?? '',
      imageUrl:    initialData?.image_url   ?? prod.image_url ?? '',
      qtyType:     !hasQty ? 'none' : isUnit ? 'unit' : 'weight',
      qtyValue:    hasQty ? String(initialData.qty_value) : '',
      qtyUnit:     resolvedUnit,
    })
    setError('')
    setImageMode('upload')
    setCatalogSearch('')
    setJustAddedIds(new Set())
    setShowSuggestions(false)

    if (!isEdit) {
      setCatalogLoading(true)
      supabase
        .from('products')
        .select('id, name, brand, barcode, default_unit, image_url')
        .order('name', { ascending: true })
        .then(({ data }) => {
          const list = data ?? []
          setCatalogProducts(list)
          setCatalogLoading(false)
          if (list.length > 0) {
            setTab('catalog')
          } else {
            setTab('new')
          }
        })
    } else {
      setTab('new')
    }
  }, [open, initialData, isEdit])

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim()
    if (!q) return catalogProducts
    return catalogProducts.filter(p =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q) ||
      (p.barcode ?? '').toLowerCase().includes(q)
    )
  }, [catalogProducts, catalogSearch])

  // Sugestões de autocomplete enquanto digita na aba "Novo produto"
  const nameSuggestions = useMemo(() => {
    if (isEdit || form.productId) return []
    const q = form.name.toLowerCase().trim()
    if (q.length < 2) return []
    return catalogProducts
      .filter(p => (p.name ?? '').toLowerCase().includes(q))
      .slice(0, 5)
  }, [catalogProducts, form.name, form.productId, isEdit])

  function set(field) {
    return (e) => {
      const val = e.target.value
      setForm(prev => ({
        ...prev,
        [field]: val,
        // Se alterar o nome manualmente, limpa o productId vinculado anteriormente
        ...(field === 'name' ? { productId: null } : {}),
      }))
      if (field === 'name') setShowSuggestions(true)
    }
  }

  function stepFormQuantity(delta) {
    setForm(prev => {
      const current = Number(prev.qtyValue) || 0
      const step = ['g', 'mL', 'mg'].includes(prev.qtyUnit) ? 100 : 1
      const next = Math.max(0, Number((current + delta * step).toFixed(2)))
      return { ...prev, qtyValue: String(next) }
    })
  }

  function selectCatalogProductForForm(prod) {
    const unit   = prod.default_unit || 'un'
    const isUnit = UNIT_OPTIONS.includes(unit)
    setForm(prev => ({
      ...prev,
      productId:   prod.id,
      name:        prod.name || '',
      brand:       prod.brand || '',
      barcode:     prod.barcode || '',
      defaultUnit: unit,
      categoryId:  prev.categoryId || catalogCatId || '',
      imageUrl:    prod.image_url || prev.imageUrl || '',
      qtyType:     prev.qtyType === 'none' ? (isUnit ? 'unit' : 'weight') : prev.qtyType,
      qtyValue:    prev.qtyValue || '1',
      qtyUnit:     unit,
    }))
    setShowSuggestions(false)
    setTab('new')
  }

  async function handleQuickAddFromCatalog(prod) {
    if (existingProductIds.has(prod.id)) return
    setAddingProdId(prod.id)
    try {
      const unit = prod.default_unit || 'un'
      await onSubmit({
        productId:   prod.id,
        name:        prod.name,
        brand:       prod.brand       || null,
        barcode:     prod.barcode     || null,
        defaultUnit: unit,
        categoryId:  catalogCatId     || null,
        qty_value:   1,
        qty_unit:    unit,
        notes:       null,
        imageUrl:    prod.image_url   || null,
      })
      setJustAddedIds(prev => new Set(prev).add(prod.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingProdId(null)
    }
  }

  function handleImageChange(url) {
    setForm(prev => ({ ...prev, imageUrl: url ?? '' }))
  }

  async function handleBarcodeBlur() {
    const code = form.barcode.trim()
    if (!code) return
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name, brand, barcode, default_unit, image_url')
      .eq('barcode', code)
      .maybeSingle()

    if (existingProduct) {
      setForm(prev => ({
        ...prev,
        productId:   existingProduct.id,
        name:        prev.name.trim()  ? prev.name  : (existingProduct.name  ?? ''),
        brand:       prev.brand.trim() ? prev.brand : (existingProduct.brand ?? ''),
        defaultUnit: existingProduct.default_unit || prev.defaultUnit || 'un',
        qtyUnit:     prev.qtyUnit || existingProduct.default_unit || 'un',
        imageUrl:    prev.imageUrl || existingProduct.image_url || '',
      }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      const hasQty      = form.qtyType !== 'none' && form.qtyValue !== ''
      const qtyValue    = hasQty ? Number(form.qtyValue) : null
      const defaultUnit = form.defaultUnit || form.qtyUnit || 'un'
      const qtyUnit     = hasQty ? (form.qtyUnit || defaultUnit) : defaultUnit

      await onSubmit({
        productId:   form.productId      || null,
        name:        form.name.trim(),
        brand:       form.brand.trim()   || null,
        barcode:     form.barcode.trim() || null,
        defaultUnit,
        categoryId:  form.categoryId     || null,
        qty_value:   qtyValue,
        qty_unit:    qtyUnit,
        notes:       form.notes.trim()   || null,
        imageUrl:    form.imageUrl       || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const availableInCatalogCount = catalogProducts.filter(p => !existingProductIds.has(p.id)).length

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar item' : 'Adicionar ao Caldeirão'}>

      {/* Seletor de Abas ao Adicionar: Catálogo do Banco vs Novo Produto */}
      {!isEdit && catalogProducts.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition',
              tab === 'catalog'
                ? 'bg-white shadow text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <BookOpen size={14} />
            Produtos do Banco ({availableInCatalogCount > 0 ? availableInCatalogCount : catalogProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('new')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition',
              tab === 'new'
                ? 'bg-white shadow text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Sparkles size={14} />
            Criar / Personalizar
          </button>
        </div>
      )}

      {/* ABA 1: Catálogo de produtos já existentes na tabela `products` */}
      {!isEdit && tab === 'catalog' ? (
        <div className="flex flex-col gap-3">
          {/* Busca + Categoria padrão para adição rápida */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Buscar produto já cadastrado..."
                className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>

            {categories.length > 0 && (
              <select
                value={catalogCatId}
                onChange={e => setCatalogCatId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 sm:max-w-[170px]"
                title="Categoria ao adicionar"
              >
                <option value="">Categoria (opcional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Lista de produtos do banco */}
          <div className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto scrollbar-hide pr-0.5">
            {catalogLoading ? (
              <p className="text-xs text-gray-400 text-center py-8">Carregando produtos do banco...</p>
            ) : filteredCatalog.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">Nenhum produto encontrado com "{catalogSearch}".</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setForm(prev => ({ ...prev, name: catalogSearch.trim(), productId: null }))
                    setTab('new')
                  }}
                >
                  + Criar "{catalogSearch.trim()}" como novo
                </Button>
              </div>
            ) : (
              filteredCatalog.map(prod => {
                const alreadyInHouse = existingProductIds.has(prod.id)
                const thumb = prod.image_url || getCategoryPlaceholder('', '📦', prod.name)
                return (
                  <div
                    key={prod.id}
                    className={cn(
                      'flex items-center justify-between gap-3 p-2.5 rounded-xl border transition',
                      alreadyInHouse
                        ? 'bg-gray-50 border-gray-200 opacity-65'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={thumb}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-200 p-0.5 flex-shrink-0"
                        onError={e => { e.target.src = getCategoryPlaceholder('', '📦', prod.name) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {[prod.brand, `Unidade: ${prod.default_unit || 'un'}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>

                    {alreadyInHouse ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-semibold flex-shrink-0">
                        <Check size={13} /> No Caldeirão
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => selectCatalogProductForForm(prod)}
                          title="Escolher quantidade, categoria e detalhes antes de adicionar"
                          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-300 transition"
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          loading={addingProdId === prod.id}
                          onClick={() => handleQuickAddFromCatalog(prod)}
                          className="gap-1 whitespace-nowrap"
                        >
                          <Plus size={14} /> Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        /* ABA 2: Formulário de Criar / Personalizar / Editar */
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Badge indicando quando está vinculado a um produto existente do catálogo */}
          {!isEdit && form.productId && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-700">
              <span className="truncate font-medium">
                🔗 Produto existente selecionado: <strong>{form.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, productId: null }))}
                className="text-primary-600 hover:underline flex-shrink-0 font-semibold"
              >
                Desvincular
              </button>
            </div>
          )}

          {/* Nome do item com sugestões de produtos já cadastrados */}
          <div className="relative">
            <Input
              label="Nome do item *"
              placeholder="Ex: Leite, Detergente..."
              value={form.name}
              onChange={set('name')}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              error={error}
              autoFocus
              maxLength={80}
            />

            {showSuggestions && nameSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Já cadastrados no banco — clique para usar:
                </p>
                {nameSuggestions.map(prod => {
                  const alreadyInHouse = existingProductIds.has(prod.id)
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      disabled={alreadyInHouse}
                      onMouseDown={e => {
                        e.preventDefault()
                        selectCatalogProductForForm(prod)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-left text-sm transition',
                        alreadyInHouse
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'hover:bg-primary-50 text-gray-800'
                      )}
                    >
                      <span className="truncate font-medium">
                        {prod.name}
                        {prod.brand && <span className="text-xs text-gray-400 ml-1">· {prod.brand}</span>}
                      </span>
                      <span className="text-xs text-primary-600 font-medium ml-2 flex-shrink-0">
                        {alreadyInHouse ? 'Já no Caldeirão' : `Usar (${prod.default_unit || 'un'})`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

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
              onBlur={handleBarcodeBlur}
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    onClick={() => {
                      const nextUnit = t.key === 'unit'
                        ? (UNIT_OPTIONS.includes(form.defaultUnit) ? form.defaultUnit : 'un')
                        : t.key === 'weight'
                          ? (!UNIT_OPTIONS.includes(form.defaultUnit) ? form.defaultUnit : 'kg')
                          : form.defaultUnit
                      setForm(p => ({
                        ...p,
                        qtyType: t.key,
                        qtyValue: t.key === 'none' ? '' : (p.qtyValue || '1'),
                        qtyUnit: nextUnit,
                      }))
                    }}
                    className={cn('px-2.5 py-1 rounded-md font-semibold transition',
                      form.qtyType === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {form.qtyType !== 'none' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => stepFormQuantity(-1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 transition font-bold text-base"
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.qtyValue}
                    onChange={e => setForm(p => ({ ...p, qtyValue: e.target.value }))}
                    placeholder={form.qtyType === 'weight' ? 'Ex: 500' : '0'}
                    className="flex-1 text-center text-base font-semibold bg-transparent outline-none text-gray-900 w-16"
                    inputMode="decimal"
                  />
                  <button
                    type="button"
                    onClick={() => stepFormQuantity(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 transition font-bold text-base"
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>

                {form.qtyType === 'unit' ? (
                  <select
                    value={form.qtyUnit}
                    onChange={e => setForm(p => ({ ...p, qtyUnit: e.target.value, defaultUnit: e.target.value }))}
                    className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="un">un.</option>
                    <option value="unid">unid.</option>
                    <option value="cx">cx.</option>
                    <option value="pct">pct.</option>
                    <option value="par">par</option>
                  </select>
                ) : (
                  <select
                    value={form.qtyUnit}
                    onChange={e => setForm(p => ({ ...p, qtyUnit: e.target.value, defaultUnit: e.target.value }))}
                    className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="mL">mL</option>
                    <option value="mg">mg</option>
                  </select>
                )}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Imagem do produto</span>
              <div className="flex items-center gap-2">
                {form.imageUrl && (
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                    className="text-xs text-red-600 hover:opacity-80 flex items-center gap-1 transition">
                    ✕ Remover
                  </button>
                )}
                <div className="flex rounded-lg bg-gray-100 p-0.5">
                  {IMAGE_MODES.map(m => {
                    const Icon = m.icon
                    return (
                      <button key={m.key} type="button" onClick={() => setImageMode(m.key)}
                        className={cn('flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition',
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

            {imageMode === 'upload' ? (
              <ImageUploader value={form.imageUrl} onChange={handleImageChange} />
            ) : (
              <BarcodeScanner
                onClose={() => setImageMode('upload')}
                onResult={(product) => {
                  setForm(prev => ({
                    ...prev,
                    name:        prev.name.trim()  ? prev.name  : (product.name  || ''),
                    brand:       prev.brand.trim() ? prev.brand : (product.brand || ''),
                    barcode:     product.barcode     || prev.barcode,
                    defaultUnit: product.defaultUnit || prev.defaultUnit || 'un',
                    qtyUnit:     product.defaultUnit || prev.qtyUnit     || 'un',
                    imageUrl:    product.imageUrl    || prev.imageUrl,
                  }))
                  setImageMode('upload')
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
      )}
    </Modal>
  )
}
