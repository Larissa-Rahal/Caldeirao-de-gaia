package com.caldeiraodegaia.app.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ViewList
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.ActivityLogEntryDto
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.HouseDto
import com.caldeiraodegaia.app.data.model.HouseMemberDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ItemDraftInput
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.data.model.ProfileDto
import com.caldeiraodegaia.app.hardware.ReceiptAnalysisResult
import com.caldeiraodegaia.app.hardware.ScannedBarcodeProduct
import com.caldeiraodegaia.app.ui.components.items.ItemCardComposable
import com.caldeiraodegaia.app.ui.components.layout.HeaderComposable
import com.caldeiraodegaia.app.ui.components.ornaments.AddOrbButton
import com.caldeiraodegaia.app.ui.components.ornaments.CauldronEmblem
import com.caldeiraodegaia.app.ui.components.ornaments.CornerVine
import com.caldeiraodegaia.app.ui.components.ornaments.StatusGem
import com.caldeiraodegaia.app.ui.modals.ActivityLogModal
import com.caldeiraodegaia.app.ui.modals.CreateHouseModal
import com.caldeiraodegaia.app.ui.modals.ItemFormModal
import com.caldeiraodegaia.app.ui.modals.JoinHouseModal
import com.caldeiraodegaia.app.ui.modals.MarketModal
import com.caldeiraodegaia.app.ui.modals.ProfileModal
import com.caldeiraodegaia.app.ui.modals.ReceiptScannerModal
import com.caldeiraodegaia.app.ui.modals.SettingsModal
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette

/**
 * Equivalente nativo em Jetpack Compose de `src/pages/HomePage.jsx`.
 */
