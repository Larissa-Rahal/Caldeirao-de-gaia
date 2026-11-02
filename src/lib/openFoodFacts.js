/**
 * Open Food Facts — pesquisa de imagens de produtos
 * API pública, sem autenticação, licença Open Database License
 * https://world.openfoodfacts.org
 */

/**
 * Pesquisa produtos pelo nome na Open Food Facts.
 * Tenta primeiro em português (BR/PT), depois com pesquisa global como fallback.
 */
export async function searchProductImages(query, limit = 12) {
  if (!query || query.trim().length < 2) return []

  const q = query.trim()

  // Tenta pesquisa em português primeiro, depois global
  const results = await fetchOFF(q, 'pt', limit)
    .then(r => r.length >= 3 ? r : fetchOFF(q, null, limit))

  return results
}

async function fetchOFF(query, lang, limit) {
  const params = new URLSearchParams({
    search_terms:  query,
    search_simple: '1',
    action:        'process',
    json:          '1',
    page_size:     String(limit * 2), // pede mais para compensar os sem foto
    fields:        'product_name,image_front_small_url,brands,lang',
  })

  // lc=pt restringe a produtos rotulados em português
  if (lang) params.set('lc', lang)

  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'EstoqueCasa/1.0 (https://estoque-casa-five.vercel.app)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []

    const data = await res.json()

    return (data.products ?? [])
      .filter(p => p.image_front_small_url?.startsWith('https://'))
      .slice(0, limit)
      .map(p => ({
        name:  p.product_name || query,
        image: p.image_front_small_url,
        brand: p.brands || '',
      }))
  } catch {
    return []
  }
}
