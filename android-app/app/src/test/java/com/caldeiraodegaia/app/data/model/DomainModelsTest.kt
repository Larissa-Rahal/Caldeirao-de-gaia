package com.caldeiraodegaia.app.data.model

import com.caldeiraodegaia.app.core.util.ItemStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Suíte de Testes de QA — `DomainModels` (`ItemRowDto.toNormalizedItem` e `InventoryItem.renormalize`)
 * Valida regras críticas de negócio:
 * 1) Conversão automática de status para `OUT_OF_STOCK` quando `qtyValue <= 0.0`
 * 2) Preservação de status quando `qtyValue == null` ou `qtyValue > 0.0`
 * 3) Hierarquia de fallback de unidades (`qtyUnit` -> `product.defaultUnit` -> `"un"`)
 * 4) Hierarquia de fallback de imagem (`item.imageUrl` -> `product.imageUrl`)
 */
class DomainModelsTest {

    private val sampleProduct = ProductDto(
        id = "prod-1",
        name = "Leite Integral",
        brand = "Piracanjuba",
        barcode = "789123456",
        defaultUnit = "L",
        imageUrl = "https://cdn.exemplo.com/leite-catalogo.jpg"
    )

    @Test
    fun `toNormalizedItem forca OUT_OF_STOCK quando qtyValue e zero mesmo se status no banco for in_stock`() {
        val raw = ItemRowDto(
            id = "item-1",
            houseId = "house-1",
            productId = "prod-1",
            status = "in_stock",
            qtyValue = 0.0,
            qtyUnit = "L",
            product = sampleProduct
        )

        val normalized = raw.toNormalizedItem()
        assertEquals(ItemStatus.OUT_OF_STOCK, normalized.status)
        assertEquals(0.0, normalized.qtyValue!!, 0.001)
    }

    @Test
    fun `toNormalizedItem preserva status quando qtyValue e nulo ou positivo`() {
        val rawNullQty = ItemRowDto(
            id = "item-2",
            houseId = "house-1",
            status = "running_low",
            qtyValue = null,
            product = sampleProduct
        )
        assertEquals(ItemStatus.RUNNING_LOW, rawNullQty.toNormalizedItem().status)
        assertNull(rawNullQty.toNormalizedItem().qtyValue)

        val rawPositiveQty = ItemRowDto(
            id = "item-3",
            houseId = "house-1",
            status = "in_stock",
            qtyValue = 3.0,
            product = sampleProduct
        )
        assertEquals(ItemStatus.IN_STOCK, rawPositiveQty.toNormalizedItem().status)
    }

    @Test
    fun `toNormalizedItem aplica fallback correto para qtyUnit, defaultUnit e imageUrl`() {
        val raw = ItemRowDto(
            id = "item-4",
            houseId = "house-1",
            productId = "prod-1",
            qtyValue = 2.0,
            qtyUnit = null,
            imageUrl = null,
            product = sampleProduct
        )

        val normalized = raw.toNormalizedItem()
        assertEquals("L", normalized.qtyUnit)
        assertEquals("L", normalized.defaultUnit)
        assertEquals("https://cdn.exemplo.com/leite-catalogo.jpg", normalized.imageUrl)

        // Quando o item tem imagem própria, ela tem prioridade sobre a imagem do catálogo
        val rawCustomImg = raw.copy(imageUrl = "https://cdn.exemplo.com/minha-foto.jpg")
        assertEquals("https://cdn.exemplo.com/minha-foto.jpg", rawCustomImg.toNormalizedItem().imageUrl)
    }

    @Test
    fun `renormalize atualiza status para OUT_OF_STOCK ao zerar quantidade em memoria`() {
        val initial = ItemRowDto(
            id = "item-5",
            houseId = "house-1",
            status = "in_stock",
            qtyValue = 2.0,
            qtyUnit = "",
            product = sampleProduct.copy(defaultUnit = "pct")
        ).toNormalizedItem()

        val zeroed = initial.copy(qtyValue = 0.0, qtyUnit = "").renormalize()
        assertEquals(ItemStatus.OUT_OF_STOCK, zeroed.status)
        assertEquals("pct", zeroed.qtyUnit)
    }
}
