package com.caldeiraodegaia.app.ui.components.items

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.caldeiraodegaia.app.core.util.Defaults
import com.caldeiraodegaia.app.core.util.FormatUtils
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.ui.components.ornaments.AlchemicalIllustration
import com.caldeiraodegaia.app.ui.components.ornaments.StatusGem
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette

/**
 * Equivalente nativo em Jetpack Compose de `src/components/items/ItemCard.jsx`,
 * suportando os modos `grid` (Carta Mágica Alquímica) e `compact` (Linha Compacta),
 * além do seletor `ParchmentScroll` para ajuste rápido de quantidade.
 */
@Composable
fun ItemCardComposable(
    item: InventoryItem,
    viewMode: String = "grid",
    onCycleStatus: (String, ItemStatus) -> Unit,
    onAdjustQty: (String, Double) -> Unit,
    onUpdateQtyValue: (String, Double) -> Unit,
    onEdit: (InventoryItem) -> Unit,
    onDelete: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val palette = LocalGrimoirePalette.current
    var menuOpen by remember { mutableStateOf(false) }

    val borderColor = when (item.status) {
        ItemStatus.IN_STOCK -> GrimoireColors.Gold.Base.copy(alpha = 0.8f)
        ItemStatus.RUNNING_LOW -> GrimoireColors.Gems.RunningLow.Mid.copy(alpha = 0.85f)
        ItemStatus.OUT_OF_STOCK -> GrimoireColors.Gems.OutOfStock.Mid.copy(alpha = 0.8f)
    }

    val statusTextColor = when (item.status) {
        ItemStatus.IN_STOCK -> if (palette.isDark) GrimoireColors.Gems.InStock.TextDark else GrimoireColors.Gems.InStock.TextLight
        ItemStatus.RUNNING_LOW -> if (palette.isDark) GrimoireColors.Gems.RunningLow.TextDark else GrimoireColors.Gems.RunningLow.TextLight
        ItemStatus.OUT_OF_STOCK -> if (palette.isDark) GrimoireColors.Gems.OutOfStock.TextDark else GrimoireColors.Gems.OutOfStock.TextLight
    }

    val hasQty = item.qtyValue != null
    val qtyDisplay = if (hasQty) {
        "${FormatUtils.formatQuantity(item.qtyValue)} ${item.qtyUnit}".trim()
    } else {
        item.status.label
    }

    fun openGoogleShopping() {
        val url = Defaults.buildGoogleShoppingUrl(item.name, item.brand)
        runCatching {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }
    }

    if (viewMode == "compact") {
        Surface(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = palette.cardBgTop,
            border = BorderStroke(1.5.dp, borderColor)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Miniatura / Ilustração
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(palette.cardBgBottom)
                        .border(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                        .clickable { onEdit(item) },
                    contentAlignment = Alignment.Center
                ) {
                    ItemArtwork(item = item, sizeDp = 36)
                }

                Spacer(modifier = Modifier.width(10.dp))

                // Nome e metadados
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onEdit(item) }
                ) {
                    Text(
                        text = buildString {
                            append(item.name)
                            if (!item.brand.isNullOrBlank()) append(" · ${item.brand}")
                        },
                        color = palette.textPrimary,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        textDecoration = if (item.status == ItemStatus.OUT_OF_STOCK) TextDecoration.LineThrough else TextDecoration.None,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    val updaterName = item.updater?.fullName ?: "Alguém"
                    val timeLabel = FormatUtils.timeAgo(item.updatedAt)
                    val catPrefix = item.category?.let { "${it.emoji} ${it.name} · " } ?: ""
                    Text(
                        text = "$catPrefix$updaterName${if (timeLabel.isNotBlank()) " · $timeLabel" else ""}",
                        color = palette.textMuted,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                ParchmentScrollSelector(
                    hasQty = hasQty,
                    qtyValue = item.qtyValue,
                    qtyDisplay = qtyDisplay,
                    compact = true,
                    onAdjust = { delta -> onAdjustQty(item.id, delta) },
                    onCommitValue = { newVal -> onUpdateQtyValue(item.id, newVal) },
                    onEmptyClick = { onEdit(item) }
                )

                Spacer(modifier = Modifier.width(6.dp))

                // Botão de ciclo de status
                Surface(
                    onClick = { onCycleStatus(item.id, item.status) },
                    shape = RoundedCornerShape(50),
                    color = palette.headerPill,
                    border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusGem(status = item.status, size = 13.dp)
                    }
                }

                Box {
                    IconButton(
                        onClick = { menuOpen = true },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "Opções",
                            tint = GrimoireColors.Gold.Light,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    ItemContextMenu(
                        expanded = menuOpen,
                        onDismiss = { menuOpen = false },
                        onShop = ::openGoogleShopping,
                        onDelete = { onDelete(item.id) }
                    )
                }
            }
        }
        return
    }

    // Modo Grade — Carta Mágica / Alquimia
    Box(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 248.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(palette.cardBgTop, palette.cardBgBottom)
                )
            )
            .border(2.dp, borderColor, RoundedCornerShape(18.dp))
            .padding(10.dp)
    ) {
        // Moldura interna dourada fina
        Box(
            modifier = Modifier
                .matchParentSize()
                .border(
                    width = 1.dp,
                    color = GrimoireColors.Gold.Base.copy(alpha = 0.28f),
                    shape = RoundedCornerShape(14.dp)
                )
        )

        // Menu ⋮ no canto superior direito
        Box(modifier = Modifier.align(Alignment.TopEnd)) {
            IconButton(
                onClick = { menuOpen = true },
                modifier = Modifier.size(26.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Opções do item",
                    tint = GrimoireColors.Gold.Light.copy(alpha = 0.85f),
                    modifier = Modifier.size(16.dp)
                )
            }
            ItemContextMenu(
                expanded = menuOpen,
                onDismiss = { menuOpen = false },
                onShop = ::openGoogleShopping,
                onDelete = { onDelete(item.id) }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Cabeçalho da Carta: Nome + Status
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Box(
                    modifier = Modifier.heightIn(min = 36.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = item.name,
                        color = palette.textPrimary,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 17.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        textDecoration = if (item.status == ItemStatus.OUT_OF_STOCK) TextDecoration.LineThrough else TextDecoration.None
                    )
                }

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .clickable { onCycleStatus(item.id, item.status) }
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusGem(status = item.status, size = 13.dp)
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = item.status.label,
                        color = statusTextColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Ilustração Central do Ingrediente / Produto
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(94.dp)
                    .clickable { onEdit(item) },
                contentAlignment = Alignment.Center
            ) {
                ItemArtwork(item = item, sizeDp = 82)
            }

            // Subtítulo opcional (Marca / Notas)
            val subtitle = listOfNotNull(
                item.brand?.takeIf { it.isNotBlank() },
                item.notes?.takeIf { it.isNotBlank() }
            ).joinToString(" · ")

            if (subtitle.isNotBlank()) {
                Text(
                    text = subtitle,
                    color = palette.textMuted,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp)
                )
            } else {
                Spacer(modifier = Modifier.height(14.dp))
            }

            // Rodapé: Pergaminho de Quantidade
            ParchmentScrollSelector(
                hasQty = hasQty,
                qtyValue = item.qtyValue,
                qtyDisplay = qtyDisplay,
                compact = false,
                onAdjust = { delta -> onAdjustQty(item.id, delta) },
                onCommitValue = { newVal -> onUpdateQtyValue(item.id, newVal) },
                onEmptyClick = { onEdit(item) }
            )
        }
    }
}

