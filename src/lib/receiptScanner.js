const GEMINI_KEY_STORAGE = 'caldeirao_gemini_api_key'

export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.trim()) return envKey.trim()
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim()
  }
  return ''
}

export function saveGeminiApiKey(key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_KEY_STORAGE, (key || '').trim())
  }
}

export function hasEnvGeminiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  return Boolean(envKey && envKey.trim())
}

/**
 * Redimensiona e comprime a foto da nota fiscal para envio rápido à API multimodal.
 */
export function compressReceiptImage(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Formato de imagem inválido.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        resolve({ base64, mimeType: 'image/jpeg', previewUrl: dataUrl })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function normalizeStr(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Extrai o texto JSON da resposta da Interactions API.
 */
function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }
  if (Array.isArray(data?.steps)) {
    const modelSteps = data.steps.filter(s => s.type === 'model_output')
    const texts = []
    for (const step of modelSteps) {
      if (Array.isArray(step.content)) {
        for (const part of step.content) {
          if (part.type === 'text' && typeof part.text === 'string') {
            texts.push(part.text)
          }
        }
      }
    }
    if (texts.length > 0) return texts.join('\n').trim()
  }
  if (Array.isArray(data?.outputs) && data.outputs.length > 0) {
    const last = data.outputs[data.outputs.length - 1]
    if (typeof last?.text === 'string') return last.text.trim()
  }
  return ''
}

/**
 * Analisa a foto de uma Nota/Cupom Fiscal usando Gemini 3.8 Flash via Interactions API
 * e cruza automaticamente com os produtos já cadastrados no Caldeirão.
 */
