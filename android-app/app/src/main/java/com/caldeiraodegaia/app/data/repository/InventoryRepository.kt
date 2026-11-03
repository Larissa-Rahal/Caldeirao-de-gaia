package com.caldeiraodegaia.app.data.repository

import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.ActivityLogEntryDto
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.CategoryInsertDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ItemDraftInput
import com.caldeiraodegaia.app.data.model.ItemInsertDto
import com.caldeiraodegaia.app.data.model.ItemRowDto
import com.caldeiraodegaia.app.data.model.ItemUpdateDto
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.data.model.ProductInsertDto
import com.caldeiraodegaia.app.data.remote.SupabaseModule
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.max
import kotlin.math.roundToInt

data class InventoryState(
    val items: List<InventoryItem> = emptyList(),
    val categories: List<CategoryDto> = emptyList(),
    val catalogProducts: List<ProductDto> = emptyList(),
    val activityEntries: List<ActivityLogEntryDto> = emptyList(),
    val activityHasMore: Boolean = false,
    val activityLoading: Boolean = false,
    val loading: Boolean = true,
    val error: String? = null
)

/**
 * Consolida a lógica de negócio de `useItems.js`, `useCategories.js`, `useActivityLog.js` e `storage.js`
 * utilizando Kotlin Coroutines, StateFlow e Supabase Realtime.
 */