@Composable
private fun ItemArtwork(
    item: InventoryItem,
    sizeDp: Int
) {
    if (!item.imageUrl.isNullOrBlank()) {
        AsyncImage(
            model = item.imageUrl,
            contentDescription = item.name,
            contentScale = ContentScale.Fit,
            modifier = Modifier.size(sizeDp.dp)
        )
    } else {
        AlchemicalIllustration(
            categoryName = item.category?.name,
            itemName = item.name,
            modifier = Modifier.size(sizeDp.dp)
        )
    }
}

/**
 * Seletor de Quantidade em formato de Pergaminho Antigo com botões de bronze `-` e `+`
 * (`ParchmentScroll` em `src/components/items/ItemCard.jsx`).
 */
@Composable
private fun ParchmentScrollSelector(
    hasQty: Boolean,
    qtyValue: Double?,
    qtyDisplay: String,
    compact: Boolean,
    onAdjust: (Double) -> Unit,
    onCommitValue: (Double) -> Unit,
    onEmptyClick: () -> Unit
) {
    var editing by remember { mutableStateOf(false) }
    var draft by remember { mutableStateOf("") }

    fun commitDraft() {
        editing = false
        val parsed = draft.replace(',', '.').toDoubleOrNull()
        if (parsed != null && parsed != qtyValue) {
            onCommitValue(parsed)
        }
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = if (compact) Modifier.width(116.dp) else Modifier.fillMaxWidth()
    ) {
        // Rolo esquerdo do pergaminho
        Box(
            modifier = Modifier
                .width(8.dp)
                .height(30.dp)
                .clip(RoundedCornerShape(50))
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            GrimoireColors.Parchment.ScrollTop,
                            GrimoireColors.Parchment.ScrollMid,
                            GrimoireColors.Parchment.ScrollBot
                        )
                    )
                )
                .border(1.dp, GrimoireColors.Parchment.Border, RoundedCornerShape(50))
        )

        // Corpo do pergaminho
        Row(
            modifier = Modifier
                .weight(1f)
                .height(28.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            GrimoireColors.Parchment.Light,
                            GrimoireColors.Parchment.Mid,
                            GrimoireColors.Parchment.Dark
                        )
                    )
                )
                .border(1.dp, GrimoireColors.Parchment.Border)
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            BronzeStepButton(
                symbol = "−",
                enabled = hasQty && (qtyValue ?: 0.0) > 0.0,
                onClick = { onAdjust(-1.0) }
            )

            if (editing) {
                BasicTextField(
                    value = draft,
                    onValueChange = { input ->
                        draft = input.filter { it.isDigit() || it == '.' || it == ',' }
                    },
                    singleLine = true,
                    textStyle = TextStyle(
                        color = GrimoireColors.Parchment.Ink,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    ),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Decimal,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(onDone = { commitDraft() }),
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 2.dp)
                )
            } else {
                Text(
                    text = qtyDisplay,
                    color = GrimoireColors.Parchment.Ink,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            if (!hasQty) {
                                onEmptyClick()
                            } else {
                                draft = FormatUtils.formatQuantity(qtyValue)
                                editing = true
                            }
                        }
                        .padding(horizontal = 2.dp)
                )
            }

            BronzeStepButton(
                symbol = "+",
                enabled = true,
                onClick = { onAdjust(1.0) }
            )
        }

        // Rolo direito do pergaminho
        Box(
            modifier = Modifier
                .width(8.dp)
                .height(30.dp)
                .clip(RoundedCornerShape(50))
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            GrimoireColors.Parchment.ScrollTop,
                            GrimoireColors.Parchment.ScrollMid,
                            GrimoireColors.Parchment.ScrollBot
                        )
                    )
                )
                .border(1.dp, GrimoireColors.Parchment.Border, RoundedCornerShape(50))
        )
    }
}

