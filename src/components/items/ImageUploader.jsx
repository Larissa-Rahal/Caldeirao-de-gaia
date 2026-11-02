import { useRef, useState } from 'react'
import { Upload, Loader2, X, Camera, Images } from 'lucide-react'
import { uploadProductImage } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function ImageUploader({ value, onChange }) {
  const { user }   = useAuth()
  const cameraRef  = useRef(null)  // abre câmara
  const galleryRef = useRef(null)  // abre galeria

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [preview,  setPreview]  = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setError('')
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
    e.target.value = ''
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

      {/* Input câmara — capture="environment" força câmara traseira em mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Tirar foto"
      />

      {/* Input galeria — sem capture, abre o seletor de ficheiros/galeria */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Escolher da galeria"
      />

      {displayImage ? (
        /* Preview */
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
        <>
          {/* Zona drag-and-drop (desktop) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'w-full flex items-center justify-center py-4 rounded-2xl border-2 border-dashed transition-colors',
              dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50',
              loading && 'opacity-50'
            )}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin text-primary-500" />
            ) : (
              <p className="text-xs text-gray-400">
                Arrasta uma imagem aqui · ou usa os botões abaixo
              </p>
            )}
          </div>

          {/* Botões câmara + galeria */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition disabled:opacity-40"
            >
              <Camera size={18} />
              Câmara
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition disabled:opacity-40"
            >
              <Images size={18} />
              Galeria
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            JPG, PNG, WebP · máx. 5MB
          </p>
        </>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  )
}