@Composable
fun HomeScreen(
    houses: List<HouseDto>,
    activeHouse: HouseDto?,
    members: List<HouseMemberDto>,
    currentUserId: String?,
    currentUserEmail: String?,
    profile: ProfileDto?,
    items: List<InventoryItem>,
    categories: List<CategoryDto>,
    catalogProducts: List<ProductDto>,
    activityEntries: List<ActivityLogEntryDto>,
    activityHasMore: Boolean,
    activityLoading: Boolean,
    inventoryLoading: Boolean,
    isDark: Boolean,
    viewMode: String,
    hasEnvGeminiKey: Boolean,
    savedGeminiKey: String,
    onToggleTheme: () -> Unit,
    onToggleViewMode: () -> Unit,
    onSelectHouse: (HouseDto) -> Unit,
    onCreateHouse: (String, () -> Unit, (String) -> Unit) -> Unit,
    onJoinHouse: (String, () -> Unit, (String) -> Unit) -> Unit,
    onRenameHouse: (String, () -> Unit) -> Unit,
    onRegenerateInviteCode: () -> Unit,
    onRemoveMember: (String) -> Unit,
    onAddCategory: (String, String) -> Unit,
    onDeleteCategory: (String) -> Unit,
    onCycleStatus: (String, ItemStatus) -> Unit,
    onSetStatus: (String, ItemStatus) -> Unit,
    onRestockAllMarket: (List<InventoryItem>) -> Unit,
    onAdjustQty: (String, Double) -> Unit,
    onUpdateQtyValue: (String, Double) -> Unit,
    onAddItem: (ItemDraftInput, () -> Unit, (String) -> Unit) -> Unit,
    onUpdateItem: (String, ItemDraftInput, () -> Unit, (String) -> Unit) -> Unit,
    onDeleteItem: (String) -> Unit,
    onLoadCatalog: () -> Unit,
    onLoadMoreActivity: () -> Unit,
    onLookupBarcode: suspend (String) -> ScannedBarcodeProduct,
    onUploadImageUri: suspend (Context, Uri) -> String,
    onSaveGeminiKey: (String) -> Unit,
    onAnalyzeReceiptUri: suspend (Uri, String?) -> Pair<Bitmap, ReceiptAnalysisResult>,
    onRestockItemSuspend: suspend (String, Double, String?) -> Unit,
    onSaveProfileName: (String, () -> Unit) -> Unit,
    onUploadAvatar: (Context, Uri, () -> Unit) -> Unit,
    onChangePassword: (String, String, (String?) -> Unit) -> Unit,
    onSignOut: () -> Unit,
    onShowMessage: (String, Boolean) -> Unit
) {
    val palette = LocalGrimoirePalette.current

    var search by remember { mutableStateOf("") }
    var searchOpen by remember { mutableStateOf(false) }
    var statusFilter by remember { mutableStateOf("all") }
    var categoryFilter by remember { mutableStateOf("all") }

    var addOpen by remember { mutableStateOf(false) }
    var editItem by remember { mutableStateOf<InventoryItem?>(null) }
    var deleteConfirmId by remember { mutableStateOf<String?>(null) }
    var createHouseOpen by remember { mutableStateOf(false) }
    var joinHouseOpen by remember { mutableStateOf(false) }
    var settingsOpen by remember { mutableStateOf(false) }
    var marketOpen by remember { mutableStateOf(false) }
    var receiptOpen by remember { mutableStateOf(false) }
    var historyOpen by remember { mutableStateOf(false) }
    var profileOpen by remember { mutableStateOf(false) }

    val counts = remember(items) {
        mapOf(
            "all" to items.size,
            "in_stock" to items.count { it.status == ItemStatus.IN_STOCK },
            "running_low" to items.count { it.status == ItemStatus.RUNNING_LOW },
            "out_of_stock" to items.count { it.status == ItemStatus.OUT_OF_STOCK }
        )
    }
    val needsMarket = (counts["running_low"] ?: 0) + (counts["out_of_stock"] ?: 0)

    val filteredItems = remember(items, search, statusFilter, categoryFilter) {
        val q = search.trim().lowercase()
        items.filter { item ->
            val matchSearch = q.isEmpty() ||
                    item.name.lowercase().contains(q) ||
                    (item.brand?.lowercase()?.contains(q) == true) ||
                    (item.barcode?.lowercase()?.contains(q) == true)
            val matchStatus = statusFilter == "all" || item.status.dbValue == statusFilter
            val matchCategory = categoryFilter == "all" || item.categoryId == categoryFilter
            matchSearch && matchStatus && matchCategory
        }
    }

    val groupedItems = remember(filteredItems, categories) {
        val map = linkedMapOf<String, Pair<String, MutableList<InventoryItem>>>()
        filteredItems.forEach { item ->
            val key = item.categoryId ?: "__none__"
            val label = item.category?.let { "${it.emoji} ${it.name}" } ?: "📦 Sem categoria"
            map.getOrPut(key) { label to mutableListOf() }.second.add(item)
        }
        map.entries.sortedBy { (key, _) ->
            categories.firstOrNull { it.id == key }?.sortOrder ?: 999
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(palette.shellBgTop, palette.shellBgBottom)
                )
            )
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            HeaderComposable(
                houses = houses,
                activeHouse = activeHouse,
                profile = profile,
                isDark = isDark,
                needsMarket = needsMarket,
                onSelectHouse = onSelectHouse,
                onCreateHouse = { createHouseOpen = true },
                onJoinHouse = { joinHouseOpen = true },
                onOpenSettings = { settingsOpen = true },
                onOpenMarket = { marketOpen = true },
                onOpenReceiptScanner = { receiptOpen = true },
                onOpenHistory = { historyOpen = true },
                onOpenProfile = { profileOpen = true },
                onToggleTheme = onToggleTheme,
                onSignOut = onSignOut
            )

            // Moldura Mística de Livro de Feitiços / Grimório
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(palette.frameBgTop, palette.frameBgBottom)
                        )
                    )
                    .border(
                        width = 2.dp,
                        color = GrimoireColors.Gold.Base.copy(alpha = 0.65f),
                        shape = RoundedCornerShape(24.dp)
                    )
            ) {
                // Ornamentos de Trepadeiras nos 4 cantos
                CornerVine(
                    flipX = false,
                    flipY = false,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .size(72.dp)
                )
                CornerVine(
                    flipX = true,
                    flipY = false,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(72.dp)
                )
                CornerVine(
                    flipX = false,
                    flipY = true,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .size(72.dp)
                )
                CornerVine(
                    flipX = true,
                    flipY = true,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .size(72.dp)
                )

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(
                        start = 12.dp,
                        end = 12.dp,
                        top = 12.dp,
                        bottom = 112.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Cabeçalho do Grimório: Caldeirão + Título + Barra de Gemas + Seções
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CauldronEmblem(modifier = Modifier.size(68.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Caldeirão de Gaia",
                                        color = palette.titleGold,
                                        fontFamily = FontFamily.Serif,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 22.sp
                                    )
                                    Text(
                                        text = "Grimório & Inventário Alquímico da Casa",
                                        color = palette.textMuted,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            // Cápsula Dourada de Status com Gemas Mágicas
                            Surface(
                                shape = CircleShape,
                                color = palette.statusBarBg,
                                border = BorderStroke(1.5.dp, GrimoireColors.Gold.Base.copy(alpha = 0.8f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    listOf(
                                        "all" to "Todos",
                                        "in_stock" to ItemStatus.IN_STOCK.label,
                                        "running_low" to ItemStatus.RUNNING_LOW.label,
                                        "out_of_stock" to ItemStatus.OUT_OF_STOCK.label
                                    ).forEach { (key, label) ->
                                        val active = statusFilter == key
                                        val itemStatus = if (key == "all") null else ItemStatus.fromDb(key)
                                        Surface(
                                            onClick = { statusFilter = key },
                                            shape = CircleShape,
                                            color = if (active) palette.statusBtnActiveBg else Color.Transparent,
                                            border = if (active) BorderStroke(1.dp, GrimoireColors.Gold.Light) else null
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                if (itemStatus != null) {
                                                    StatusGem(status = itemStatus, size = 14.dp)
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                }
                                                Text(
                                                    text = label,
                                                    color = GrimoireColors.Gold.Cream,
                                                    fontFamily = FontFamily.Serif,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 12.sp
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = (counts[key] ?: 0).toString(),
                                                    color = GrimoireColors.Gold.Bright,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    // Botão Lupa integrado
                                    Surface(
                                        onClick = { searchOpen = !searchOpen },
                                        shape = CircleShape,
                                        color = if (search.isNotBlank() || searchOpen) GrimoireColors.Gold.Base else palette.headerPill,
                                        border = BorderStroke(1.dp, GrimoireColors.Gold.Light),
                                        modifier = Modifier.size(30.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = Icons.Default.Search,
                                                contentDescription = "Buscar ingrediente",
                                                tint = if (search.isNotBlank() || searchOpen) Color(0xFF1F1200) else GrimoireColors.Gold.Light,
                                                modifier = Modifier.size(15.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            // Linha secundária: Campo de Busca + Botão GRADE / LISTA
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                if (searchOpen || search.isNotBlank()) {
                                    OutlinedTextField(
                                        value = search,
                                        onValueChange = { search = it },
                                        placeholder = { Text("Buscar ingrediente, marca...", fontSize = 12.sp) },
                                        leadingIcon = {
                                            Icon(
                                                Icons.Default.Search,
                                                contentDescription = null,
                                                tint = GrimoireColors.Gold.Light,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        },
                                        trailingIcon = {
                                            if (search.isNotBlank()) {
                                                IconButton(onClick = { search = "" }) {
                                                    Icon(
                                                        Icons.Default.Close,
                                                        contentDescription = "Limpar",
                                                        modifier = Modifier.size(15.dp)
                                                    )
                                                }
                                            }
                                        },
                                        singleLine = true,
                                        shape = CircleShape,
                                        modifier = Modifier
                                            .weight(1f)
                                            .padding(end = 8.dp)
                                    )
                                } else {
                                    Spacer(modifier = Modifier.weight(1f))
                                }

                                Surface(
                                    onClick = onToggleViewMode,
                                    shape = RoundedCornerShape(10.dp),
                                    color = palette.headerPill,
                                    border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.55f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = if (viewMode == "grid") Icons.Default.GridView else Icons.AutoMirrored.Filled.ViewList,
                                            contentDescription = null,
                                            tint = GrimoireColors.Gold.Light,
                                            modifier = Modifier.size(15.dp)
                                        )
                                        Spacer(modifier = Modifier.width(5.dp))
                                        Text(
                                            text = if (viewMode == "grid") "GRADE" else "LISTA",
                                            color = GrimoireColors.Gold.Light,
                                            fontFamily = FontFamily.Serif,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            letterSpacing = 1.sp
                                        )
                                    }
                                }
                            }

                            HorizontalDivider(color = GrimoireColors.Gold.Base.copy(alpha = 0.25f))

                            // Seções do Caldeirão (Medalhões Alquímicos Horizontais)
                            if (categories.isNotEmpty()) {
                                Text(
                                    text = "Seções do Caldeirão",
                                    color = palette.titleGold,
                                    fontFamily = FontFamily.Serif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    CategoryMedallionComposable(
                                        emoji = "✨",
                                        name = "Todas",
                                        active = categoryFilter == "all",
                                        onClick = { categoryFilter = "all" }
                                    )
                                    categories.forEach { cat ->
                                        CategoryMedallionComposable(
                                            emoji = cat.emoji,
                                            name = cat.name,
                                            active = categoryFilter == cat.id,
                                            onClick = { categoryFilter = cat.id }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Conteúdo Principal: Loading / Empty / Grade 2 Colunas / Lista Agrupada
                    when {
                        inventoryLoading -> {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 64.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    CircularProgressIndicator(
                                        color = GrimoireColors.Gold.Light,
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Text(
                                        text = "Consultando o grimório...",
                                        color = GrimoireColors.Gold.Light,
                                        fontFamily = FontFamily.Serif,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        }

                        filteredItems.isEmpty() -> {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 56.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    CauldronEmblem(modifier = Modifier.size(84.dp))
                                    Text(
                                        text = if (items.isEmpty()) {
                                            "O caldeirão está vazio. Adicione o primeiro ingrediente mágico!"
                                        } else {
                                            "Nenhum ingrediente corresponde aos encantamentos de busca."
                                        },
                                        color = palette.textPrimary,
                                        fontFamily = FontFamily.Serif,
                                        fontSize = 15.sp,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 24.dp)
                                    )
                                }
                            }
                        }

                        categoryFilter == "all" && viewMode == "grid" -> {
                            val chunked = filteredItems.chunked(2)
                            items(chunked) { rowItems ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    rowItems.forEach { item ->
                                        ItemCardComposable(
                                            item = item,
                                            viewMode = "grid",
                                            onCycleStatus = onCycleStatus,
                                            onAdjustQty = onAdjustQty,
                                            onUpdateQtyValue = onUpdateQtyValue,
                                            onEdit = { editItem = it },
                                            onDelete = { deleteConfirmId = it },
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                    if (rowItems.size == 1) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }

                        else -> {
                            groupedItems.forEach { (_, pair) ->
                                val (groupLabel, groupList) = pair
                                item {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(top = 6.dp, bottom = 2.dp)
                                    ) {
                                        Text(
                                            text = groupLabel.uppercase(),
                                            color = GrimoireColors.Gold.Light,
                                            fontFamily = FontFamily.Serif,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "(${groupList.size})",
                                            color = palette.textMuted,
                                            fontSize = 11.sp
                                        )
                                    }
                                }

                                if (viewMode == "grid") {
                                    items(groupList.chunked(2)) { rowItems ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            rowItems.forEach { item ->
                                                ItemCardComposable(
                                                    item = item,
                                                    viewMode = "grid",
                                                    onCycleStatus = onCycleStatus,
                                                    onAdjustQty = onAdjustQty,
                                                    onUpdateQtyValue = onUpdateQtyValue,
                                                    onEdit = { editItem = it },
                                                    onDelete = { deleteConfirmId = it },
                                                    modifier = Modifier.weight(1f)
                                                )
                                            }
                                            if (rowItems.size == 1) {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                } else {
                                    items(groupList, key = { it.id }) { item ->
                                        ItemCardComposable(
                                            item = item,
                                            viewMode = "compact",
                                            onCycleStatus = onCycleStatus,
                                            onAdjustQty = onAdjustQty,
                                            onUpdateQtyValue = onUpdateQtyValue,
                                            onEdit = { editItem = it },
                                            onDelete = { deleteConfirmId = it }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // FAB — Orbe Mágica "+ Adicionar"
        AddOrbButton(
            onClick = { addOpen = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 16.dp)
        )
    }

    // Confirmação de exclusão de item
    if (deleteConfirmId != null) {
        AlertDialog(
            onDismissRequest = { deleteConfirmId = null },
            title = { Text("Excluir item") },
            text = { Text("Excluir este item do caldeirão?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        val target = deleteConfirmId
                        deleteConfirmId = null
                        if (target != null) onDeleteItem(target)
                    }
                ) {
                    Text("Excluir", color = Color(0xFFEF4444))
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteConfirmId = null }) {
                    Text("Cancelar")
                }
            }
        )
    }

    // Modais
    ItemFormModal(
        open = addOpen,
        initialData = null,
        categories = categories,
        existingItems = items,
        catalogProducts = catalogProducts,
        onLoadCatalog = onLoadCatalog,
        onLookupBarcode = onLookupBarcode,
        onUploadImageUri = onUploadImageUri,
        onSubmit = onAddItem,
        onClose = { addOpen = false }
    )

    ItemFormModal(
        open = editItem != null,
        initialData = editItem,
        categories = categories,
        existingItems = items,
        catalogProducts = catalogProducts,
        onLoadCatalog = onLoadCatalog,
        onLookupBarcode = onLookupBarcode,
        onUploadImageUri = onUploadImageUri,
        onSubmit = { draft, onSuccess, onError ->
            val target = editItem
            if (target != null) {
                onUpdateItem(
                    target.id,
                    draft,
                    {
                        editItem = null
                        onSuccess()
                    },
                    onError
                )
            }
        },
        onClose = { editItem = null }
    )

    CreateHouseModal(
        open = createHouseOpen,
        onClose = { createHouseOpen = false },
        onCreateHouse = onCreateHouse
    )

    JoinHouseModal(
        open = joinHouseOpen,
        onClose = { joinHouseOpen = false },
        onJoinHouse = onJoinHouse
    )

    SettingsModal(
        open = settingsOpen,
        onClose = { settingsOpen = false },
        activeHouse = activeHouse,
        currentUserId = currentUserId,
        members = members,
        categories = categories,
        onRenameHouse = onRenameHouse,
        onRegenerateInviteCode = onRegenerateInviteCode,
        onRemoveMember = onRemoveMember,
        onAddCategory = onAddCategory,
        onDeleteCategory = onDeleteCategory
    )

    MarketModal(
        open = marketOpen,
        onClose = { marketOpen = false },
        items = items,
        categories = categories,
        onSetStatus = onSetStatus,
        onRestockAll = onRestockAllMarket
    )

    ReceiptScannerModal(
        open = receiptOpen,
        onClose = { receiptOpen = false },
        hasEnvGeminiKey = hasEnvGeminiKey,
        savedGeminiKey = savedGeminiKey,
        categories = categories,
        onSaveGeminiKey = onSaveGeminiKey,
        onAnalyzeUri = onAnalyzeReceiptUri,
        onRestockItemSuspend = onRestockItemSuspend,
        onAddItem = onAddItem,
        onShowMessage = onShowMessage
    )

    ActivityLogModal(
        open = historyOpen,
        onClose = { historyOpen = false },
        entries = activityEntries,
        loading = activityLoading,
        hasMore = activityHasMore,
        onLoadMore = onLoadMoreActivity
    )

    ProfileModal(
        open = profileOpen,
        onClose = { profileOpen = false },
        profile = profile,
        email = currentUserEmail,
        onSaveName = onSaveProfileName,
        onUploadAvatar = onUploadAvatar,
        onChangePassword = onChangePassword
    )
}

/**
 * Medalhão de Categoria Alquímico (`CategoryMedallion` em `src/pages/HomePage.jsx`).
 */
@Composable
private fun CategoryMedallionComposable(
    emoji: String,
    name: String,
    active: Boolean,
    onClick: () -> Unit
) {
    val palette = LocalGrimoirePalette.current

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .clickable(onClick = onClick)
    ) {
        // Medalhão circular dourado com emoji
        Box(
            modifier = Modifier
                .zIndex(1f)
                .size(36.dp)
                .clip(CircleShape)
                .background(if (active) palette.medallionActiveBg else palette.medallionBg)
                .border(
                    width = 2.dp,
                    color = if (active) GrimoireColors.Gold.Bright else GrimoireColors.Gold.Base.copy(alpha = 0.85f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(text = emoji, fontSize = 15.sp)
        }

        // Placa horizontal com nome da seção
        Box(
            modifier = Modifier
                .offset(x = (-8).dp)
                .clip(RoundedCornerShape(topEnd = 50.dp, bottomEnd = 50.dp))
                .background(if (active) palette.plaqueActiveBg else palette.plaqueBg)
                .border(
                    width = 1.dp,
                    color = if (active) GrimoireColors.Gold.Light else GrimoireColors.Gold.Base.copy(alpha = 0.55f),
                    shape = RoundedCornerShape(topEnd = 50.dp, bottomEnd = 50.dp)
                )
                .padding(start = 14.dp, end = 12.dp, top = 6.dp, bottom = 6.dp)
        ) {
            Text(
                text = name,
                color = palette.textPrimary,
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
