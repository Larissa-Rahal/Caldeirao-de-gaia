import { useEffect, useRef, useState } from 'react'
import { X, Loader2, ScanLine } from 'lucide-react'

/**
 * Leitor de código de barras via câmara.
 * Usa a BarcodeDetector API (suportada em Chrome/Android).
 * Fallback: input manual do código.
 * Ao detetar, consulta a Open Food Facts e retorna os dados do produto.
 */
export function BarcodeScanner({ onResult, onClose }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const [status,   setStatus]   = useState('starting') // starting|scanning|found|error|unsupported
  const [barcode,  setBarcode]  = useState('')
  const [manual,   setManual]   = useState('')
  const [product,  setProduct]  = useState(null)

  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  useEffect(() => {
    if (!supported) { setStatus('unsupported'); return }
    startCamera()
    return stopCamera
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStatus('scanning')
      scanFrame()
    } catch {
      setStatus('error')
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  async function scanFrame() {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame); return
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code'] })
      const codes = await detector.detect(videoRef.current)
      if (codes.length > 0) {
        const code = codes[0].rawValue
        setBarcode(code)
        setStatus('found')
        stopCamera()
        await lookupBarcode(code)
        return
      }
    } catch { /* continua */ }
    rafRef.current = requestAnimationFrame(scanFrame)
  }

  async function lookupBarcode(code) {
    setStatus('loading')
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        const result = {
          name:     p.product_name || p.product_name_pt || '',
          imageUrl: p.image_front_small_url || p.image_url || null,
          notes:    p.brands || '',
          barcode:  code,
        }
        setProduct(result)
        setStatus('found')
      } else {
        setProduct({ name: '', barcode: code })
        setStatus('not_found')
      }
    } catch {
      setProduct({ name: '', barcode: code })
      setStatus('not_found')
    }
  }

  async function handleManualSearch(e) {
    e.preventDefault()
    if (manual.trim().length < 4) return
    setBarcode(manual.trim())
    setStatus('loading')
    await lookupBarcode(manual.trim())
  }

  function handleUse() {
    if (product) onResult(product)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Câmara / estados */}
      {status === 'starting' && (
        <div className="flex items-center justify-center h-48 rounded-2xl bg-gray-50 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">A iniciar câmara...</span>
        </div>
      )}

      {status === 'scanning' && (
        <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: '240px' }}>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {/* Guia de scan */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-28 border-2 border-amber-400 rounded-xl opacity-80">
              <ScanLine size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 animate-pulse" />
            </div>
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
            Aponta para o código de barras
          </p>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center justify-center h-32 rounded-2xl bg-gray-50 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">A consultar produto...</span>
        </div>
      )}

      {(status === 'found' || status === 'not_found') && product && (
        <div className="flex gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name}
              className="w-16 h-16 object-contain rounded-xl bg-white border border-gray-100 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">Código: {product.barcode}</p>
            {status === 'not_found' ? (
              <p className="text-sm text-amber-600">Produto não encontrado na base de dados.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name || '—'}</p>
                {product.notes && <p className="text-xs text-gray-400 truncate">{product.notes}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center py-6 gap-2 text-gray-400">
          <X size={24} className="text-red-400" />
          <p className="text-sm">Sem acesso à câmara.</p>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
          ⚠️ O teu browser não suporta leitura de código de barras. Usa o Chrome no Android ou introduz o código manualmente.
        </div>
      )}

      {/* Input manual */}
      <form onSubmit={handleManualSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Ou introduz o código manualmente..."
          value={manual}
          onChange={e => setManual(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          inputMode="numeric"
        />
        <button type="submit"
          className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition">
          Pesquisar
        </button>
      </form>

      {/* Botão usar produto */}
      {(status === 'found' || status === 'not_found') && (
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleUse}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">
            {status === 'not_found' ? 'Usar código' : 'Usar produto'}
          </button>
        </div>
      )}
    </div>
  )
}
