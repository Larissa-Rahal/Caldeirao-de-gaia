import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  analyzeReceiptImage,
} from '@/lib/receiptScanner'

describe('src/lib/receiptScanner.js', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('salva e recupera a chave da API Gemini no localStorage quando não há variável de ambiente', () => {
    saveGeminiApiKey('  AIzaSyTestKey123  ')
    const key = getGeminiApiKey()
    expect(key).toBeTruthy()
  })

  it('lança erro claro quando nenhuma chave Gemini é informada', async () => {
    await expect(
      analyzeReceiptImage({
        base64: 'dGVzdA==',
        mimeType: 'image/jpeg',
        existingItems: [],
        categories: [],
        apiKey: '   ',
      })
    ).rejects.toThrow(/chave da API do Google Gemini/i)
  })

  it('reconcilia itens da nota fiscal com itens existentes (por ID e por nome sem acento), soma duplicados e separa itens novos', async () => {
    const existingItems = [
      {
        id: 'item-arroz',
        name: 'Arroz',
        qty_value: 1,
        qty_unit: 'pct',
        product: { id: 'p1', name: 'Arroz', brand: 'Camil', default_unit: 'pct' },
        category: { id: 'cat-1', name: 'Mercearia' },
      },
      {
        id: 'item-acucar',
        name: 'Açúcar',
        qty_value: 0,
        qty_unit: 'kg',
        product: { id: 'p2', name: 'Açúcar', brand: 'União', default_unit: 'kg' },
        category: { id: 'cat-1', name: 'Mercearia' },
      },
    ]

    const categories = [
      { id: 'cat-1', name: 'Mercearia' },
      { id: 'cat-2', name: 'Limpeza' },
    ]

    const mockGeminiResponse = {
      output_text: JSON.stringify({
        store_name: 'Supermercado Gaia',
        items: [
          {
            raw_text: 'ARR T1 CAMIL 5KG',
            clean_name: 'Arroz',
            brand: 'Camil',
            quantity: 2,
            unit: 'pct',
            matched_item_id: 'item-arroz',
            suggested_category_id: 'cat-1',
          },
          {
            raw_text: 'ARR INTEGRAL CAMIL',
            clean_name: 'Arroz',
            brand: 'Camil',
            quantity: 1,
            unit: 'pct',
            matched_item_id: 'item-arroz',
            suggested_category_id: 'cat-1',
          },
          {
            raw_text: 'ACUCAR REF UNIAO',
            clean_name: 'Acucar',
            brand: 'União',
            quantity: 3,
            unit: 'kg',
            matched_item_id: '',
            suggested_category_id: 'cat-1',
          },
          {
            raw_text: 'DET LIQ YPE 500ML',
            clean_name: 'Detergente',
            brand: 'Ypê',
            quantity: 4,
            unit: 'un',
            matched_item_id: '',
            suggested_category_id: '',
          },
        ],
      }),
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGeminiResponse,
    })

    const result = await analyzeReceiptImage({
      base64: 'dGVzdA==',
      mimeType: 'image/jpeg',
      existingItems,
      categories,
      apiKey: 'AIzaSyMockKey',
    })

    expect(result.storeName).toBe('Supermercado Gaia')
    expect(result.matched).toHaveLength(2)

    const arroz = result.matched.find(m => m.itemId === 'item-arroz')
    expect(arroz.currentQty).toBe(1)
    expect(arroz.addedQty).toBe(3)
    expect(arroz.rawTexts).toEqual(['ARR T1 CAMIL 5KG', 'ARR INTEGRAL CAMIL'])

    const acucar = result.matched.find(m => m.itemId === 'item-acucar')
    expect(acucar.currentQty).toBe(0)
    expect(acucar.addedQty).toBe(3)

    expect(result.unmatched).toHaveLength(1)
    expect(result.unmatched[0].name).toBe('Detergente')
    expect(result.unmatched[0].brand).toBe('Ypê')
    expect(result.unmatched[0].qty).toBe(4)
    expect(result.unmatched[0].categoryId).toBe('cat-1')
  })
})
