import { supabase } from './supabase'

const BUCKET = 'product-images'
const MAX_SIZE_MB = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Faz upload de um ficheiro de imagem para o Supabase Storage.
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>} URL pública da imagem
 */
export async function uploadProductImage(file, userId) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error('Formato não suportado. Usa JPG, PNG, WebP ou GIF.')
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Imagem demasiado grande. Máximo ${MAX_SIZE_MB}MB.`)
  }

  const ext  = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000', // 1 ano de cache
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Apaga uma imagem do Storage pela sua URL pública.
 * Ignora URLs externas (ex: Open Food Facts).
 */
export async function deleteProductImage(publicUrl) {
  if (!publicUrl?.includes(BUCKET)) return // URL externa, não apaga

  try {
    const parts = publicUrl.split(`/${BUCKET}/`)
    if (parts.length < 2) return
    await supabase.storage.from(BUCKET).remove([parts[1]])
  } catch {
    // Não é crítico se falhar
  }
}