@Composable
private fun BronzeStepButton(
    symbol: String,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(20.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        GrimoireColors.Parchment.BronzeTop.copy(alpha = if (enabled) 1f else 0.4f),
                        GrimoireColors.Parchment.BronzeBot.copy(alpha = if (enabled) 1f else 0.4f)
                    )
                )
            )
            .border(
                width = 1.dp,
                color = GrimoireColors.Parchment.BronzeBorder.copy(alpha = if (enabled) 1f else 0.4f),
                shape = RoundedCornerShape(4.dp)
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = symbol,
            color = GrimoireColors.Gold.Bright.copy(alpha = if (enabled) 1f else 0.4f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ItemContextMenu(
    expanded: Boolean,
    onDismiss: () -> Unit,
    onShop: () -> Unit,
    onDelete: () -> Unit
) {
    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismiss
    ) {
        DropdownMenuItem(
            text = { Text("Ver preços") },
            leadingIcon = { Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null) },
            onClick = {
                onDismiss()
                onShop()
            }
        )
        DropdownMenuItem(
            text = { Text("Eliminar", color = Color(0xFFEF4444)) },
            leadingIcon = {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = null,
                    tint = Color(0xFFEF4444)
                )
            },
            onClick = {
                onDismiss()
                onDelete()
            }
        )
    }
}