export async function analyzeReceiptImage({ base64, mimeType, existingItems = [], categories = [], apiKey }) {
  const resolvedKey = (apiKey || getGeminiApiKey()).trim()
  if (!resolvedKey) {
    throw new Error('Informe sua chave da API do Google Gemini para analisar a nota fiscal.')
  }

  const catalogContext = existingItems.map(item => ({
    id:       item.id,
    name:     item.product?.name ?? item.name ?? '',
    brand:    item.product?.brand ?? item.brand ?? '',
    unit:     item.qty_unit || item.product?.default_unit || 'un',
    category: item.category?.name ?? '',
  }))

  const categoriesContext = categories.map(c => ({
    id:   c.id,
    name: c.name,
  }))

  const prompt = [
    'Você é um assistente especialista em ler cupons fiscais e notas fiscais de supermercado no Brasil (NFC-e, SAT, cupons impressos).',
    'Analise a imagem da nota fiscal enviada, identifique todos os produtos comprados com suas respectivas quantidades e faça a correspondência com a lista de itens já cadastrados na casa.',
    '',
    'Regras de tradução e vínculo:',
    '1. Cupons fiscais usam abreviações (ex: "ARR T1 CAMIL 5KG" -> clean_name: "Arroz", brand: "Camil"; "AMAC ROUPA DOWNY" -> clean_name: "Amaciante", brand: "Downy"; "DET LIQ YPE" -> clean_name: "Detergente", brand: "Ypê"; "PAP HIG NEVE" -> clean_name: "Papel Higiênico", brand: "Neve").',
    '2. Se o produto da nota corresponder a um item da lista `CATALOGO_ATUAL` (mesmo que o item do catálogo seja genérico como "Arroz", "Amaciante", "Sabonete", "Leite", "Carne"), preencha `matched_item_id` exatamente com o `id` desse item do catálogo.',
    '3. Se o mesmo item do catálogo aparecer em mais de uma linha da nota, você pode somar a quantidade ou listar cada ocorrência apontando para o mesmo `matched_item_id`.',
    '4. Para `unit`, normalize para uma destas opções: "un", "kg", "g", "L", "ml", "pct", "cx". Quando o item já existir no catálogo e sua unidade no catálogo for "un" (ex: comprou 2 pacotes/garrafas e na nota está 2 UN), use a quantidade comprada em unidades (2).',
    '5. Para itens que NÃO existem em `CATALOGO_ATUAL`, deixe `matched_item_id` como string vazia "" e escolha o `suggested_category_id` mais adequado dentre `CATEGORIAS_DISPONIVEIS` (ou "" se nenhuma servir).',
    '',
    `CATALOGO_ATUAL: ${JSON.stringify(catalogContext)}`,
    `CATEGORIAS_DISPONIVEIS: ${JSON.stringify(categoriesContext)}`,
  ].join('\n')

  const responseSchema = {
    type: 'object',
    properties: {
      store_name: {
        type: 'string',
        description: 'Nome do mercado ou estabelecimento, se visível na nota',
      },
      items: {
        type: 'array',
        description: 'Lista de produtos identificados na nota fiscal',
        items: {
          type: 'object',
          properties: {
            raw_text: {
              type: 'string',
              description: 'Descrição original abreviada como aparece na nota fiscal',
            },
            clean_name: {
              type: 'string',
              description: 'Nome do produto limpo e legível em português (ex: Arroz, Leite, Amaciante)',
            },
            brand: {
              type: 'string',
              description: 'Marca identificada no cupom ou string vazia se não houver',
            },
            quantity: {
              type: 'number',
              description: 'Quantidade numérica comprada na nota fiscal (padrão 1 se não legível)',
            },
            unit: {
              type: 'string',
              description: 'Unidade de medida: un, kg, g, L, ml, pct ou cx',
            },
            matched_item_id: {
              type: 'string',
              description: 'ID do item correspondente em CATALOGO_ATUAL, ou string vazia se não estiver cadastrado',
            },
            suggested_category_id: {
              type: 'string',
              description: 'ID da categoria sugerida em CATEGORIAS_DISPONIVEIS',
            },
          },
          required: ['raw_text', 'clean_name', 'brand', 'quantity', 'unit', 'matched_item_id', 'suggested_category_id'],
        },
      },
    },
    required: ['items'],
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(resolvedKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        store: false,
        input: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image',
            data: base64,
            mime_type: mimeType || 'image/jpeg',
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: responseSchema,
        },
      }),
    }
  )

  if (!response.ok) {
    let errMsg = `Erro na API Gemini (${response.status})`
    try {
      const errJson = await response.json()
      errMsg = errJson?.error?.message || errMsg
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg)
  }

  const data = await response.json()
  const rawJsonText = extractOutputText(data)
  if (!rawJsonText) {
    throw new Error('Não foi possível extrair os dados da nota fiscal. Tente uma foto mais nítida.')
  }

  let parsed
  try {
    const cleaned = rawJsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('A resposta da leitura não pôde ser interpretada. Tente tirar outra foto da nota.')
  }

  const existingById = new Map(existingItems.map(i => [i.id, i]))
  const existingByNormName = new Map(
    existingItems.map(i => [normalizeStr(i.product?.name ?? i.name), i])
  )

  // Agrupa itens que apontam para o mesmo item já cadastrado no Caldeirão
  const matchedMap = new Map()
  const unmatchedList = []

  for (const entry of parsed.items || []) {
    const qty = Number(entry.quantity) > 0 ? Number(entry.quantity) : 1
    const cleanName = (entry.clean_name || entry.raw_text || 'Item').trim()

    let matchedItem = entry.matched_item_id ? existingById.get(entry.matched_item_id) : null
    if (!matchedItem) {
      const byName = existingByNormName.get(normalizeStr(cleanName))
      if (byName) matchedItem = byName
    }

    if (matchedItem) {
      const prev = matchedMap.get(matchedItem.id)
      if (prev) {
        prev.addedQty = Number((prev.addedQty + qty).toFixed(3))
        if (entry.raw_text && !prev.rawTexts.includes(entry.raw_text)) {
          prev.rawTexts.push(entry.raw_text)
        }
      } else {
        matchedMap.set(matchedItem.id, {
          itemId:      matchedItem.id,
          item:        matchedItem,
          productName: matchedItem.product?.name ?? matchedItem.name,
          currentQty:  Number(matchedItem.qty_value) || 0,
          unit:        matchedItem.qty_unit || matchedItem.product?.default_unit || entry.unit || 'un',
          addedQty:    qty,
          rawTexts:    entry.raw_text ? [entry.raw_text] : [],
          selected:    true,
        })
      }
    } else {
      unmatchedList.push({
        tempId:     `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        rawText:    entry.raw_text || '',
        name:       cleanName,
        brand:      (entry.brand || '').trim(),
        qty:        qty,
        unit:       entry.unit || 'un',
        categoryId: entry.suggested_category_id || (categories[0]?.id ?? ''),
        added:      false,
      })
    }
  }

  return {
    storeName: parsed.store_name || '',
    matched:   Array.from(matchedMap.values()),
    unmatched: unmatchedList,
  }
}
