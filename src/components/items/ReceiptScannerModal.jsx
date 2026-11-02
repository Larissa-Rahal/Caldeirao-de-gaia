import { useState, useRef } from 'react'
import { Camera, ImagePlus, Sparkles, Check, Plus, RotateCcw, KeyRound, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  compressReceiptImage,
  analyzeReceiptImage,
  getGeminiApiKey,
  saveGeminiApiKey,
  hasEnvGeminiKey,
} from '@/lib/receiptScanner'
import toast from 'react-hot-toast'

export function ReceiptScannerModal({
  open,
  onClose,
  items = [],
  categories = [],
  onRestockItem,
  onAddItem,
}) {
  const cameraInputRef  = useRef(null)
  const galleryInputRef = useRef(null)

  const [apiKey,      setApiKey]      = useState(() => getGeminiApiKey())
  const [showKeyForm, setShowKeyForm] = useState(() => !getGeminiApiKey())
  const [previewUrl,  setPreviewUrl]  = useState(null)
  const [analyzing,   setAnalyzing]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [addingId,    setAddingId]    = useState(null)

  const [storeName, setStoreName] = useState('')
  const [matched,   setMatched]   = useState([])
  const [unmatched, setUnmatched] = useState([])
  const [hasResult, setHasResult] = useState(false)

  function resetState() {
    setPreviewUrl(null)
    setAnalyzing(false)
    setSaving(false)
    setAddingId(null)
    setStoreName('')
    setMatched([])
    setUnmatched([])
    setHasResult(false)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function handleSaveKey(e) {
    e.preventDefault()
    if (!apiKey.trim()) {
      toast.error('Cole uma chave válida da API Gemini.')
      return
    }
    saveGeminiApiKey(apiKey.trim())
    setShowKeyForm(false)
    toast.success('Chave salva neste navegador!')
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const currentKey = apiKey.trim() || getGeminiApiKey()
    if (!currentKey) {
      setShowKeyForm(true)
      toast.error('Configure sua chave da API Gemini antes de ler a nota.')
      return
    }

    setAnalyzing(true)
    setHasResult(false)
    try {
      const { base64, mimeType, previewUrl: dataUrl } = await compressReceiptImage(file)
      setPreviewUrl(dataUrl)

      const result = await analyzeReceiptImage({
        base64,
        mimeType,
        existingItems: items,
        categories,
        apiKey: currentKey,
      })

      setStoreName(result.storeName)
      setMatched(result.matched)
      setUnmatched(result.unmatched)
      setHasResult(true)

      if (result.matched.length === 0 && result.unmatched.length === 0) {
        toast('Nenhum produto foi identificado na imagem.', { icon: '🔎' })
      } else {
        toast.success(
          `${result.matched.length + result.unmatched.length} produto(s) lido(s) na nota!`
        )
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao analisar a nota fiscal.')
    } finally {
      setAnalyzing(false)
    }
  }

  function toggleMatchedSelection(itemId) {
    setMatched(prev =>
      prev.map(m => (m.itemId === itemId ? { ...m, selected: !m.selected } : m))
    )
  }

  function adjustMatchedQty(itemId, delta) {
    setMatched(prev =>
      prev.map(m => {
        if (m.itemId !== itemId) return m
        const next = Math.max(0.5, Number((m.addedQty + delta).toFixed(2)))
        return { ...m, addedQty: next }
      })
    )
  }

  function updateUnmatchedCategory(tempId, categoryId) {
    setUnmatched(prev =>
      prev.map(u => (u.tempId === tempId ? { ...u, categoryId } : u))
    )
  }

  async function handleConfirmRestock() {
    const selected = matched.filter(m => m.selected && m.addedQty > 0)
    if (selected.length === 0) {
      handleClose()
      return
    }
    setSaving(true)
    try {
      for (const entry of selected) {
        await onRestockItem(entry.itemId, entry.addedQty, entry.unit)
      }
      toast.success(
        `${selected.length} ${selected.length === 1 ? 'item atualizado' : 'itens atualizados'} no Caldeirão!`
      )
      handleClose()
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar itens do estoque.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSingleUnmatched(entry) {
    if (!onAddItem || entry.added) return
    setAddingId(entry.tempId)
    try {
      await onAddItem({
        name:        entry.name,
        brand:       entry.brand || null,
        barcode:     null,
        defaultUnit: entry.unit || 'un',
        categoryId:  entry.categoryId || null,
        qty_value:   entry.qty,
        qty_unit:    entry.unit || 'un',
        notes:       null,
        imageUrl:    null,
      })
      setUnmatched(prev =>
        prev.map(u => (u.tempId === entry.tempId ? { ...u, added: true } : u))
      )
      toast.success(`"${entry.name}" cadastrado no Caldeirão!`)
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar item.')
    } finally {
      setAddingId(null)
    }
  }

  const selectedCount = matched.filter(m => m.selected).length

  return (
    <Modal open={open} onClose={handleClose} title="📜 Ler Nota Fiscal">
      <div className="flex flex-col gap-4">

        {/* Configuração da chave Gemini (caso não esteja em VITE_GEMINI_API_KEY) */}
        {!hasEnvGeminiKey() && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            {showKeyForm ? (
              <form onSubmit={handleSaveKey} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-primary-600" />
                    Chave da API Google Gemini (Gratuita)
                  </span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    Obter chave <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Cole sua chave AIzaSy..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button type="submit" size="sm">Salvar</Button>
                </div>
                <p className="text-[11px] text-gray-400">
                  A chave fica salva apenas no seu navegador (ou defina <code>VITE_GEMINI_API_KEY</code> no <code>.env</code>).
                </p>
              </form>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary-600" />
                  Leitura inteligente ativa (Gemini Vision)
                </span>
                <button
                  type="button"
                  onClick={() => setShowKeyForm(true)}
                  className="text-primary-700 hover:underline font-medium"
                >
                  Trocar chave API
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inputs ocultos para Câmera e Galeria */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* Estado inicial: botões de captura compatíveis com Tema Claro e Tema Escuro */}
        {!analyzing && !hasResult && (
          <div className="flex flex-col gap-3 py-1">
            <p className="text-xs text-gray-500 text-center px-2">
              Fotografe o cupom fiscal do mercado. A IA identifica os produtos abreviados e soma as quantidades aos itens que você já tem no Caldeirão!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-primary-50 text-gray-800 transition cursor-pointer"
              >
                <Camera size={28} className="text-primary-700" />
                <span className="text-sm font-semibold text-gray-900">Fotografar Nota</span>
                <span className="text-[11px] text-gray-400">Usar câmera do celular</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-primary-50 text-gray-800 transition cursor-pointer"
              >
                <ImagePlus size={28} className="text-primary-700" />
                <span className="text-sm font-semibold text-gray-900">Escolher da Galeria</span>
                <span className="text-[11px] text-gray-400">Enviar foto ou print</span>
              </button>
            </div>
          </div>
        )}

        {/* Estado de carregamento durante a leitura da IA */}
        {analyzing && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            {previewUrl && (
              <div className="w-28 h-36 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
                <img src={previewUrl} alt="Nota fiscal" className="w-full h-full object-cover opacity-75" />
              </div>
            )}
            <div className="flex items-center gap-2 text-primary-700 font-semibold text-sm">
              <Sparkles size={18} className="animate-spin" />
              Decifrando o pergaminho fiscal...
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              Traduzindo abreviações do cupom e cruzando com os itens do seu Caldeirão.
            </p>
          </div>
        )}

        {/* Resultado da Conferência */}
        {!analyzing && hasResult && (
          <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto scrollbar-hide pr-1">

            {/* Barra de topo do resultado */}
            <div className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2.5 min-w-0">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Miniatura da nota"
                    className="w-9 h-9 rounded-lg object-cover border border-gray-300 flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {storeName ? `Nota: ${storeName}` : 'Nota Fiscal Analisada'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {matched.length} no seu Caldeirão · {unmatched.length} novos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetState}
                className="flex items-center gap-1 text-xs text-primary-700 hover:underline font-medium flex-shrink-0"
              >
                <RotateCcw size={13} /> Outra foto
              </button>
            </div>

            {/* SEÇÃO 1: Itens já cadastrados no Caldeirão */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                ✅ Encontrados no seu Caldeirão ({matched.length})
              </h4>

              {matched.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-center">
                  Nenhum item desta nota corresponde aos nomes já cadastrados no Caldeirão.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {matched.map(entry => {
                    const newTotal = Number((entry.currentQty + entry.addedQty).toFixed(3))
                    return (
                      <div
                        key={entry.itemId}
                        className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition ${
                          entry.selected
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.selected}
                            onChange={() => toggleMatchedSelection(entry.itemId)}
                            className="mt-1 rounded text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {entry.productName}
                            </p>
                            {entry.rawTexts.length > 0 && (
                              <p className="text-[11px] text-gray-400 truncate" title={entry.rawTexts.join(', ')}>
                                Na nota: {entry.rawTexts.join(' + ')}
                              </p>
                            )}
                            <p className="text-xs text-green-800 font-medium mt-0.5">
                              Tinha: <strong>{entry.currentQty} {entry.unit}</strong> → Vai para:{' '}
                              <strong>{newTotal} {entry.unit}</strong> (Em Estoque)
                            </p>
                          </div>
                        </label>

                        {/* Ajuste rápido da quantidade lida na nota */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustMatchedQty(entry.itemId, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold text-gray-600"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold text-primary-700 px-1 whitespace-nowrap">
                            +{entry.addedQty} {entry.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustMatchedQty(entry.itemId, +1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-xs font-bold text-gray-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Botão de confirmação dos itens encontrados */}
            {matched.length > 0 && (
              <Button
                onClick={handleConfirmRestock}
                loading={saving}
                disabled={selectedCount === 0}
                size="lg"
                className="w-full gap-2"
              >
                <Check size={18} />
                Somar {selectedCount} {selectedCount === 1 ? 'item' : 'itens'} ao Caldeirão
              </Button>
            )}

            {/* SEÇÃO 2: Outros itens da nota que ainda não estão no Caldeirão */}
            {unmatched.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 mt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  📦 Outros itens na nota ({unmatched.length})
                </h4>
                <p className="text-[11px] text-gray-400 -mt-1">
                  Estes produtos ainda não existem no seu Caldeirão. Clique em <strong>+ Cadastrar</strong> nos que desejar incluir:
                </p>

                <div className="flex flex-col gap-2">
                  {unmatched.map(entry => (
                    <div
                      key={entry.tempId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entry.name}
                          {entry.brand && (
                            <span className="text-xs text-gray-400 font-normal ml-1">· {entry.brand}</span>
                          )}
                          <span className="ml-1.5 text-xs font-semibold text-primary-700">
                            ({entry.qty} {entry.unit})
                          </span>
                        </p>
                        {entry.rawText && (
                          <p className="text-[11px] text-gray-400 truncate">
                            Na nota: {entry.rawText}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!entry.added && categories.length > 0 && (
                          <select
                            value={entry.categoryId}
                            onChange={e => updateUnmatchedCategory(entry.tempId, e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[130px]"
                          >
                            <option value="">Sem categoria</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.emoji} {cat.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {entry.added ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-semibold">
                            <Check size={13} /> Cadastrado
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={addingId === entry.tempId}
                            onClick={() => handleAddSingleUnmatched(entry)}
                            className="gap-1 whitespace-nowrap"
                          >
                            <Plus size={14} /> Cadastrar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
