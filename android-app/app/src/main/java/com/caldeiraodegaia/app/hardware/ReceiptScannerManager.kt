package com.caldeiraodegaia.app.hardware

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.caldeiraodegaia.app.core.util.FormatUtils
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.remote.SupabaseModule
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import java.io.ByteArrayOutputStream
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import kotlin.math.max
import kotlin.math.roundToInt

data class CompressedReceiptImage(
    val bitmap: Bitmap,
    val jpegBytes: ByteArray,
    val base64: String,
    val mimeType: String = "image/jpeg",
    val ocrText: String = ""
)

data class MatchedReceiptItem(
    val itemId: String,
    val item: InventoryItem,
    val productName: String,
    val currentQty: Double,
    val unit: String,
    val addedQty: Double,
    val rawTexts: List<String>,
    val selected: Boolean = true
)

data class UnmatchedReceiptItem(
    val tempId: String,
    val rawText: String,
    val name: String,
    val brand: String,
    val qty: Double,
    val unit: String,
    val categoryId: String,
    val added: Boolean = false
)

data class ReceiptAnalysisResult(
    val storeName: String,
    val matched: List<MatchedReceiptItem>,
    val unmatched: List<UnmatchedReceiptItem>,
    val ocrPreview: String = ""
)

@Serializable
private data class CatalogContextEntry(
    val id: String,
    val name: String,
    val brand: String,
    val unit: String,
    val category: String
)

@Serializable
private data class CategoryContextEntry(
    val id: String,
    val name: String
)

@Serializable
private data class ParsedReceiptResponse(
    @SerialName("store_name") val storeName: String? = "",
    val items: List<ParsedReceiptLine> = emptyList()
)

@Serializable
private data class ParsedReceiptLine(
    @SerialName("raw_text") val rawText: String = "",
    @SerialName("clean_name") val cleanName: String = "",
    val brand: String = "",
    val quantity: Double = 1.0,
    val unit: String = "un",
    @SerialName("matched_item_id") val matchedItemId: String = "",
    @SerialName("suggested_category_id") val suggestedCategoryId: String = ""
)

/**
 * Substitui `src/lib/receiptScanner.js` utilizando:
 * 1) Compressão de imagem nativa Android (`BitmapFactory` + `ExifInterface`)
 * 2) Reconhecimento Óptico de Caracteres (OCR) nativo on-device via **Google ML Kit Text Recognition**
 * 3) Reconciliação semântica de abreviações de cupons fiscais brasileiros via Gemini 3.8 Flash (Interactions API)
 */
class ReceiptScannerManager(private val context: Context) {

    private val textRecognizer by lazy {
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    }

    /**
     * Lê um `Uri` de imagem (câmera ou galeria), corrige orientação EXIF, redimensiona para até
     * `maxDimension = 1600px`, comprime em JPEG (85%) e executa o **Google ML Kit Text Recognition**.
     */
    suspend fun prepareAndScanReceiptUri(
        uri: Uri,
        maxDimension: Int = 1600,
        quality: Int = 85
    ): CompressedReceiptImage = withContext(Dispatchers.IO) {
        val rawBytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Não foi possível ler a imagem selecionada.")

        val rotationDegrees = runCatching {
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val exif = ExifInterface(stream)
                when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            } ?: 0f
        }.getOrDefault(0f)