class InventoryRepository(
    private val authRepository: AuthRepository,
    private val houseRepository: HouseRepository
) {
    companion object {
        private const val ITEM_SELECT =
            "*, product:products(*), category:categories(*), updater:profiles!items_updated_by_fkey(id, full_name)"
        private const val ACTIVITY_PAGE_SIZE = 30L
        private const val PRODUCT_BUCKET = "product-images"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val supabase get() = SupabaseModule.client

    private val _state = MutableStateFlow(InventoryState())
    val state: StateFlow<InventoryState> = _state.asStateFlow()

    private val pendingIds: MutableSet<String> = ConcurrentHashMap.newKeySet()
    private var realtimeJob: Job? = null
    private var activeChannel: RealtimeChannel? = null
    private var activityPage: Int = 0

    init {
        scope.launch {
            houseRepository.houseState
                .distinctUntilChangedBy { it.activeHouse?.id }
                .collect { houseState ->
                    val activeHouse = houseState.activeHouse
                    if (activeHouse == null) {
                        teardownRealtime()
                        _state.value = InventoryState(loading = false)
                    } else {
                        refreshAll(activeHouse.id)
                        subscribeToRealtime(activeHouse.id)
                    }
                }
        }
    }

    suspend fun refreshAll(houseId: String? = houseRepository.houseState.value.activeHouse?.id) {
        if (houseId == null || !SupabaseModule.isConfigured) {
            _state.value = _state.value.copy(loading = false)
            return
        }
        _state.value = _state.value.copy(loading = true, error = null)
        fetchCategories(houseId)
        fetchItems(houseId)
        fetchActivityLog(houseId, page = 0)
    }

    suspend fun fetchItems(houseId: String? = houseRepository.houseState.value.activeHouse?.id) {
        if (houseId == null || !SupabaseModule.isConfigured) {
            _state.value = _state.value.copy(items = emptyList(), loading = false)
            return
        }
        try {
            val rows = supabase.postgrest.from("items")
                .select(Columns.raw(ITEM_SELECT)) {
                    filter { eq("house_id", houseId) }
                    order("created_at", Order.ASCENDING)
                }
                .decodeList<ItemRowDto>()

            val normalized = rows
                .map { it.toNormalizedItem() }
                .sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.name })

            _state.value = _state.value.copy(
                items = normalized,
                loading = false,
                error = null
            )
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                loading = false,
                error = e.message
            )
        }
    }

    suspend fun fetchCategories(houseId: String? = houseRepository.houseState.value.activeHouse?.id) {
        if (houseId == null || !SupabaseModule.isConfigured) {
            _state.value = _state.value.copy(categories = emptyList())
            return
        }
        try {
            val cats = supabase.postgrest.from("categories")
                .select {
                    filter { eq("house_id", houseId) }
                    order("sort_order", Order.ASCENDING)
                }
                .decodeList<CategoryDto>()

            _state.value = _state.value.copy(categories = cats)
        } catch (_: Exception) {
            // Mantém lista atual
        }
    }

    suspend fun fetchCatalogProducts(): List<ProductDto> {
        if (!SupabaseModule.isConfigured) return emptyList()
        return try {
            val list = supabase.postgrest.from("products")
                .select {
                    order("name", Order.ASCENDING)
                }
                .decodeList<ProductDto>()
            _state.value = _state.value.copy(catalogProducts = list)
            list
        } catch (_: Exception) {
            _state.value.catalogProducts
        }
    }

    suspend fun findProductByBarcode(barcode: String): ProductDto? {
        val clean = barcode.trim()
        if (clean.isEmpty() || !SupabaseModule.isConfigured) return null
        return try {
            supabase.postgrest.from("products")
                .select {
                    filter { eq("barcode", clean) }
                    limit(1)
                }
                .decodeSingleOrNull<ProductDto>()
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Equivalente a `upsertProduct` em `src/hooks/useItems.js`.
     */
    suspend fun upsertProduct(
        productId: String? = null,
        name: String,
        brand: String? = null,
        barcode: String? = null,
        defaultUnit: String = "un",
        imageUrl: String? = null,
        userId: String
    ): String {
        if (!productId.isNullOrBlank()) return productId

        val cleanName = name.trim()
        val cleanBrand = brand?.trim()?.takeIf { it.isNotEmpty() }
        val cleanBarcode = barcode?.trim()?.takeIf { it.isNotEmpty() }
        val cleanUnit = defaultUnit.trim().ifEmpty { "un" }
        val cleanImage = imageUrl?.trim()?.takeIf { it.isNotEmpty() }

        if (cleanBarcode != null) {
            val existing = findProductByBarcode(cleanBarcode)
            if (existing != null) {
                if (existing.createdBy == userId) {
                    runCatching {
                        supabase.postgrest.from("products")
                            .update(
                                buildJsonObject {
                                    put("name", cleanName.ifEmpty { existing.name })
                                    put("brand", cleanBrand ?: existing.brand)
                                    put("default_unit", cleanUnit.ifEmpty { existing.defaultUnit ?: "un" })
                                    put("image_url", cleanImage ?: existing.imageUrl)
                                }
                            ) {
                                filter { eq("id", existing.id) }
                            }
                    }
                }
                return existing.id
            }

            val created = supabase.postgrest.from("products")
                .insert(
                    ProductInsertDto(
                        name = cleanName,
                        brand = cleanBrand,
                        barcode = cleanBarcode,
                        defaultUnit = cleanUnit,
                        imageUrl = cleanImage,
                        createdBy = userId
                    )
                ) {
                    select()
                }
                .decodeSingle<ProductDto>()
            return created.id
        }

        // Sem código de barras: verifica se já existe produto com mesmo nome e marca
        val existingByName = runCatching {
            supabase.postgrest.from("products")
                .select {
                    filter {
                        ilike("name", cleanName)
                        if (cleanBrand != null) {
                            ilike("brand", cleanBrand)
                        } else {
                            exact("brand", null)
                        }
                    }
                    limit(1)
                }
                .decodeSingleOrNull<ProductDto>()
        }.getOrNull()

        if (existingByName != null) {
            return existingByName.id
        }

        val inserted = supabase.postgrest.from("products")
            .insert(
                ProductInsertDto(
                    name = cleanName,
                    brand = cleanBrand,
                    barcode = null,
                    defaultUnit = cleanUnit,
                    imageUrl = cleanImage,
                    createdBy = userId
                )
            ) {
                select()
            }
            .decodeSingle<ProductDto>()

        return inserted.id
    }

    suspend fun addItem(draft: ItemDraftInput): InventoryItem {
        val userId = authRepository.authState.value.user?.id
            ?: throw IllegalStateException("Utilizador não autenticado.")
        val houseId = houseRepository.houseState.value.activeHouse?.id
            ?: throw IllegalStateException("Nenhum caldeirão ativo.")

        val resolvedDefaultUnit = draft.defaultUnit.ifBlank { draft.qtyUnit.ifBlank { "un" } }
        val productId = upsertProduct(
            productId = draft.productId,
            name = draft.name,
            brand = draft.brand,
            barcode = draft.barcode,
            defaultUnit = resolvedDefaultUnit,
            imageUrl = draft.imageUrl,
            userId = userId
        )

        val numericQty = draft.qtyValue
        val initialStatus = if (numericQty != null && numericQty <= 0.0) {
            ItemStatus.OUT_OF_STOCK.dbValue
        } else {
            ItemStatus.IN_STOCK.dbValue
        }

        val inserted = supabase.postgrest.from("items")
            .insert(
                ItemInsertDto(
                    houseId = houseId,
                    productId = productId,
                    categoryId = draft.categoryId?.takeIf { it.isNotBlank() },
                    notes = draft.notes?.trim()?.takeIf { it.isNotEmpty() },
                    imageUrl = draft.imageUrl?.trim()?.takeIf { it.isNotEmpty() },
                    qtyValue = numericQty,
                    qtyUnit = draft.qtyUnit.ifBlank { resolvedDefaultUnit },
                    status = initialStatus,
                    createdBy = userId,
                    updatedBy = userId
                )
            ) {
                select(Columns.raw(ITEM_SELECT))
            }
            .decodeSingle<ItemRowDto>()
            .toNormalizedItem()

        markPendingTemporarily(inserted.id)
        _state.value = _state.value.copy(
            items = (_state.value.items.filterNot { it.id == inserted.id } + inserted)
                .sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.name })
        )
        return inserted
    }

    suspend fun updateItem(itemId: String, draft: ItemDraftInput): InventoryItem {
        val userId = authRepository.authState.value.user?.id
            ?: throw IllegalStateException("Utilizador não autenticado.")
        val current = _state.value.items.firstOrNull { it.id == itemId }
            ?: throw IllegalArgumentException("Item não encontrado.")

        var productId = current.productId ?: current.product.id
        val nameChanged = draft.name.trim() != current.name
        val brandChanged = (draft.brand?.trim().orEmpty()) != (current.brand.orEmpty())
        val barcodeChanged = (draft.barcode?.trim().orEmpty()) != (current.barcode.orEmpty())
        val unitChanged = draft.defaultUnit.ifBlank { "un" } != current.defaultUnit

        if (nameChanged || brandChanged || barcodeChanged || unitChanged) {
            productId = upsertProduct(
                productId = null,
                name = draft.name,
                brand = draft.brand,
                barcode = draft.barcode,
                defaultUnit = draft.defaultUnit.ifBlank { draft.qtyUnit.ifBlank { current.defaultUnit } },
                imageUrl = draft.imageUrl ?: current.imageUrl,
                userId = userId
            )
        }

        val resolvedQtyUnit = draft.qtyUnit.ifBlank {
            draft.defaultUnit.ifBlank { current.defaultUnit.ifBlank { "un" } }
        }
        val nextQtyValue = draft.qtyValue
        val nextStatus = when {
            nextQtyValue != null && nextQtyValue <= 0.0 -> ItemStatus.OUT_OF_STOCK
            nextQtyValue != null && current.status == ItemStatus.OUT_OF_STOCK -> ItemStatus.IN_STOCK
            else -> current.status
        }

        val updated = supabase.postgrest.from("items")
            .update(
                ItemUpdateDto(
                    productId = productId,
                    categoryId = draft.categoryId?.takeIf { it.isNotBlank() },
                    notes = draft.notes?.trim()?.takeIf { it.isNotEmpty() },
                    imageUrl = draft.imageUrl?.trim()?.takeIf { it.isNotEmpty() },
                    qtyValue = nextQtyValue,
                    qtyUnit = resolvedQtyUnit,
                    status = nextStatus.dbValue,
                    updatedBy = userId
                )
            ) {
                filter { eq("id", itemId) }
                select(Columns.raw(ITEM_SELECT))
            }
            .decodeSingle<ItemRowDto>()
            .toNormalizedItem()

        markPendingTemporarily(itemId)
        _state.value = _state.value.copy(
            items = _state.value.items
                .map { if (it.id == itemId) updated else it }
                .sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.name })
        )
        return updated
    }

    suspend fun cycleStatus(itemId: String, currentStatus: ItemStatus) {
        val next = currentStatus.next()
        setStatus(itemId, next)
    }

    suspend fun setStatus(itemId: String, targetStatus: ItemStatus) {
        val userId = authRepository.authState.value.user?.id ?: return
        val item = _state.value.items.firstOrNull { it.id == itemId } ?: return

        val patchedQty: Double? = when {
            targetStatus == ItemStatus.OUT_OF_STOCK -> if (item.qtyValue != null) 0.0 else null
            item.qtyValue != null && item.qtyValue <= 0.0 -> 1.0
            else -> item.qtyValue
        }

        optimisticUpdate(
            itemId = itemId,
            transform = {
                it.copy(
                    status = targetStatus,
                    qtyValue = patchedQty,
                    updatedBy = userId,
                    updatedAt = Instant.now().toString()
                ).renormalize()
            }
        ) {
            supabase.postgrest.from("items")
                .update(
                    buildJsonObject {
                        put("status", targetStatus.dbValue)
                        put("updated_by", userId)
                        if (patchedQty != null) {
                            put("qty_value", patchedQty)
                        }
                    }
                ) {
                    filter { eq("id", itemId) }
                }
        }
    }

    suspend fun adjustQty(itemId: String, delta: Double) {
        val userId = authRepository.authState.value.user?.id ?: return
        val item = _state.value.items.firstOrNull { it.id == itemId } ?: return
        val newVal = max(0.0, ((item.qtyValue ?: 0.0) + delta))
        val rounded = (newVal * 1000.0).roundToInt() / 1000.0
        val newStatus = when {
            rounded <= 0.0 -> ItemStatus.OUT_OF_STOCK
            rounded == 1.0 -> ItemStatus.RUNNING_LOW
            else -> ItemStatus.IN_STOCK
        }

        optimisticUpdate(
            itemId = itemId,
            transform = {
                it.copy(
                    qtyValue = rounded,
                    status = newStatus,
                    updatedBy = userId,
                    updatedAt = Instant.now().toString()
                ).renormalize()
            }
        ) {
            supabase.postgrest.from("items")
                .update(
                    buildJsonObject {
                        put("qty_value", rounded)
                        put("status", newStatus.dbValue)
                        put("updated_by", userId)
                    }
                ) {
                    filter { eq("id", itemId) }
                }
        }
    }

    suspend fun updateQtyValue(itemId: String, value: Double) {
        val userId = authRepository.authState.value.user?.id ?: return
        val newVal = max(0.0, value)
        val rounded = (newVal * 1000.0).roundToInt() / 1000.0
        val newStatus = when {
            rounded <= 0.0 -> ItemStatus.OUT_OF_STOCK
            rounded == 1.0 -> ItemStatus.RUNNING_LOW
            else -> ItemStatus.IN_STOCK
        }

        optimisticUpdate(
            itemId = itemId,
            transform = {
                it.copy(
                    qtyValue = rounded,
                    status = newStatus,
                    updatedBy = userId,
                    updatedAt = Instant.now().toString()
                ).renormalize()
            }
        ) {
            supabase.postgrest.from("items")
                .update(
                    buildJsonObject {
                        put("qty_value", rounded)
                        put("status", newStatus.dbValue)
                        put("updated_by", userId)
                    }
                ) {
                    filter { eq("id", itemId) }
                }
        }
    }

    /**
     * Equivalente a `restockItem(itemId, addedQty, unit)` em `src/hooks/useItems.js`.
     */
    suspend fun restockItem(itemId: String, addedQty: Double, unit: String?) {
        val userId = authRepository.authState.value.user?.id ?: return
        val item = _state.value.items.firstOrNull { it.id == itemId } ?: return
        val currentVal = item.qtyValue ?: 0.0
        val delta = max(0.0, if (addedQty > 0) addedQty else 1.0)
        val newVal = ((currentVal + delta) * 1000.0).roundToInt() / 1000.0
        val resolvedUnit = item.qtyUnit.ifBlank { unit?.ifBlank { null } ?: item.defaultUnit.ifBlank { "un" } }

        optimisticUpdate(
            itemId = itemId,
            transform = {
                it.copy(
                    qtyValue = newVal,
                    qtyUnit = resolvedUnit,
                    status = ItemStatus.IN_STOCK,
                    updatedBy = userId,
                    updatedAt = Instant.now().toString()
                ).renormalize()
            }
        ) {
            supabase.postgrest.from("items")
                .update(
                    buildJsonObject {
                        put("qty_value", newVal)
                        put("qty_unit", resolvedUnit)
                        put("status", ItemStatus.IN_STOCK.dbValue)
                        put("updated_by", userId)
                    }
                ) {
                    filter { eq("id", itemId) }
                }
        }
    }

    suspend fun deleteItem(itemId: String) {
        val previous = _state.value.items
        _state.value = _state.value.copy(items = previous.filterNot { it.id == itemId })
        markPendingTemporarily(itemId)
        try {
            supabase.postgrest.from("items")
                .delete {
                    filter { eq("id", itemId) }
                }
        } catch (e: Exception) {
            fetchItems()
            throw e
        }
    }

    // ── Categorias (equivalente a `useCategories.js`) ──

    suspend fun addCategory(name: String, emoji: String): CategoryDto {
        val houseId = houseRepository.houseState.value.activeHouse?.id
            ?: throw IllegalStateException("Nenhum caldeirão ativo.")
        val maxOrder = _state.value.categories.maxOfOrNull { it.sortOrder } ?: -1

        val created = supabase.postgrest.from("categories")
            .insert(
                CategoryInsertDto(
                    houseId = houseId,
                    name = name.trim(),
                    emoji = emoji.trim().ifEmpty { "📦" },
                    sortOrder = maxOrder + 1
                )
            ) {
                select()
            }
            .decodeSingle<CategoryDto>()

        _state.value = _state.value.copy(
            categories = (_state.value.categories + created).sortedBy { it.sortOrder }
        )
        return created
    }

    suspend fun deleteCategory(categoryId: String) {
        supabase.postgrest.from("categories")
            .delete {
                filter { eq("id", categoryId) }
            }
        _state.value = _state.value.copy(
            categories = _state.value.categories.filterNot { it.id == categoryId }
        )
    }

    // ── Activity Log (equivalente a `useActivityLog.js`) ──

    suspend fun fetchActivityLog(
        houseId: String? = houseRepository.houseState.value.activeHouse?.id,
        page: Int = 0
    ) {
        if (houseId == null || !SupabaseModule.isConfigured) return
        if (page == 0) {
            _state.value = _state.value.copy(activityLoading = true)
        }
        val from = page * ACTIVITY_PAGE_SIZE
        val to = from + ACTIVITY_PAGE_SIZE - 1

        try {
            val rows = supabase.postgrest.from("activity_log")
                .select(Columns.raw("*, user:profiles(id, full_name, email)")) {
                    filter { eq("house_id", houseId) }
                    order("created_at", Order.DESCENDING)
                    range(from, to)
                }
                .decodeList<ActivityLogEntryDto>()

            activityPage = page
            val merged = if (page == 0) rows else (_state.value.activityEntries + rows).distinctBy { it.id }
            _state.value = _state.value.copy(
                activityEntries = merged,
                activityHasMore = rows.size.toLong() == ACTIVITY_PAGE_SIZE,
                activityLoading = false
            )
        } catch (_: Exception) {
            _state.value = _state.value.copy(activityLoading = false)
        }
    }

    suspend fun loadMoreActivityLog() {
        val houseId = houseRepository.houseState.value.activeHouse?.id ?: return
        fetchActivityLog(houseId, page = activityPage + 1)
    }

    // ── Upload de imagem de produto (equivalente a `src/lib/storage.js`) ──

    suspend fun uploadProductImage(imageBytes: ByteArray, extension: String = "jpg"): String {
        val userId = authRepository.authState.value.user?.id
            ?: throw IllegalStateException("Utilizador não autenticado.")
        if (imageBytes.size > 5 * 1024 * 1024) {
            throw IllegalArgumentException("Imagem demasiado grande. Máximo 5MB.")
        }
        val cleanExt = extension.lowercase().ifBlank { "jpg" }
        val randomSuffix = (100000..999999).random()
        val path = "$userId/${System.currentTimeMillis()}-$randomSuffix.$cleanExt"

        val bucket = supabase.storage.from(PRODUCT_BUCKET)
        bucket.upload(path, imageBytes) {
            upsert = false
        }
        return bucket.publicUrl(path)
    }

    // ── Helpers internos de Optimistic Update e Realtime ──

    private suspend fun optimisticUpdate(
        itemId: String,
        transform: (InventoryItem) -> InventoryItem,
        serverCall: suspend () -> Unit
    ) {
        _state.value = _state.value.copy(
            items = _state.value.items.map { if (it.id == itemId) transform(it) else it }
        )
        markPendingTemporarily(itemId)
        try {
            serverCall()
        } catch (e: Exception) {
            fetchItems()
            throw e
        }
    }

    private fun markPendingTemporarily(itemId: String) {
        pendingIds.add(itemId)
        scope.launch {
            delay(2000)
            pendingIds.remove(itemId)
        }
    }

    private fun subscribeToRealtime(houseId: String) {
        if (!SupabaseModule.isConfigured) return
        teardownRealtime()

        realtimeJob = scope.launch {
            runCatching {
                val channel = supabase.realtime.channel("house-sync-$houseId-${System.currentTimeMillis()}")
                activeChannel = channel

                val itemsFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                    table = "items"
                }
                val categoriesFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                    table = "categories"
                }
                val activityFlow = channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
                    table = "activity_log"
                }

                launch {
                    itemsFlow.collect { action ->
                        handleRealtimeItemAction(houseId, action)
                    }
                }
                launch {
                    categoriesFlow.collect {
                        fetchCategories(houseId)
                    }
                }
                launch {
                    activityFlow.collect {
                        fetchActivityLog(houseId, page = 0)
                    }
                }

                channel.subscribe()
            }
        }
    }

    private suspend fun handleRealtimeItemAction(houseId: String, action: PostgresAction) {
        when (action) {
            is PostgresAction.Delete -> {
                val deletedId = action.oldRecord["id"]?.jsonPrimitive?.content ?: return
                if (pendingIds.contains(deletedId)) return
                _state.value = _state.value.copy(
                    items = _state.value.items.filterNot { it.id == deletedId }
                )
            }
            is PostgresAction.Insert -> {
                val rowHouseId = action.record["house_id"]?.jsonPrimitive?.content
                if (rowHouseId != null && rowHouseId != houseId) return
                val id = action.record["id"]?.jsonPrimitive?.content ?: return
                if (pendingIds.contains(id)) return
                fetchSingleItemAndMerge(id)
            }
            is PostgresAction.Update -> {
                val rowHouseId = action.record["house_id"]?.jsonPrimitive?.content
                if (rowHouseId != null && rowHouseId != houseId) return
                val id = action.record["id"]?.jsonPrimitive?.content ?: return
                if (pendingIds.contains(id)) return
                fetchSingleItemAndMerge(id)
            }
            else -> Unit
        }
    }

    private suspend fun fetchSingleItemAndMerge(itemId: String) {
        runCatching {
            val row = supabase.postgrest.from("items")
                .select(Columns.raw(ITEM_SELECT)) {
                    filter { eq("id", itemId) }
                }
                .decodeSingleOrNull<ItemRowDto>()
                ?.toNormalizedItem() ?: return

            val updatedList = (_state.value.items.filterNot { it.id == row.id } + row)
                .sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.name })
            _state.value = _state.value.copy(items = updatedList)
        }
    }

    private fun teardownRealtime() {
        realtimeJob?.cancel()
        realtimeJob = null
        val ch = activeChannel
        activeChannel = null
        if (ch != null) {
            scope.launch {
                runCatching { supabase.realtime.removeChannel(ch) }
            }
        }
    }
}
