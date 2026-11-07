package com.caldeiraodegaia.app.ui.modals

import android.Manifest
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.caldeiraodegaia.app.core.util.Defaults
import com.caldeiraodegaia.app.core.util.FormatUtils
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ItemDraftInput
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.hardware.MatchedReceiptItem
import com.caldeiraodegaia.app.hardware.ReceiptAnalysisResult
import com.caldeiraodegaia.app.hardware.ScannedBarcodeProduct
import com.caldeiraodegaia.app.hardware.UnmatchedReceiptItem
import com.caldeiraodegaia.app.ui.components.camera.BarcodeScannerView
import com.caldeiraodegaia.app.ui.components.common.GrimoireModalDialog
import com.caldeiraodegaia.app.ui.components.common.ImagePickerBox
import com.caldeiraodegaia.app.ui.components.common.createTempImageUri
import com.caldeiraodegaia.app.ui.components.ornaments.AlchemicalIllustration
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Equivalente nativo em Jetpack Compose de `src/components/items/ItemFormModal.jsx`,
 * com suporte às abas "Produtos do Banco" e "Criar / Personalizar", Autocomplete,
 * Upload de Foto e Leitor Nativo de Código de Barras CameraX + ML Kit.
 */
@Composable
fun ItemFormModal(
    open: Boolean,
    initialData: InventoryItem? = null,
    categories: List<CategoryDto>,
    existingItems: List<InventoryItem>,
    catalogProducts: List<ProductDto>,
    onLoadCatalog: () -> Unit,
    onLookupBarcode: suspend (String) -> ScannedBarcodeProduct,
    onUploadImageUri: suspend (Context, Uri) -> String,
    onSubmit: (ItemDraftInput, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit,
    onClose: () -> Unit
) {
    val palette = LocalGrimoirePalette.current
    val isEdit = initialData != null

    var tab by remember(open, isEdit) { mutableStateOf("new") }
    var catalogSearch by remember(open) { mutableStateOf("") }
    var catalogCatId by remember(open) { mutableStateOf("") }
    var addingProdId by remember(open) { mutableStateOf<String?>(null) }
    var justAddedIds by remember(open) { mutableStateOf(setOf<String>()) }

    var productId by remember(open, initialData) { mutableStateOf(initialData?.productId) }
    var name by remember(open, initialData) { mutableStateOf(initialData?.name.orEmpty()) }
    var brand by remember(open, initialData) { mutableStateOf(initialData?.brand.orEmpty()) }
    var barcode by remember(open, initialData) { mutableStateOf(initialData?.barcode.orEmpty()) }
    var defaultUnit by remember(open, initialData) { mutableStateOf(initialData?.defaultUnit ?: "un") }
    var categoryId by remember(open, initialData) { mutableStateOf(initialData?.categoryId.orEmpty()) }
    var notes by remember(open, initialData) { mutableStateOf(initialData?.notes.orEmpty()) }
    var imageUrl by remember(open, initialData) { mutableStateOf(initialData?.imageUrl.orEmpty()) }

    val initialHasQty = initialData?.qtyValue != null
    val initialResolvedUnit = initialData?.qtyUnit ?: initialData?.defaultUnit ?: "un"
    val initialIsUnit = initialHasQty && Defaults.UNIT_OPTIONS.contains(initialResolvedUnit)

    var qtyType by remember(open, initialData) {
        mutableStateOf(
            when {
                !initialHasQty -> "none"
                initialIsUnit -> "unit"
                else -> "weight"
            }
        )
    }
    var qtyValue by remember(open, initialData) {
        mutableStateOf(initialData?.qtyValue?.let { FormatUtils.formatQuantity(it) }.orEmpty())
    }
    var qtyUnit by remember(open, initialData) { mutableStateOf(initialResolvedUnit) }

    var imageMode by remember(open) { mutableStateOf("upload") }
    var loading by remember(open) { mutableStateOf(false) }
    var errorText by remember(open) { mutableStateOf<String?>(null) }
    var catMenuExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(open, isEdit) {
        if (open && !isEdit) {
            onLoadCatalog()
        }
    }

    LaunchedEffect(catalogProducts.size, open, isEdit) {
        if (open && !isEdit && catalogProducts.isNotEmpty() && name.isBlank()) {
            tab = "catalog"
        }
    }

    val existingProductIds = remember(existingItems, justAddedIds) {
        buildSet {
            addAll(justAddedIds)
            existingItems.forEach { item ->
                item.productId?.let(::add)
                add(item.product.id)
            }
        }
    }

    val filteredCatalog = remember(catalogProducts, catalogSearch) {
        val q = catalogSearch.trim().lowercase()
        if (q.isEmpty()) catalogProducts
        else catalogProducts.filter { p ->
            p.name.lowercase().contains(q) ||
                    (p.brand?.lowercase()?.contains(q) == true) ||
                    (p.barcode?.lowercase()?.contains(q) == true)
        }
    }

    fun selectProductFromCatalog(prod: ProductDto) {
        val unit = prod.defaultUnit?.ifBlank { "un" } ?: "un"
        val isUnit = Defaults.UNIT_OPTIONS.contains(unit)
        productId = prod.id
        name = prod.name
        brand = prod.brand.orEmpty()
        barcode = prod.barcode.orEmpty()
        defaultUnit = unit
        if (categoryId.isBlank() && catalogCatId.isNotBlank()) categoryId = catalogCatId
        if (!prod.imageUrl.isNullOrBlank()) imageUrl = prod.imageUrl
        if (qtyType == "none") qtyType = if (isUnit) "unit" else "weight"
        if (qtyValue.isBlank()) qtyValue = "1"
        qtyUnit = unit
        tab = "new"
    }

    fun stepQuantity(delta: Int) {
        val current = qtyValue.replace(',', '.').toDoubleOrNull() ?: 0.0
        val step = if (qtyUnit in listOf("g", "mL", "mg")) 100.0 else 1.0
        val next = max(0.0, ((current + delta * step) * 100.0).roundToInt() / 100.0)
        qtyValue = FormatUtils.formatQuantity(next)
    }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = if (isEdit) "Editar item" else "Adicionar ao Caldeirão"
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            if (!isEdit && catalogProducts.isNotEmpty()) {
                Surface(
                    color = palette.modalSurface,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val availableCount = catalogProducts.count { !existingProductIds.contains(it.id) }
                        listOf(
                            "catalog" to "Produtos do Banco ($availableCount)",
                            "new" to "Criar / Personalizar"
                        ).forEach { (key, label) ->
                            val active = tab == key
                            Surface(
                                onClick = { tab = key },
                                shape = RoundedCornerShape(9.dp),
                                color = if (active) GrimoireColors.PrimaryPurple else Color.Transparent,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = label,
                                    color = if (active) Color.White else palette.modalMuted,
                                    fontSize = 12.sp,
                                    fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            if (!isEdit && tab == "catalog") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = catalogSearch,
                        onValueChange = { catalogSearch = it },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        placeholder = { Text("Buscar produto já cadastrado...", fontSize = 13.sp) },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (categories.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = catalogCatId.isEmpty(),
                                onClick = { catalogCatId = "" },
                                label = { Text("Sem categoria", fontSize = 11.sp) }
                            )
                            categories.forEach { cat ->
                                FilterChip(
                                    selected = catalogCatId == cat.id,
                                    onClick = { catalogCatId = cat.id },
                                    label = { Text("${cat.emoji} ${cat.name}", fontSize = 11.sp) }
                                )
                            }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 340.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (filteredCatalog.isEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Nenhum produto encontrado com \"$catalogSearch\".",
                                    color = palette.modalMuted,
                                    fontSize = 13.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        name = catalogSearch.trim()
                                        productId = null
                                        tab = "new"
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                                ) {
                                    Text("+ Criar \"${catalogSearch.trim()}\" como novo", color = Color.White, fontSize = 12.sp)
                                }
                            }
                        } else {
                            filteredCatalog.forEach { prod ->
                                val alreadyInHouse = existingProductIds.contains(prod.id)
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = palette.modalSurface,
                                    border = BorderStroke(1.dp, palette.modalBorder),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(38.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(palette.modalBg),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (!prod.imageUrl.isNullOrBlank()) {
                                                AsyncImage(
                                                    model = prod.imageUrl,
                                                    contentDescription = prod.name,
                                                    contentScale = ContentScale.Fit,
                                                    modifier = Modifier.size(34.dp)
                                                )
                                            } else {
                                                AlchemicalIllustration(
                                                    categoryName = null,
                                                    itemName = prod.name,
                                                    modifier = Modifier.size(34.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = prod.name,
                                                color = palette.modalText,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                text = listOfNotNull(
                                                    prod.brand?.takeIf { it.isNotBlank() },
                                                    "Unidade: ${prod.defaultUnit ?: "un"}"
                                                ).joinToString(" · "),
                                                color = palette.modalMuted,
                                                fontSize = 11.sp
                                            )
                                        }

                                        if (alreadyInHouse) {
                                            Surface(
                                                shape = RoundedCornerShape(8.dp),
                                                color = GrimoireColors.Gems.InStock.Mid.copy(alpha = 0.2f)
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Icon(
                                                        Icons.Default.Check,
                                                        contentDescription = null,
                                                        tint = GrimoireColors.Gems.InStock.Mid,
                                                        modifier = Modifier.size(13.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "No Caldeirão",
                                                        color = GrimoireColors.Gems.InStock.Mid,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.SemiBold
                                                    )
                                                }
                                            }
                                        } else {
                                            IconButton(
                                                onClick = { selectProductFromCatalog(prod) },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Tune,
                                                    contentDescription = "Personalizar",
                                                    tint = palette.modalMuted,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                            Button(
                                                onClick = {
                                                    addingProdId = prod.id
                                                    val unit = prod.defaultUnit ?: "un"
                                                    onSubmit(
                                                        ItemDraftInput(
                                                            productId = prod.id,
                                                            name = prod.name,
                                                            brand = prod.brand,
                                                            barcode = prod.barcode,
                                                            defaultUnit = unit,
                                                            categoryId = catalogCatId.ifBlank { null },
                                                            qtyValue = 1.0,
                                                            qtyUnit = unit,
                                                            imageUrl = prod.imageUrl
                                                        ),
                                                        {
                                                            addingProdId = null
                                                            justAddedIds = justAddedIds + prod.id
                                                        },
                                                        { err ->
                                                            addingProdId = null
                                                            errorText = err
                                                        }
                                                    )
                                                },
                                                enabled = addingProdId != prod.id,
                                                shape = RoundedCornerShape(10.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Adicionar", color = Color.White, fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        OutlinedButton(onClick = onClose, shape = RoundedCornerShape(12.dp)) {
                            Text("Fechar")
                        }
                    }
                }
            } else {
                // Formulário de Criar / Personalizar / Editar
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 530.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = {
                            if (it.length <= 80) {
                                name = it
                                productId = null
                                errorText = null
                            }
                        },
                        label = { Text("Nome do item *") },
                        placeholder = { Text("Ex: Leite, Detergente...") },
                        isError = errorText != null,
                        supportingText = errorText?.let { err -> { Text(err) } },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = brand,
                            onValueChange = { if (it.length <= 60) brand = it },
                            label = { Text("Marca") },
                            placeholder = { Text("Ex: Nestlé") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = barcode,
                            onValueChange = { if (it.length <= 30) barcode = it },
                            label = { Text("Cód. barras") },
                            placeholder = { Text("789...") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Seletor de Categoria
                    val selectedCat = categories.firstOrNull { it.id == categoryId }
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { catMenuExpanded = true },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = selectedCat?.let { "Categoria: ${it.emoji} ${it.name}" }
                                    ?: "Categoria: 📦 Sem categoria",
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                        }
                        DropdownMenu(
                            expanded = catMenuExpanded,
                            onDismissRequest = { catMenuExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("📦 Sem categoria") },
                                onClick = {
                                    categoryId = ""
                                    catMenuExpanded = false
                                }
                            )
                            categories.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text("${cat.emoji} ${cat.name}") },
                                    onClick = {
                                        categoryId = cat.id
                                        catMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Seletor de Quantidade Inteligente
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Quantidade",
                                color = palette.modalText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                listOf(
                                    "none" to "Nenhuma",
                                    "unit" to "Unidades",
                                    "weight" to "Peso/Vol"
                                ).forEach { (key, label) ->
                                    FilterChip(
                                        selected = qtyType == key,
                                        onClick = {
                                            qtyType = key
                                            if (key == "none") {
                                                qtyValue = ""
                                            } else {
                                                if (qtyValue.isBlank()) qtyValue = "1"
                                                qtyUnit = if (key == "unit") {
                                                    if (Defaults.UNIT_OPTIONS.contains(defaultUnit)) defaultUnit else "un"
                                                } else {
                                                    if (Defaults.WEIGHT_OPTIONS.contains(defaultUnit)) defaultUnit else "kg"
                                                }
                                            }
                                        },
                                        label = { Text(label, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }

                        if (qtyType != "none") {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { stepQuantity(-1) },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("−", fontWeight = FontWeight.Bold)
                                }
                                OutlinedTextField(
                                    value = qtyValue,
                                    onValueChange = { qtyValue = it },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedButton(
                                    onClick = { stepQuantity(1) },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("+", fontWeight = FontWeight.Bold)
                                }
                            }

                            val unitList = if (qtyType == "unit") Defaults.UNIT_OPTIONS else Defaults.WEIGHT_OPTIONS
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                unitList.forEach { u ->
                                    FilterChip(
                                        selected = qtyUnit == u,
                                        onClick = {
                                            qtyUnit = u
                                            defaultUnit = u
                                        },
                                        label = { Text(u, fontSize = 11.sp) }
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { if (it.length <= 200) notes = it },
                        label = { Text("Nota (opcional)") },
                        placeholder = { Text("Ex: Marca preferida...") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Imagem do produto ou Scanner de Código de Barras CameraX/ML Kit
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Imagem / Código",
                                color = palette.modalText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                FilterChip(
                                    selected = imageMode == "upload",
                                    onClick = { imageMode = "upload" },
                                    leadingIcon = { Icon(Icons.Default.Upload, contentDescription = null, modifier = Modifier.size(14.dp)) },
                                    label = { Text("Enviar", fontSize = 11.sp) }
                                )
                                FilterChip(
                                    selected = imageMode == "barcode",
                                    onClick = { imageMode = "barcode" },
                                    leadingIcon = { Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(14.dp)) },
                                    label = { Text("Código", fontSize = 11.sp) }
                                )
                            }
                        }

                        if (imageMode == "upload") {
                            ImagePickerBox(
                                imageUrl = imageUrl,
                                onImageChanged = { imageUrl = it },
                                onUploadUri = onUploadImageUri
                            )
                        } else {
                            BarcodeScannerView(
                                onLookupBarcode = onLookupBarcode,
                                onClose = { imageMode = "upload" },
                                onResult = { scanned ->
                                    if (name.isBlank() && scanned.name.isNotBlank()) name = scanned.name
                                    if (brand.isBlank() && scanned.brand.isNotBlank()) brand = scanned.brand
                                    if (scanned.barcode.isNotBlank()) barcode = scanned.barcode
                                    defaultUnit = scanned.defaultUnit.ifBlank { defaultUnit }
                                    qtyUnit = scanned.defaultUnit.ifBlank { qtyUnit }
                                    if (!scanned.imageUrl.isNullOrBlank()) imageUrl = scanned.imageUrl
                                    imageMode = "upload"
                                }
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = onClose,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Cancelar")
                        }
                        Button(
                            onClick = {
                                val cleanName = name.trim()
                                if (cleanName.isEmpty()) {
                                    errorText = "O nome é obrigatório."
                                    return@Button
                                }
                                loading = true
                                val hasQty = qtyType != "none" && qtyValue.isNotBlank()
                                val parsedQty = if (hasQty) qtyValue.replace(',', '.').toDoubleOrNull() else null
                                val resolvedDefault = defaultUnit.ifBlank { qtyUnit.ifBlank { "un" } }
                                val resolvedQtyUnit = if (hasQty) qtyUnit.ifBlank { resolvedDefault } else resolvedDefault

                                onSubmit(
                                    ItemDraftInput(
                                        productId = productId,
                                        name = cleanName,
                                        brand = brand.trim().takeIf { it.isNotEmpty() },
                                        barcode = barcode.trim().takeIf { it.isNotEmpty() },
                                        defaultUnit = resolvedDefault,
                                        categoryId = categoryId.takeIf { it.isNotEmpty() },
                                        qtyValue = parsedQty,
                                        qtyUnit = resolvedQtyUnit,
                                        notes = notes.trim().takeIf { it.isNotEmpty() },
                                        imageUrl = imageUrl.trim().takeIf { it.isNotEmpty() }
                                    ),
                                    {
                                        loading = false
                                        onClose()
                                    },
                                    { err ->
                                        loading = false
                                        errorText = err
                                    }
                                )
                            },
                            enabled = !loading,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                        ) {
                            if (loading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = Color.White
                                )
                            } else {
                                Text(if (isEdit) "Salvar" else "Adicionar", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/items/ReceiptScannerModal.jsx`.
 * Integra captura por câmera / galeria, OCR on-device via Google ML Kit Text Recognition
 * e análise semântica via Gemini 3.8 Flash.
 */
@Composable
fun ReceiptScannerModal(
    open: Boolean,
    onClose: () -> Unit,
    hasEnvGeminiKey: Boolean,
    savedGeminiKey: String,
    categories: List<CategoryDto>,
    onSaveGeminiKey: (String) -> Unit,
    onAnalyzeUri: suspend (Uri, String?) -> Pair<Bitmap, ReceiptAnalysisResult>,
    onRestockItemSuspend: suspend (itemId: String, addedQty: Double, unit: String?) -> Unit,
    onAddItem: (ItemDraftInput, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit,
    onShowMessage: (String, isError: Boolean) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val palette = LocalGrimoirePalette.current

    var apiKeyInput by remember(open, savedGeminiKey) { mutableStateOf(savedGeminiKey) }
    var showKeyForm by remember(open, savedGeminiKey) { mutableStateOf(savedGeminiKey.isBlank() && !hasEnvGeminiKey) }
    var previewBitmap by remember(open) { mutableStateOf<Bitmap?>(null) }
    var analyzing by remember(open) { mutableStateOf(false) }
    var savingRestock by remember(open) { mutableStateOf(false) }
    var addingTempId by remember(open) { mutableStateOf<String?>(null) }

    var storeName by remember(open) { mutableStateOf("") }
    var matched by remember(open) { mutableStateOf<List<MatchedReceiptItem>>(emptyList()) }
    var unmatched by remember(open) { mutableStateOf<List<UnmatchedReceiptItem>>(emptyList()) }
    var hasResult by remember(open) { mutableStateOf(false) }
    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }

    fun resetState() {
        previewBitmap = null
        analyzing = false
        savingRestock = false
        addingTempId = null
        storeName = ""
        matched = emptyList()
        unmatched = emptyList()
        hasResult = false
    }

    fun processSelectedUri(uri: Uri?) {
        if (uri == null) return
        val currentKey = apiKeyInput.trim().ifEmpty { savedGeminiKey }
        if (currentKey.isBlank() && !hasEnvGeminiKey) {
            showKeyForm = true
            onShowMessage("Configure sua chave da API Gemini antes de ler a nota.", true)
            return
        }

        analyzing = true
        hasResult = false
        scope.launch {
            try {
                val (bmp, result) = onAnalyzeUri(uri, currentKey)
                previewBitmap = bmp
                storeName = result.storeName
                matched = result.matched
                unmatched = result.unmatched
                hasResult = true

                val totalCount = result.matched.size + result.unmatched.size
                if (totalCount == 0) {
                    onShowMessage("Nenhum produto foi identificado na imagem.", false)
                } else {
                    onShowMessage("$totalCount produto(s) lido(s) na nota!", false)
                }
            } catch (e: Exception) {
                onShowMessage(e.message ?: "Erro ao analisar a nota fiscal.", true)
            } finally {
                analyzing = false
            }
        }
    }

    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && pendingCameraUri != null) {
            processSelectedUri(pendingCameraUri)
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            val uri = createTempImageUri(context)
            pendingCameraUri = uri
            takePictureLauncher.launch(uri)
        } else {
            onShowMessage("Permissão de câmera negada.", true)
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        processSelectedUri(uri)
    }

    GrimoireModalDialog(
        open = open,
        onClose = {
            resetState()
            onClose()
        },
        title = "📜 Ler Nota Fiscal"
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Configuração da chave Gemini
            if (!hasEnvGeminiKey) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = palette.modalSurface,
                    border = BorderStroke(1.dp, palette.modalBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (showKeyForm) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.Key,
                                        contentDescription = null,
                                        tint = GrimoireColors.Gold.Light,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Chave API Google Gemini",
                                        color = palette.modalText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                TextButton(
                                    onClick = {
                                        runCatching {
                                            context.startActivity(
                                                Intent(Intent.ACTION_VIEW, Uri.parse("https://aistudio.google.com/apikey"))
                                            )
                                        }
                                    }
                                ) {
                                    Text("Obter chave", fontSize = 11.sp)
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = apiKeyInput,
                                    onValueChange = { apiKeyInput = it },
                                    placeholder = { Text("Cole sua chave AIzaSy...", fontSize = 12.sp) },
                                    visualTransformation = PasswordVisualTransformation(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f)
                                )
                                Button(
                                    onClick = {
                                        if (apiKeyInput.trim().isEmpty()) {
                                            onShowMessage("Cole uma chave válida da API Gemini.", true)
                                        } else {
                                            onSaveGeminiKey(apiKeyInput.trim())
                                            showKeyForm = false
                                        }
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                                ) {
                                    Text("Salvar", color = Color.White, fontSize = 12.sp)
                                }
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.AutoAwesome,
                                    contentDescription = null,
                                    tint = GrimoireColors.Gold.Light,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "ML Kit OCR + Gemini Vision ativos",
                                    color = palette.modalMuted,
                                    fontSize = 12.sp
                                )
                            }
                            TextButton(onClick = { showKeyForm = true }) {
                                Text("Trocar chave", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Estado Inicial: Botões de Câmera e Galeria
            if (!analyzing && !hasResult) {
                Text(
                    text = "Fotografe o cupom fiscal do mercado. O Google ML Kit + Gemini identificam os produtos abreviados e somam as quantidades aos itens que você já tem no Caldeirão!",
                    color = palette.modalMuted,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        onClick = { cameraPermissionLauncher.launch(Manifest.permission.CAMERA) },
                        shape = RoundedCornerShape(16.dp),
                        color = palette.modalSurface,
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.5f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 20.dp, horizontal = 10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                Icons.Default.CameraAlt,
                                contentDescription = null,
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(28.dp)
                            )
                            Text(
                                text = "Fotografar Nota",
                                color = palette.modalText,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Câmera do celular",
                                color = palette.modalMuted,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Surface(
                        onClick = {
                            galleryLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        shape = RoundedCornerShape(16.dp),
                        color = palette.modalSurface,
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.5f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 20.dp, horizontal = 10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                Icons.Default.PhotoLibrary,
                                contentDescription = null,
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(28.dp)
                            )
                            Text(
                                text = "Da Galeria",
                                color = palette.modalText,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Foto ou print",
                                color = palette.modalMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // Estado de carregamento
            if (analyzing) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    CircularProgressIndicator(
                        color = GrimoireColors.Gold.Light,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = "Decifrando o pergaminho fiscal...",
                        color = GrimoireColors.Gold.Bright,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Extraindo texto com ML Kit e cruzando com os itens do seu Caldeirão.",
                        color = palette.modalMuted,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Resultado da Conferência
            if (!analyzing && hasResult) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 460.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Cabeçalho de resumo
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = palette.modalSurface,
                        border = BorderStroke(1.dp, palette.modalBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                val bmp = previewBitmap
                                if (bmp != null) {
                                    Image(
                                        bitmap = bmp.asImageBitmap(),
                                        contentDescription = "Miniatura da nota",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .size(38.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                }
                                Column {
                                    Text(
                                        text = if (storeName.isNotBlank()) "Nota: $storeName" else "Nota Fiscal Analisada",
                                        color = palette.modalText,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${matched.size} no seu Caldeirão · ${unmatched.size} novos",
                                        color = palette.modalMuted,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            TextButton(onClick = ::resetState) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Outra foto", fontSize = 12.sp)
                            }
                        }
                    }

                    // SEÇÃO 1: Encontrados no Caldeirão
                    Text(
                        text = "✅ ENCONTRADOS NO SEU CALDEIRÃO (${matched.size})",
                        color = GrimoireColors.Gems.InStock.Mid,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )

                    if (matched.isEmpty()) {
                        Text(
                            text = "Nenhum item desta nota corresponde aos nomes já cadastrados no Caldeirão.",
                            color = palette.modalMuted,
                            fontSize = 12.sp
                        )
                    } else {
                        matched.forEach { entry ->
                            val newTotal = ((entry.currentQty + entry.addedQty) * 1000.0).roundToInt() / 1000.0
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = palette.modalSurface,
                                border = BorderStroke(
                                    1.dp,
                                    if (entry.selected) GrimoireColors.Gems.InStock.Mid.copy(alpha = 0.6f) else palette.modalBorder
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(
                                        checked = entry.selected,
                                        onCheckedChange = {
                                            matched = matched.map { m ->
                                                if (m.itemId == entry.itemId) m.copy(selected = !m.selected) else m
                                            }
                                        }
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = entry.productName,
                                            color = palette.modalText,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp
                                        )
                                        if (entry.rawTexts.isNotEmpty()) {
                                            Text(
                                                text = "Na nota: ${entry.rawTexts.joinToString(" + ")}",
                                                color = palette.modalMuted,
                                                fontSize = 11.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                        Text(
                                            text = "Tinha: ${FormatUtils.formatQuantity(entry.currentQty)} ${entry.unit} → Vai para: ${FormatUtils.formatQuantity(newTotal)} ${entry.unit}",
                                            color = GrimoireColors.Gems.InStock.Mid,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        IconButton(
                                            onClick = {
                                                matched = matched.map { m ->
                                                    if (m.itemId == entry.itemId) {
                                                        m.copy(addedQty = max(0.5, ((m.addedQty - 1.0) * 100.0).roundToInt() / 100.0))
                                                    } else m
                                                }
                                            },
                                            modifier = Modifier.size(26.dp)
                                        ) {
                                            Text("−", fontWeight = FontWeight.Bold)
                                        }
                                        Text(
                                            text = "+${FormatUtils.formatQuantity(entry.addedQty)} ${entry.unit}",
                                            color = GrimoireColors.Gold.Light,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        IconButton(
                                            onClick = {
                                                matched = matched.map { m ->
                                                    if (m.itemId == entry.itemId) {
                                                        m.copy(addedQty = ((m.addedQty + 1.0) * 100.0).roundToInt() / 100.0)
                                                    } else m
                                                }
                                            },
                                            modifier = Modifier.size(26.dp)
                                        ) {
                                            Text("+", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }

                        val selectedEntries = matched.filter { it.selected && it.addedQty > 0.0 }
                        Button(
                            onClick = {
                                if (selectedEntries.isEmpty()) {
                                    resetState()
                                    onClose()
                                    return@Button
                                }
                                savingRestock = true
                                scope.launch {
                                    try {
                                        selectedEntries.forEach { e ->
                                            onRestockItemSuspend(e.itemId, e.addedQty, e.unit)
                                        }
                                        onShowMessage(
                                            "${selectedEntries.size} ${if (selectedEntries.size == 1) "item atualizado" else "itens atualizados"} no Caldeirão!",
                                            false
                                        )
                                        resetState()
                                        onClose()
                                    } catch (e: Exception) {
                                        onShowMessage(e.message ?: "Erro ao atualizar estoque.", true)
                                    } finally {
                                        savingRestock = false
                                    }
                                }
                            },
                            enabled = !savingRestock && selectedEntries.isNotEmpty(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Somar ${selectedEntries.size} ${if (selectedEntries.size == 1) "item" else "itens"} ao Caldeirão",
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // SEÇÃO 2: Outros itens novos na nota
                    if (unmatched.isNotEmpty()) {
                        HorizontalDivider(color = palette.modalBorder)
                        Text(
                            text = "📦 OUTROS ITENS NA NOTA (${unmatched.size})",
                            color = GrimoireColors.Gold.Light,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )

                        unmatched.forEach { entry ->
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = palette.modalSurface,
                                border = BorderStroke(1.dp, palette.modalBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = buildString {
                                                append(entry.name)
                                                if (entry.brand.isNotBlank()) append(" · ${entry.brand}")
                                                append(" (${FormatUtils.formatQuantity(entry.qty)} ${entry.unit})")
                                            },
                                            color = palette.modalText,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                        if (entry.rawText.isNotBlank()) {
                                            Text(
                                                text = "Na nota: ${entry.rawText}",
                                                color = palette.modalMuted,
                                                fontSize = 11.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    if (entry.added) {
                                        Text(
                                            text = "✓ Cadastrado",
                                            color = GrimoireColors.Gems.InStock.Mid,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    } else {
                                        OutlinedButton(
                                            onClick = {
                                                addingTempId = entry.tempId
                                                onAddItem(
                                                    ItemDraftInput(
                                                        name = entry.name,
                                                        brand = entry.brand.ifBlank { null },
                                                        defaultUnit = entry.unit.ifBlank { "un" },
                                                        categoryId = entry.categoryId.ifBlank { null },
                                                        qtyValue = entry.qty,
                                                        qtyUnit = entry.unit.ifBlank { "un" }
                                                    ),
                                                    {
                                                        addingTempId = null
                                                        unmatched = unmatched.map { u ->
                                                            if (u.tempId == entry.tempId) u.copy(added = true) else u
                                                        }
                                                    },
                                                    {
                                                        addingTempId = null
                                                    }
                                                )
                                            },
                                            enabled = addingTempId != entry.tempId,
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Cadastrar", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
