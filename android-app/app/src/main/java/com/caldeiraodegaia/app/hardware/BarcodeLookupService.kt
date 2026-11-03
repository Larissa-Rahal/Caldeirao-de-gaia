package com.caldeiraodegaia.app.hardware

import com.caldeiraodegaia.app.data.remote.SupabaseModule
import com.caldeiraodegaia.app.data.repository.InventoryRepository
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

data class ScannedBarcodeProduct(
    val barcode: String,
    val name: String = "",
    val brand: String = "",
    val defaultUnit: String = "un",
    val imageUrl: String? = null,
    val found: Boolean = false
)

/**
 * Equivalente nativo em Kotlin de `lookupBarcode(code)` em `src/components/items/BarcodeScanner.jsx`.
 * 1) Consulta primeiro a tabela `products` no Supabase.
 * 2) Caso não exista, consulta a API Open Food Facts.
 */
class BarcodeLookupService(
    private val inventoryRepository: InventoryRepository
) {
    suspend fun lookupBarcode(rawCode: String): ScannedBarcodeProduct = withContext(Dispatchers.IO) {
        val code = rawCode.trim()
        if (code.isEmpty()) {
            return@withContext ScannedBarcodeProduct(barcode = "", found = false)
        }

        // 1. Consulta local no banco Supabase (`products`)
        val existing = inventoryRepository.findProductByBarcode(code)
        if (existing != null) {
            return@withContext ScannedBarcodeProduct(
                barcode = code,
                name = existing.name,
                brand = existing.brand.orEmpty(),
                defaultUnit = existing.defaultUnit ?: "un",
                imageUrl = existing.imageUrl,
                found = true
            )
        }

        // 2. Fallback para Open Food Facts API
        return@withContext try {
            val responseText = SupabaseModule.httpClient
                .get("https://world.openfoodfacts.org/api/v0/product/$code.json")
                .bodyAsText()

            val root = SupabaseModule.json.parseToJsonElement(responseText).jsonObject
            val status = root["status"]?.jsonPrimitive?.content?.toIntOrNull() ?: 0
            val productObj = root["product"]?.jsonObject

            if (status == 1 && productObj != null) {
                val namePt = productObj["product_name_pt"]?.jsonPrimitive?.content
                val nameDefault = productObj["product_name"]?.jsonPrimitive?.content
                val resolvedName = (!namePt.isNullOrBlank()).let { if (it) namePt!! else nameDefault.orEmpty() }
                val brands = productObj["brands"]?.jsonPrimitive?.content.orEmpty()
                val imageFront = productObj["image_front_small_url"]?.jsonPrimitive?.content

                ScannedBarcodeProduct(
                    barcode = code,
                    name = resolvedName,
                    brand = brands,
                    defaultUnit = "un",
                    imageUrl = imageFront?.takeIf { it.isNotBlank() },
                    found = resolvedName.isNotBlank()
                )
            } else {
                ScannedBarcodeProduct(barcode = code, found = false)
            }
        } catch (_: Exception) {
            ScannedBarcodeProduct(barcode = code, found = false)
        }
    }
}