        val decoded = BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size)
            ?: throw IllegalArgumentException("Formato de imagem inválido.")

        val rotated = if (rotationDegrees != 0f) {
            val matrix = Matrix().apply { postRotate(rotationDegrees) }
            Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
        } else {
            decoded
        }

        val width = rotated.width
        val height = rotated.height
        val scaled = if (width > maxDimension || height > maxDimension) {
            val (targetW, targetH) = if (width >= height) {
                maxDimension to ((height.toFloat() * maxDimension) / width).roundToInt().coerceAtLeast(1)
            } else {
                ((width.toFloat() * maxDimension) / height).roundToInt().coerceAtLeast(1) to maxDimension
            }
            Bitmap.createScaledBitmap(rotated, targetW, targetH, true)
        } else {
            rotated
        }

        val outputStream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        val jpegBytes = outputStream.toByteArray()
        val base64 = Base64.encodeToString(jpegBytes, Base64.NO_WRAP)

        // Executa OCR nativo no dispositivo com Google ML Kit Text Recognition
        val ocrText = runCatching {
            val inputImage = InputImage.fromBitmap(scaled, 0)
            val visionText = textRecognizer.process(inputImage).await()
            visionText.text.trim()
        }.getOrDefault("")

        CompressedReceiptImage(
            bitmap = scaled,
            jpegBytes = jpegBytes,
            base64 = base64,
            mimeType = "image/jpeg",
            ocrText = ocrText
        )
    }

    /**
     * Equivalente a `analyzeReceiptImage` em `src/lib/receiptScanner.js`, enriquecido com o OCR do ML Kit.
     */
    suspend fun analyzeReceiptImage(
        compressed: CompressedReceiptImage,
        existingItems: List<InventoryItem>,
        categories: List<CategoryDto>,
        apiKey: String
    ): ReceiptAnalysisResult = withContext(Dispatchers.IO) {
        val resolvedKey = apiKey.trim()
        if (resolvedKey.isEmpty()) {
            throw IllegalArgumentException("Informe sua chave da API do Google Gemini para analisar a nota fiscal.")
        }

        val catalogContext = existingItems.map { item ->
            CatalogContextEntry(
                id = item.id,
                name = item.name,
                brand = item.brand.orEmpty(),
                unit = item.qtyUnit.ifBlank { item.defaultUnit.ifBlank { "un" } },
                category = item.category?.name.orEmpty()
            )
        }

        val categoriesContext = categories.map { cat ->
            CategoryContextEntry(id = cat.id, name = cat.name)
        }

        val promptLines = buildList {
            add("Você é um assistente especialista em ler cupons fiscais e notas fiscais de supermercado no Brasil (NFC-e, SAT, cupons impressos).")
            add("Analise a imagem da nota fiscal enviada, identifique todos os produtos comprados com suas respectivas quantidades e faça a correspondência com a lista de itens já cadastrados na casa.")
            add("")
            add("Regras de tradução e vínculo:")
            add("1. Cupons fiscais usam abreviações (ex: \"ARR T1 CAMIL 5KG\" -> clean_name: \"Arroz\", brand: \"Camil\"; \"AMAC ROUPA DOWNY\" -> clean_name: \"Amaciante\", brand: \"Downy\"; \"DET LIQ YPE\" -> clean_name: \"Detergente\", brand: \"Ypê\"; \"PAP HIG NEVE\" -> clean_name: \"Papel Higiênico\", brand: \"Neve\").")
            add("2. Se o produto da nota corresponder a um item da lista `CATALOGO_ATUAL` (mesmo que o item do catálogo seja genérico como \"Arroz\", \"Amaciante\", \"Sabonete\", \"Leite\", \"Carne\"), preencha `matched_item_id` exatamente com o `id` desse item do catálogo.")
            add("3. Se o mesmo item do catálogo aparecer em mais de uma linha da nota, você pode somar a quantidade ou listar cada ocorrência apontando para o mesmo `matched_item_id`.")
            add("4. Para `unit`, normalize para uma destas opções: \"un\", \"kg\", \"g\", \"L\", \"ml\", \"pct\", \"cx\". Quando o item já existir no catálogo e sua unidade no catálogo for \"un\" (ex: comprou 2 pacotes/garrafas e na nota está 2 UN), use a quantidade comprada em unidades (2).")
            add("5. Para itens que NÃO existem em `CATALOGO_ATUAL`, deixe `matched_item_id` como string vazia \"\" e escolha o `suggested_category_id` mais adequado dentre `CATEGORIAS_DISPONIVEIS` (ou \"\" se nenhuma servir).")
            add("")
            if (compressed.ocrText.isNotBlank()) {
                add("TEXTO_OCR_MLKIT_EXTRAIDO_NO_DISPOSITIVO:")
                add(compressed.ocrText.take(4000))
                add("")
            }
            add("CATALOGO_ATUAL: ${SupabaseModule.json.encodeToString(catalogContext)}")
            add("CATEGORIAS_DISPONIVEIS: ${SupabaseModule.json.encodeToString(categoriesContext)}")
        }.joinToString("\n")

        val requestPayload = buildJsonObject {
            put("model", "gemini-3.8-flash")
            put("store", false)
            putJsonArray("input") {
                addJsonObject {
                    put("type", "text")
                    put("text", promptLines)
                }
                addJsonObject {
                    put("type", "image")
                    put("data", compressed.base64)
                    put("mime_type", compressed.mimeType)
                }
            }
            putJsonObject("response_format") {
                put("type", "text")
                put("mime_type", "application/json")
                putJsonObject("schema") {
                    put("type", "object")
                    putJsonObject("properties") {
                        putJsonObject("store_name") {
                            put("type", "string")
                            put("description", "Nome do mercado ou estabelecimento, se visível na nota")
                        }
                        putJsonObject("items") {
                            put("type", "array")
                            put("description", "Lista de produtos identificados na nota fiscal")
                            putJsonObject("items") {
                                put("type", "object")
                                putJsonObject("properties") {
                                    putJsonObject("raw_text") {
                                        put("type", "string")
                                        put("description", "Descrição original abreviada como aparece na nota fiscal")
                                    }
                                    putJsonObject("clean_name") {
                                        put("type", "string")
                                        put("description", "Nome do produto limpo e legível em português (ex: Arroz, Leite, Amaciante)")
                                    }
                                    putJsonObject("brand") {
                                        put("type", "string")
                                        put("description", "Marca identificada no cupom ou string vazia se não houver")
                                    }
                                    putJsonObject("quantity") {
                                        put("type", "number")
                                        put("description", "Quantidade numérica comprada na nota fiscal (padrão 1 se não legível)")
                                    }
                                    putJsonObject("unit") {
                                        put("type", "string")
                                        put("description", "Unidade de medida: un, kg, g, L, ml, pct ou cx")
                                    }
                                    putJsonObject("matched_item_id") {
                                        put("type", "string")
                                        put("description", "ID do item correspondente em CATALOGO_ATUAL, ou string vazia se não estiver cadastrado")
                                    }
                                    putJsonObject("suggested_category_id") {
                                        put("type", "string")
                                        put("description", "ID da categoria sugerida em CATEGORIAS_DISPONIVEIS")
                                    }
                                }
                                put("required", buildJsonArray {
                                    add(kotlinx.serialization.json.JsonPrimitive("raw_text"))
                                    add(kotlinx.serialization.json.JsonPrimitive("clean_name"))
                                    add(kotlinx.serialization.json.JsonPrimitive("brand"))
                                    add(kotlinx.serialization.json.JsonPrimitive("quantity"))
                                    add(kotlinx.serialization.json.JsonPrimitive("unit"))
                                    add(kotlinx.serialization.json.JsonPrimitive("matched_item_id"))
                                    add(kotlinx.serialization.json.JsonPrimitive("suggested_category_id"))
                                })
                            }
                        }
                    }
                    put("required", buildJsonArray {
                        add(kotlinx.serialization.json.JsonPrimitive("items"))
                    })
                }
            }
        }

        val encodedKey = URLEncoder.encode(resolvedKey, StandardCharsets.UTF_8.toString())
        val httpResponse = SupabaseModule.httpClient.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions?key=$encodedKey"
        ) {
            contentType(ContentType.Application.Json)
            header("Api-Revision", "2026-05-20")
            setBody(SupabaseModule.json.encodeToString(requestPayload))
        }

        val responseBody = httpResponse.bodyAsText()
        if (!httpResponse.status.isSuccess()) {
            val apiError = runCatching {
                val errObj = SupabaseModule.json.parseToJsonElement(responseBody).jsonObject
                errObj["error"]?.jsonObject?.get("message")?.jsonPrimitive?.content
            }.getOrNull()
            throw IllegalStateException(apiError ?: "Erro na API Gemini (${httpResponse.status.value})")
        }

        val rootJson = SupabaseModule.json.parseToJsonElement(responseBody).jsonObject
        val rawOutputText = extractOutputText(rootJson)
        if (rawOutputText.isBlank()) {
            throw IllegalStateException("Não foi possível extrair os dados da nota fiscal. Tente uma foto mais nítida.")
        }

        val cleanedJson = rawOutputText
            .replace(Regex("^```json\\s*", RegexOption.IGNORE_CASE), "")
            .replace(Regex("```\\s*$"), "")
            .trim()

        val parsed = runCatching {
            SupabaseModule.json.decodeFromString<ParsedReceiptResponse>(cleanedJson)
        }.getOrElse {
            throw IllegalStateException("A resposta da leitura não pôde ser interpretada. Tente tirar outra foto da nota.")
        }

        val existingById = existingItems.associateBy { it.id }
        val existingByNormName = existingItems.associateBy { FormatUtils.normalizeForMatch(it.name) }

        val matchedMap = linkedMapOf<String, MatchedReceiptItem>()
        val unmatchedList = mutableListOf<UnmatchedReceiptItem>()

        for (entry in parsed.items) {
            val qty = if (entry.quantity > 0.0) entry.quantity else 1.0
            val cleanName = entry.cleanName.ifBlank { entry.rawText.ifBlank { "Item" } }.trim()

            var matchedItem = entry.matchedItemId.takeIf { it.isNotBlank() }?.let { existingById[it] }
            if (matchedItem == null) {
                matchedItem = existingByNormName[FormatUtils.normalizeForMatch(cleanName)]
            }

            if (matchedItem != null) {
                val prev = matchedMap[matchedItem.id]
                if (prev != null) {
                    val combinedQty = ((prev.addedQty + qty) * 1000.0).roundToInt() / 1000.0
                    val updatedRawTexts = if (entry.rawText.isNotBlank() && !prev.rawTexts.contains(entry.rawText)) {
                        prev.rawTexts + entry.rawText
                    } else {
                        prev.rawTexts
                    }
                    matchedMap[matchedItem.id] = prev.copy(
                        addedQty = combinedQty,
                        rawTexts = updatedRawTexts
                    )
                } else {
                    matchedMap[matchedItem.id] = MatchedReceiptItem(
                        itemId = matchedItem.id,
                        item = matchedItem,
                        productName = matchedItem.name,
                        currentQty = max(0.0, matchedItem.qtyValue ?: 0.0),
                        unit = matchedItem.qtyUnit.ifBlank { matchedItem.defaultUnit.ifBlank { entry.unit.ifBlank { "un" } } },
                        addedQty = qty,
                        rawTexts = if (entry.rawText.isNotBlank()) listOf(entry.rawText) else emptyList(),
                        selected = true
                    )
                }
            } else {
                unmatchedList.add(
                    UnmatchedReceiptItem(
                        tempId = "${System.currentTimeMillis()}-${(1000..9999).random()}",
                        rawText = entry.rawText,
                        name = cleanName,
                        brand = entry.brand.trim(),
                        qty = qty,
                        unit = entry.unit.ifBlank { "un" },
                        categoryId = entry.suggestedCategoryId.ifBlank { categories.firstOrNull()?.id.orEmpty() },
                        added = false
                    )
                )
            }
        }

        ReceiptAnalysisResult(
            storeName = parsed.storeName.orEmpty(),
            matched = matchedMap.values.toList(),
            unmatched = unmatchedList,
            ocrPreview = compressed.ocrText
        )
    }

    /**
     * Equivalente a `extractOutputText(data)` em `src/lib/receiptScanner.js`.
     */
    private fun extractOutputText(data: JsonObject): String {
        val direct = data["output_text"]?.jsonPrimitive?.content?.trim()
        if (!direct.isNullOrEmpty()) return direct

        val steps = data["steps"] as? JsonArray
        if (steps != null) {
            val texts = mutableListOf<String>()
            for (stepEl in steps) {
                val step = stepEl as? JsonObject ?: continue
                if (step["type"]?.jsonPrimitive?.content == "model_output") {
                    val contentArr = step["content"] as? JsonArray ?: continue
                    for (partEl in contentArr) {
                        val part = partEl as? JsonObject ?: continue
                        if (part["type"]?.jsonPrimitive?.content == "text") {
                            val txt = part["text"]?.jsonPrimitive?.content
                            if (!txt.isNullOrBlank()) texts.add(txt)
                        }
                    }
                }
            }
            if (texts.isNotEmpty()) return texts.joinToString("\n").trim()
        }

        val outputs = data["outputs"]?.jsonArray
        if (!outputs.isNullOrEmpty()) {
            val last = outputs.last() as? JsonObject
            val txt = last?.get("text")?.jsonPrimitive?.content?.trim()
            if (!txt.isNullOrEmpty()) return txt
        }
        return ""
    }
}
