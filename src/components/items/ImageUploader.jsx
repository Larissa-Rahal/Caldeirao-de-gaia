import { useRef, useState } from 'react'
import { Upload, Loader2, X, Camera } from 'lucide-react'
import { uploadProductImage } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

/**
 * Upload de imagem própria para o Supabase Storage.
 * Aceita clique e drag-and-drop.
 * Em mobile abre a câmara ou galeria automaticamente.
 */
export function ImageUploader({ value, onChange }) {
  const { user } = useAuth()
  const inputRef  = useRef(null)
  const [loading, setLoading]  = useState(false)
  const [error,   setError]    = useState('')
  const [preview, setPreview]  = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setError('')

    // Preview local imediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setLoading(true)

    try {
      const publicUrl = await uploadProductImage(file, user.id)
      onChange(publicUrl)
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0])
    e.target.value = ''  // reset para permitir selecionar o mesmo ficheiro de novo
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleClear() {
    onChange(null)
    setPreview(null)
    setError('')
  }

  const displayImage = preview || (value?.includes('supabase') ? value : null)

  return (
    <div className="flex flex-col gap-2">

      {/* Input oculto — aceita imagem, abre câmara em mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Carregar imagem"
      />

      {displayImage ? (
        /* Preview da imagem carregada */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={displayImage}
            alt="Imagem carregada"
            className="w-full h-40 object-contain p-2"
          />
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-primary-600" />
              <p className="text-xs text-gray-500">A enviar...</p>
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow border border-gray-200 text-gray-500 hover:text-red-500 transition"
              aria-label="Remover imagem"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        /* Zona de drop / botão de upload */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={loading}
          className={cn(
            'w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed transition-colors',
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/50',
            loading && 'opacity-50 pointer-events-none'
          )}
        >
          {loading ? (
            <Loader2 size={22} className="animate-spin text-primary-500" />
          ) : (
            <>
              <div className="flex gap-3 text-gray-400">
                <Upload size={20} />
                <Camera size={20} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Carregar imagem</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Clica ou arrasta · JPG, PNG, WebP · máx. 5MB
                </p>
                <p className="text-xs text-primary-500 mt-0.5 sm:hidden">
                  📷 No telemóvel abre a câmara
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  )
}
