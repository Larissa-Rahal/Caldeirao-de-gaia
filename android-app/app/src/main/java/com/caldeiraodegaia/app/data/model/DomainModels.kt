package com.caldeiraodegaia.app.data.model

import com.caldeiraodegaia.app.core.util.ItemStatus
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProfileDto(
    val id: String,
    val email: String? = null,
    @SerialName("full_name") val fullName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null
)

@Serializable
data class HouseDto(
    val id: String,
    val name: String,
    @SerialName("owner_id") val ownerId: String? = null,
    @SerialName("invite_code") val inviteCode: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val myRole: String = "member"
)

@Serializable
data class HouseMemberJoinRow(
    val role: String = "member",
    val houses: HouseDto? = null
)

@Serializable
data class HouseMemberDto(
    val id: String,
    @SerialName("house_id") val houseId: String,
    @SerialName("user_id") val userId: String,
    val role: String = "member",
    @SerialName("joined_at") val joinedAt: String? = null,
    val profiles: ProfileDto? = null
)

@Serializable
data class CategoryDto(
    val id: String,
    @SerialName("house_id") val houseId: String,
    val name: String,
    val emoji: String = "📦",
    @SerialName("sort_order") val sortOrder: Int = 0
)

@Serializable
data class CategoryInsertDto(
    @SerialName("house_id") val houseId: String,
    val name: String,
    val emoji: String,
    @SerialName("sort_order") val sortOrder: Int
)

@Serializable
data class ProductDto(
    val id: String,
    val name: String = "",
    val brand: String? = null,
    val barcode: String? = null,
    @SerialName("default_unit") val defaultUnit: String? = "un",
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_by") val createdBy: String? = null
)

@Serializable
data class ProductInsertDto(
    val name: String,
    val brand: String? = null,
    val barcode: String? = null,
    @SerialName("default_unit") val defaultUnit: String = "un",
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_by") val createdBy: String? = null
)

@Serializable
data class ItemRowDto(
    val id: String,
    @SerialName("house_id") val houseId: String,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("category_id") val categoryId: String? = null,
    val status: String = "in_stock",
    @SerialName("qty_value") val qtyValue: Double? = null,
    @SerialName("qty_unit") val qtyUnit: String? = null,
    val notes: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_by") val createdBy: String? = null,
    @SerialName("updated_by") val updatedBy: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    val product: ProductDto? = null,
    val category: CategoryDto? = null,
    val updater: ProfileDto? = null
) {
    /**
     * Equivalente a `normalizeItem(row)` em `src/hooks/useItems.js`.
     */
    fun toNormalizedItem(): InventoryItem {
        val prod = product ?: ProductDto(id = productId ?: "", name = "")
        val resolvedDefaultUnit = prod.defaultUnit?.takeIf { it.isNotBlank() } ?: "un"
        val resolvedStatus = if (qtyValue != null && qtyValue <= 0.0) {
            ItemStatus.OUT_OF_STOCK
        } else {
            ItemStatus.fromDb(status)
        }
        return InventoryItem(
            id = id,
            houseId = houseId,
            productId = productId ?: prod.id,
            categoryId = categoryId,
            status = resolvedStatus,
            qtyValue = qtyValue,
            qtyUnit = qtyUnit?.takeIf { it.isNotBlank() } ?: resolvedDefaultUnit,
            defaultUnit = resolvedDefaultUnit,
            name = prod.name,
            brand = prod.brand,
            barcode = prod.barcode,
            notes = notes,
            imageUrl = imageUrl ?: prod.imageUrl,
            createdBy = createdBy,
            updatedBy = updatedBy,
            updatedAt = updatedAt,
            product = prod.copy(defaultUnit = resolvedDefaultUnit),
            category = category,
            updater = updater
        )
    }
}

data class InventoryItem(
    val id: String,
    val houseId: String,
    val productId: String?,
    val categoryId: String?,
    val status: ItemStatus,
    val qtyValue: Double?,
    val qtyUnit: String,
    val defaultUnit: String,
    val name: String,
    val brand: String?,
    val barcode: String?,
    val notes: String?,
    val imageUrl: String?,
    val createdBy: String?,
    val updatedBy: String?,
    val updatedAt: String?,
    val product: ProductDto,
    val category: CategoryDto?,
    val updater: ProfileDto?
) {
    fun renormalize(): InventoryItem {
        val resolvedStatus = if (qtyValue != null && qtyValue <= 0.0) {
            ItemStatus.OUT_OF_STOCK
        } else {
            status
        }
        return copy(
            status = resolvedStatus,
            qtyUnit = qtyUnit.ifBlank { defaultUnit.ifBlank { "un" } }
        )
    }
}

@Serializable
data class ItemInsertDto(
    @SerialName("house_id") val houseId: String,
    @SerialName("product_id") val productId: String,
    @SerialName("category_id") val categoryId: String? = null,
    val notes: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("qty_value") val qtyValue: Double? = null,
    @SerialName("qty_unit") val qtyUnit: String = "un",
    val status: String = "in_stock",
    @SerialName("created_by") val createdBy: String,
    @SerialName("updated_by") val updatedBy: String
)

@Serializable
data class ItemUpdateDto(
    @SerialName("product_id") val productId: String? = null,
    @SerialName("category_id") val categoryId: String? = null,
    val notes: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("qty_value") val qtyValue: Double? = null,
    @SerialName("qty_unit") val qtyUnit: String? = null,
    val status: String? = null,
    @SerialName("updated_by") val updatedBy: String
)

@Serializable
data class ActivityLogEntryDto(
    val id: String,
    @SerialName("house_id") val houseId: String,
    @SerialName("user_id") val userId: String? = null,
    val action: String = "item_updated",
    @SerialName("item_name") val itemName: String? = null,
    @SerialName("old_value") val oldValue: String? = null,
    @SerialName("new_value") val newValue: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val user: ProfileDto? = null
)

data class ItemDraftInput(
    val productId: String? = null,
    val name: String,
    val brand: String? = null,
    val barcode: String? = null,
    val defaultUnit: String = "un",
    val categoryId: String? = null,
    val qtyValue: Double? = null,
    val qtyUnit: String = "un",
    val notes: String? = null,
    val imageUrl: String? = null
)
