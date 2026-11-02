import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchProductImages } from '@/lib/openFoodFacts'

describe('src/lib/openFoodFacts.js', () => {
  let fetchSpy

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('retorna array vazio sem chamar fetch se a query for vazia ou tiver menos de 2 caracteres', async () => {
    expect(await searchProductImages('')).toEqual([])
    expect(await searchProductImages('   ')).toEqual([])
    expect(await searchProductImages('a')).toEqual([])
    expect(await searchProductImages(null)).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('retorna produtos em português quando a primeira busca (lc=pt) traz 3 ou mais resultados válidos', async () => {
    const mockProducts = [
      { product_name: 'Arroz Agulhinha', image_front_small_url: 'https://images.openfoodfacts.org/1.jpg', brands: 'Camil' },
      { product_name: 'Arroz Integral',  image_front_small_url: 'https://images.openfoodfacts.org/2.jpg', brands: 'Tio João' },
      { product_name: 'Arroz Parboilizado', image_front_small_url: 'https://images.openfoodfacts.org/3.jpg', brands: 'Prato Fino' },
    ]

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    })

    const result = await searchProductImages('arroz', 12)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toContain('search_terms=arroz')
    expect(fetchSpy.mock.calls[0][0]).toContain('lc=pt')
    expect(result).toEqual([
      { name: 'Arroz Agulhinha',    image: 'https://images.openfoodfacts.org/1.jpg', brand: 'Camil' },
      { name: 'Arroz Integral',     image: 'https://images.openfoodfacts.org/2.jpg', brand: 'Tio João' },
      { name: 'Arroz Parboilizado', image: 'https://images.openfoodfacts.org/3.jpg', brand: 'Prato Fino' },
    ])
  })

  it('faz fallback para busca global (sem lc=pt) quando a busca em português retorna menos de 3 resultados', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [
            { product_name: 'Azeite PT', image_front_small_url: 'https://images.openfoodfacts.org/pt1.jpg', brands: 'Gallo' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [
            { product_name: 'Azeite Global 1', image_front_small_url: 'https://images.openfoodfacts.org/g1.jpg', brands: 'Borges' },
            { product_name: 'Azeite Global 2', image_front_small_url: 'https://images.openfoodfacts.org/g2.jpg', brands: 'Andorinha' },
          ],
        }),
      })

    const result = await searchProductImages('azeite', 5)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy.mock.calls[0][0]).toContain('lc=pt')
    expect(fetchSpy.mock.calls[1][0]).not.toContain('lc=pt')
    expect(result).toHaveLength(2)
    expect(result[0].brand).toBe('Borges')
  })

  it('filtra produtos sem URL https:// e respeita o limite máximo', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          { product_name: 'Sem foto', image_front_small_url: null, brands: 'X' },
          { product_name: 'HTTP inseguro', image_front_small_url: 'http://images.openfoodfacts.org/no.jpg', brands: 'Y' },
          { product_name: 'Válido 1', image_front_small_url: 'https://images.openfoodfacts.org/v1.jpg', brands: 'B1' },
          { product_name: 'Válido 2', image_front_small_url: 'https://images.openfoodfacts.org/v2.jpg', brands: 'B2' },
          { product_name: 'Válido 3', image_front_small_url: 'https://images.openfoodfacts.org/v3.jpg', brands: 'B3' },
          { product_name: 'Válido 4', image_front_small_url: 'https://images.openfoodfacts.org/v4.jpg', brands: 'B4' },
        ],
      }),
    })

    const result = await searchProductImages('leite', 3)

    expect(result).toHaveLength(3)
    expect(result.map(r => r.name)).toEqual(['Válido 1', 'Válido 2', 'Válido 3'])
  })

  it('retorna array vazio quando a resposta HTTP falha ou ocorre erro de rede', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockRejectedValueOnce(new Error('Network error'))

    const result = await searchProductImages('cafe')
    expect(result).toEqual([])
  })
})
