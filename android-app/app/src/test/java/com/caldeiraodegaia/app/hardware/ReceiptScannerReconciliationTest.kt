package com.caldeiraodegaia.app.hardware

import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.data.remote.SupabaseModule
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Suíte de Testes de QA — `ReceiptScannerManager` (Reconciliação de Nota Fiscal + Extração Gemini)
 * Testa:
 * 1) Extração de texto nos 3 formatos de payload da Interactions API (`output_text`, `steps`, `outputs`)
 * 2) Limpeza de blocos markdown ```json ... ```
 * 3) Vínculo por `matched_item_id` exato e por nome normalizado sem acentos (`normalizeForMatch`)
 * 4) Soma de quantidades e deduplicação de `rawTexts` quando o mesmo item aparece em múltiplas linhas da nota
 * 5) Separação de itens novos (`unmatched`) com fallback para a primeira categoria da casa
 * 6) Tratamento de erro amigável para JSON malformado
 */
class ReceiptScannerReconciliationTest {

    private val categories = listOf(
        CategoryDto(id = "cat-mercearia", houseId = "h1", name = "Mercearia", emoji = "🛒", sortOrder = 0),
        CategoryDto(id = "cat-limpeza", houseId = "h1", name = "Limpeza", emoji = "🧹", sortOrder = 1)
    )

    private val existingItems = listOf(
        InventoryItem(
            id = "item-arroz",
            houseId = "h1",
            productId = "prod-arroz",
            categoryId = "cat-mercearia",
            status = ItemStatus.RUNNING_LOW,
            qtyValue = 1.0,
            qtyUnit = "pct",
            defaultUnit = "pct",
            name = "Arroz",
            brand = "Camil",
            barcode = null,
            notes = null,
            imageUrl = null,
            createdBy = "u1",
            updatedBy = "u1",
            updatedAt = null,
            product = ProductDto(id = "prod-arroz", name = "Arroz", brand = "Camil", defaultUnit = "pct"),
            category = categories[0],
            updater = null
        ),
        InventoryItem(
            id = "item-acucar",
            houseId = "h1",
            productId = "prod-acucar",
            categoryId = "cat-mercearia",
            status = ItemStatus.OUT_OF_STOCK,
            qtyValue = 0.0,
            qtyUnit = "kg",
            defaultUnit = "kg",
            name = "Açúcar",
            brand = "União",
            barcode = null,
            notes = null,
            imageUrl = null,
            createdBy = "u1",
            updatedBy = "u1",
            updatedAt = null,
            product = ProductDto(id = "prod-acucar", name = "Açúcar", brand = "União", defaultUnit = "kg"),
            category = categories[0],
            updater = null
        )
    )

    @Test
    fun `extractOutputText suporta formato direto output_text, formato steps e formato outputs`() {
        val directObj = SupabaseModule.json.parseToJsonElement(
            """{"output_text": "  {\"store_name\": \"Mercado A\", \"items\": []}  "}"""
        ).jsonObject
        assertEquals("""{"store_name": "Mercado A", "items": []}""", ReceiptScannerManager.extractOutputText(directObj))

        val stepsObj = SupabaseModule.json.parseToJsonElement(
            """
            {
              "steps": [
                {
                  "type": "model_output",
                  "content": [
                    {"type": "thought", "text": "pensando..."},
                    {"type": "text", "text": "{\"store_name\": \"Mercado B\", \"items\": []}"}
                  ]
                }
              ]
            }
            """.trimIndent()
        ).jsonObject
        assertEquals("""{"store_name": "Mercado B", "items": []}""", ReceiptScannerManager.extractOutputText(stepsObj))

        val outputsObj = SupabaseModule.json.parseToJsonElement(
            """
            {
              "outputs": [
                {"text": "{\"store_name\": \"Mercado C\", \"items\": []}"}
              ]
            }
            """.trimIndent()
        ).jsonObject
        assertEquals("""{"store_name": "Mercado C", "items": []}""", ReceiptScannerManager.extractOutputText(outputsObj))
    }

    @Test
    fun `reconcileReceiptOutput vincula por ID e por nome sem acento, soma linhas duplicadas e separa novos itens`() {
        val geminiJsonWithFence = """
            ```json
            {
              "store_name": "Supermercado Gaia",
              "items": [
                {
                  "raw_text": "ARR T1 CAMIL 5KG",
                  "clean_name": "Arroz",
                  "brand": "Camil",
                  "quantity": 2,
                  "unit": "pct",
                  "matched_item_id": "item-arroz",
                  "suggested_category_id": "cat-mercearia"
                },
                {
                  "raw_text": "ARR INTEGRAL CAMIL",
                  "clean_name": "Arroz",
                  "brand": "Camil",
                  "quantity": 1,
                  "unit": "pct",
                  "matched_item_id": "item-arroz",
                  "suggested_category_id": "cat-mercearia"
                },
                {
                  "raw_text": "ACUCAR REFINADO UNIAO 1KG",
                  "clean_name": "Acucar",
                  "brand": "União",
                  "quantity": 3,
                  "unit": "kg",
                  "matched_item_id": "",
                  "suggested_category_id": "cat-mercearia"
                },
                {
                  "raw_text": "DET LIQ YPE NEUTRO 500ML",
                  "clean_name": "Detergente Líquido",
                  "brand": "Ypê",
                  "quantity": 4,
                  "unit": "un",
                  "matched_item_id": "",
                  "suggested_category_id": ""
                }
              ]
            }
            ```
        """.trimIndent()

        val result = ReceiptScannerManager.reconcileReceiptOutput(
            rawOutputText = geminiJsonWithFence,
            existingItems = existingItems,
            categories = categories,
            ocrPreview = "CUPOM FISCAL"
        )

        assertEquals("Supermercado Gaia", result.storeName)
        assertEquals("CUPOM FISCAL", result.ocrPreview)

        // 2 itens encontrados no Caldeirão: Arroz (somado 2 + 1 = 3) e Açúcar (vinculado por nome normalizado "Acucar" -> "Açúcar")
        assertEquals(2, result.matched.size)

        val matchedArroz = result.matched.first { it.itemId == "item-arroz" }
        assertEquals(1.0, matchedArroz.currentQty, 0.001)
        assertEquals(3.0, matchedArroz.addedQty, 0.001)
        assertEquals("pct", matchedArroz.unit)
        assertEquals(listOf("ARR T1 CAMIL 5KG", "ARR INTEGRAL CAMIL"), matchedArroz.rawTexts)
        assertTrue(matchedArroz.selected)

        val matchedAcucar = result.matched.first { it.itemId == "item-acucar" }
        assertEquals(0.0, matchedAcucar.currentQty, 0.001)
        assertEquals(3.0, matchedAcucar.addedQty, 0.001)
        assertEquals("kg", matchedAcucar.unit)

        // 1 item novo não cadastrado: Detergente Líquido (com fallback para a primeira categoria "cat-mercearia")
        assertEquals(1, result.unmatched.size)
        val unmatchedDet = result.unmatched.first()
        assertEquals("Detergente Líquido", unmatchedDet.name)
        assertEquals("Ypê", unmatchedDet.brand)
        assertEquals(4.0, unmatchedDet.qty, 0.001)
        assertEquals("cat-mercearia", unmatchedDet.categoryId)
    }

    @Test(expected = IllegalStateException::class)
    fun `reconcileReceiptOutput lanca IllegalStateException amigavel quando JSON e invalido`() {
        ReceiptScannerManager.reconcileReceiptOutput(
            rawOutputText = "{json_corrompido:",
            existingItems = existingItems,
            categories = categories
        )
    }
}
