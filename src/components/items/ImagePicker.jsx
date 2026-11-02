import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, ImageOff } from 'lucide-react'
import { searchProductImages } from '@/lib/openFoodFacts'
import { cn } from '@/lib/utils'

export function ImagePicker({ itemName, value, onChange }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (itemName && !searched) {
      setQuery(itemName)
    }
  }, [itemName]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doSearch(q) {
    const term = (q || '').trim()
    if (term.length < 2) { setResults([]); return }
    setLoading(true)
    setSearched(true)
    const res = await searchProductImages(term, 16)
    setResults(res)
    setLoading(false)
  }

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 700)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(debounceRef.current)
      doSearch(query)
    }
  }

  function handleSelect(img) {
    onChange(img === value ? null : img)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Preview da selecionada */}
      {value && (
        <div className="flex items-center gap-3 p-2 bg-primary-50 border border-primary-100 rounded-xl">
          <img
            src={value}
            alt="Imagem selecionada"
            className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0"
            onError={e => { e.target.style.display = 'none' }}
          />
          <p className="text-xs text-primary-700 font-medium">✓ Imagem selecionada</p>
        </div>
      )}

      {/* Campo de pesquisa — translate="no" impede o browser de traduzir */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Ex: Açúcar, Leite, Detergente..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            translate="no"
            lang="pt"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          type="button"
          onClick={() => { clearTimeout(debounceRef.current); doSearch(query) }}
          disabled={loading || query.trim().length < 2}
          className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-40 transition flex items-center gap-1"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Ver'}
        </button>
      </div>

      {/* Estado: carregando */}
      {searched && loading && (
        <div className="flex items-center justify-center py-5 gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> A pesquisar...
        </div>
      )}

      {/* Estado: sem resultados */}
      {searched && !loading && results.length === 0 && (
        <div className="flex flex-col items-center py-5 gap-2 text-gray-400">
          <ImageOff size={22} />
          <p className="text-xs text-center">
            Sem resultados para <strong>"{query}"</strong>.<br />
            Tenta em inglês ou com outro nome.
          </p>
        </div>
      )}

      {/* Grelha de resultados */}
      {searched && !loading && results.length > 0 && (
        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-0.5">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r.image)}
              title={[r.name, r.brand].filter(Boolean).join(' — ')}
              className={cn(
                'relative aspect-square rounded-xl border-2 overflow-hidden bg-white transition-all duration-150',
                value === r.image
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300 active:scale-95'
              )}
            >
              <img
                src={r.image}
                alt={r.name}
                className="w-full h-full object-contain p-1"
                loading="lazy"
                onError={e => { e.target.closest('button').style.display = 'none' }}
              />
              {value === r.image && (
                <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                  <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Atribuição obrigatória — licença Open Database */}
      {searched && (
        <p className="text-xs text-gray-400 text-center">
          Imagens via{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-gray-600">
            Open Food Facts
          </a>
          {' '}· licença{' '}
          <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-gray-600">
            ODbL
          </a>
        </p>
      )}
    </div>
  )
}
