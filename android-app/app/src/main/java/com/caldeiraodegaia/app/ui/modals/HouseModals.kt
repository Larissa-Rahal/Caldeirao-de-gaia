package com.caldeiraodegaia.app.ui.modals

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.PersonRemove
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.caldeiraodegaia.app.core.util.Defaults
import com.caldeiraodegaia.app.core.util.FormatUtils
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.ActivityLogEntryDto
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.HouseDto
import com.caldeiraodegaia.app.data.model.HouseMemberDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ProfileDto
import com.caldeiraodegaia.app.ui.components.common.AvatarComposable
import com.caldeiraodegaia.app.ui.components.common.GrimoireModalDialog
import com.caldeiraodegaia.app.ui.components.ornaments.AlchemicalIllustration
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette

/**
 * Equivalente nativo em Jetpack Compose de `src/components/house/CreateHouseModal.jsx`.
 */
@Composable
fun CreateHouseModal(
    open: Boolean,
    onClose: () -> Unit,
    onCreateHouse: (name: String, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit
) {
    var name by remember(open) { mutableStateOf("") }
    var loading by remember(open) { mutableStateOf(false) }
    var errorText by remember(open) { mutableStateOf<String?>(null) }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "Novo caldeirão"
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = name,
                onValueChange = {
                    if (it.length <= 60) name = it
                    errorText = null
                },
                label = { Text("Nome do caldeirão") },
                placeholder = { Text("Ex: Caldeirão da Família Silva") },
                isError = errorText != null,
                supportingText = errorText?.let { err -> { Text(err) } },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
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
                        val trimmed = name.trim()
                        if (trimmed.isEmpty()) {
                            errorText = "O nome é obrigatório."
                            return@Button
                        }
                        loading = true
                        onCreateHouse(
                            trimmed,
                            {
                                loading = false
                                name = ""
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
                        Text("Criar", color = Color.White)
                    }
                }
            }
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/house/JoinHouseModal.jsx`.
 */
@Composable
fun JoinHouseModal(
    open: Boolean,
    initialInviteCode: String? = null,
    onClose: () -> Unit,
    onJoinHouse: (code: String, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit
) {
    val palette = LocalGrimoirePalette.current
    var code by remember(open, initialInviteCode) {
        mutableStateOf(initialInviteCode?.uppercase()?.take(6).orEmpty())
    }
    var loading by remember(open) { mutableStateOf(false) }
    var errorText by remember(open) { mutableStateOf<String?>(null) }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "Entrar num caldeirão"
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(GrimoireColors.PrimaryPurple.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Login,
                    contentDescription = null,
                    tint = GrimoireColors.Gold.Light,
                    modifier = Modifier.size(26.dp)
                )
            }

            Text(
                text = "Pede o código de 6 letras ao dono do caldeirão ou abre o link de convite que te enviaram.",
                color = palette.modalMuted,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )

            OutlinedTextField(
                value = code,
                onValueChange = {
                    code = it.uppercase().take(6)
                    errorText = null
                },
                label = { Text("Código de convite") },
                placeholder = { Text("ABC123") },
                textStyle = TextStyle(
                    fontFamily = FontFamily.Monospace,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    letterSpacing = 4.sp
                ),
                isError = errorText != null,
                supportingText = errorText?.let { err -> { Text(err) } },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
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
                        val trimmed = code.trim().uppercase()
                        if (trimmed.length != 6) {
                            errorText = "O código tem 6 caracteres."
                            return@Button
                        }
                        loading = true
                        onJoinHouse(
                            trimmed,
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
                        Text("Entrar", color = Color.White)
                    }
                }
            }
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/house/SettingsModal.jsx`.
 */
@Composable
fun SettingsModal(
    open: Boolean,
    onClose: () -> Unit,
    activeHouse: HouseDto?,
    currentUserId: String?,
    members: List<HouseMemberDto>,
    categories: List<CategoryDto>,
    onRenameHouse: (String, () -> Unit) -> Unit,
    onRegenerateInviteCode: () -> Unit,
    onRemoveMember: (String) -> Unit,
    onAddCategory: (String, String) -> Unit,
    onDeleteCategory: (String) -> Unit
) {
    if (activeHouse == null) return
    val context = LocalContext.current
    val palette = LocalGrimoirePalette.current

    var tab by remember(open) { mutableStateOf("invite") }
    var newHouseName by remember(open) { mutableStateOf("") }
    var renaming by remember(open) { mutableStateOf(false) }
    var newCatEmoji by remember(open) { mutableStateOf("📦") }
    var newCatName by remember(open) { mutableStateOf("") }

    val isOwner = activeHouse.myRole == "owner"

    fun shareInvite() {
        val code = activeHouse.inviteCode.orEmpty()
        val message = Defaults.buildInviteMessage(activeHouse.name, code)
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Convite — ${activeHouse.name}")
            putExtra(Intent.EXTRA_TEXT, message)
        }
        runCatching {
            context.startActivity(Intent.createChooser(sendIntent, "Compartilhar convite"))
        }.onFailure {
            copyTextToClipboard(context, message)
        }
    }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "Configurações · ${activeHouse.name}"
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Abas: Convite | Membros | Categorias
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
                    listOf(
                        "invite" to "Convite",
                        "members" to "Membros (${members.size})",
                        "categories" to "Categorias"
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
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            when (tab) {
                "invite" -> {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = palette.modalSurface,
                            border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "CÓDIGO DE CONVITE",
                                    color = GrimoireColors.Gold.Light,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.5.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = activeHouse.inviteCode ?: "------",
                                    color = palette.modalText,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 32.sp,
                                    letterSpacing = 5.sp
                                )
                            }
                        }

                        Button(
                            onClick = ::shareInvite,
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Compartilhar convite", color = Color.White, fontWeight = FontWeight.SemiBold)
                        }

                        if (isOwner) {
                            TextButton(onClick = onRegenerateInviteCode) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Gerar novo código", fontSize = 12.sp)
                            }

                            HorizontalDivider(color = palette.modalBorder)

                            OutlinedTextField(
                                value = newHouseName,
                                onValueChange = { if (it.length <= 60) newHouseName = it },
                                label = { Text("Renomear caldeirão") },
                                placeholder = { Text(activeHouse.name) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedButton(
                                onClick = {
                                    val clean = newHouseName.trim()
                                    if (clean.isEmpty()) return@OutlinedButton
                                    renaming = true
                                    onRenameHouse(clean) {
                                        renaming = false
                                        newHouseName = ""
                                    }
                                },
                                enabled = newHouseName.trim().isNotEmpty() && !renaming,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Salvar nome")
                            }
                        }
                    }
                }

                "members" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 320.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (members.isEmpty()) {
                            Text(
                                text = "Nenhum membro ainda.",
                                color = palette.modalMuted,
                                fontSize = 13.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 24.dp)
                            )
                        } else {
                            members.forEach { member ->
                                val isMe = member.userId == currentUserId
                                val isMemberOwner = member.role == "owner"
                                val prof = member.profiles

                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = palette.modalSurface,
                                    border = BorderStroke(1.dp, palette.modalBorder),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        AvatarComposable(
                                            name = prof?.fullName ?: prof?.email,
                                            imageUrl = prof?.avatarUrl,
                                            size = 36.dp
                                        )
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = buildString {
                                                    append(prof?.fullName ?: prof?.email ?: "Membro")
                                                    if (isMe) append(" (você)")
                                                },
                                                color = palette.modalText,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            if (!prof?.email.isNullOrBlank()) {
                                                Text(
                                                    text = prof?.email.orEmpty(),
                                                    color = palette.modalMuted,
                                                    fontSize = 11.sp,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                        }
                                        if (isMemberOwner) {
                                            Icon(
                                                imageVector = Icons.Default.WorkspacePremium,
                                                contentDescription = "Dono",
                                                tint = GrimoireColors.Gold.Amber,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        if (isOwner && !isMe && !isMemberOwner) {
                                            IconButton(
                                                onClick = { onRemoveMember(member.id) },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.PersonRemove,
                                                    contentDescription = "Remover membro",
                                                    tint = Color(0xFFEF4444),
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "categories" -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 240.dp)
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            categories.forEach { cat ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = palette.modalSurface,
                                    border = BorderStroke(1.dp, palette.modalBorder),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(cat.emoji, fontSize = 18.sp)
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(
                                            text = cat.name,
                                            color = palette.modalText,
                                            fontSize = 14.sp,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (isOwner) {
                                            IconButton(
                                                onClick = { onDeleteCategory(cat.id) },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Delete,
                                                    contentDescription = "Excluir categoria",
                                                    tint = Color(0xFFEF4444),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        HorizontalDivider(color = palette.modalBorder)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = newCatEmoji,
                                onValueChange = { if (it.length <= 4) newCatEmoji = it },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.width(64.dp)
                            )
                            OutlinedTextField(
                                value = newCatName,
                                onValueChange = { if (it.length <= 40) newCatName = it },
                                placeholder = { Text("Nova categoria...", fontSize = 13.sp) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f)
                            )
                            Button(
                                onClick = {
                                    val clean = newCatName.trim()
                                    if (clean.isNotEmpty()) {
                                        onAddCategory(clean, newCatEmoji.ifBlank { "📦" })
                                        newCatName = ""
                                        newCatEmoji = "📦"
                                    }
                                },
                                enabled = newCatName.trim().isNotEmpty(),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                            ) {
                                Text("+", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/house/MarketModal.jsx`.
 */
@Composable
fun MarketModal(
    open: Boolean,
    onClose: () -> Unit,
    items: List<InventoryItem>,
    categories: List<CategoryDto>,
    onSetStatus: (String, ItemStatus) -> Unit,
    onRestockAll: (List<InventoryItem>) -> Unit
) {
    val context = LocalContext.current
    val palette = LocalGrimoirePalette.current
    var checkedIds by remember(open) { mutableStateOf(setOf<String>()) }

    val needed = remember(items) {
        items
            .filter { it.status == ItemStatus.RUNNING_LOW || it.status == ItemStatus.OUT_OF_STOCK }
            .sortedWith { a, b ->
                when {
                    a.status == ItemStatus.OUT_OF_STOCK && b.status != ItemStatus.OUT_OF_STOCK -> -1
                    b.status == ItemStatus.OUT_OF_STOCK && a.status != ItemStatus.OUT_OF_STOCK -> 1
                    else -> a.name.compareTo(b.name, ignoreCase = true)
                }
            }
    }

    val grouped = remember(needed, categories) {
        val map = linkedMapOf<String, Pair<String, MutableList<InventoryItem>>>()
        needed.forEach { item ->
            val key = item.categoryId ?: "__none__"
            val label = item.category?.let { "${it.emoji} ${it.name}" } ?: "📦 Sem categoria"
            map.getOrPut(key) { label to mutableListOf() }.second.add(item)
        }
        map.entries.sortedBy { (key, _) ->
            categories.firstOrNull { it.id == key }?.sortOrder ?: 999
        }
    }

    fun shareShoppingList() {
        val lines = grouped.flatMap { (_, pair) ->
            val (label, groupItems) = pair
            listOf("\n$label") + groupItems.map { i ->
                val qtyPart = i.qtyValue?.let { " (${FormatUtils.formatQuantity(it)} ${i.qtyUnit})" }.orEmpty()
                val brandPart = i.brand?.takeIf { it.isNotBlank() }?.let { " · $it" }.orEmpty()
                val mark = if (checkedIds.contains(i.id)) "✅" else "☐"
                "  $mark ${i.name}$brandPart$qtyPart"
            }
        }
        val text = "🛒 Lista de Compras — Caldeirão de Gaia\n${lines.joinToString("\n")}"
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "Lista de Compras")
            putExtra(Intent.EXTRA_TEXT, text)
        }
        runCatching {
            context.startActivity(Intent.createChooser(sendIntent, "Partilhar lista"))
        }.onFailure {
            copyTextToClipboard(context, text)
        }
    }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "🛒 Modo Mercado"
    ) {
        if (needed.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("✨", fontSize = 36.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Tudo em ordem! Nenhum item a repor.",
                    color = palette.modalMuted,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = buildString {
                            append("${needed.size} itens a comprar")
                            if (checkedIds.isNotEmpty()) append(" · ${checkedIds.size} no carrinho")
                        },
                        color = palette.modalMuted,
                        fontSize = 13.sp
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        IconButton(onClick = ::shareShoppingList, modifier = Modifier.size(34.dp)) {
                            Icon(Icons.Default.Share, contentDescription = "Partilhar lista", tint = palette.modalText, modifier = Modifier.size(18.dp))
                        }
                        IconButton(
                            onClick = {
                                val unchecked = needed.filterNot { checkedIds.contains(it.id) }
                                onRestockAll(unchecked)
                                checkedIds = needed.map { it.id }.toSet()
                            },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Icon(
                                Icons.Default.DoneAll,
                                contentDescription = "Repor todos",
                                tint = GrimoireColors.Gems.InStock.Mid,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    grouped.forEach { (_, pair) ->
                        val (label, groupItems) = pair
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = label.uppercase(),
                                color = GrimoireColors.Gold.Light,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )

                            groupItems.forEach { item ->
                                val isChecked = checkedIds.contains(item.id)
                                val borderCol = when {
                                    isChecked -> GrimoireColors.Gems.InStock.Mid.copy(alpha = 0.5f)
                                    item.status == ItemStatus.OUT_OF_STOCK -> Color(0xFFEF4444).copy(alpha = 0.6f)
                                    else -> GrimoireColors.Gems.RunningLow.Mid.copy(alpha = 0.6f)
                                }

                                Surface(
                                    onClick = {
                                        checkedIds = if (isChecked) {
                                            checkedIds - item.id
                                        } else {
                                            onSetStatus(item.id, ItemStatus.IN_STOCK)
                                            checkedIds + item.id
                                        }
                                    },
                                    shape = RoundedCornerShape(14.dp),
                                    color = palette.modalSurface,
                                    border = BorderStroke(1.dp, borderCol),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(20.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    if (isChecked) GrimoireColors.Gems.InStock.Mid else Color.Transparent
                                                )
                                                .border(
                                                    2.dp,
                                                    if (isChecked) GrimoireColors.Gems.InStock.Mid else palette.modalMuted,
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (isChecked) {
                                                Icon(
                                                    Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(12.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.width(10.dp))

                                        Box(
                                            modifier = Modifier
                                                .size(34.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(palette.modalBg),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (!item.imageUrl.isNullOrBlank()) {
                                                AsyncImage(
                                                    model = item.imageUrl,
                                                    contentDescription = item.name,
                                                    contentScale = ContentScale.Fit,
                                                    modifier = Modifier.size(30.dp)
                                                )
                                            } else {
                                                AlchemicalIllustration(
                                                    categoryName = item.category?.name,
                                                    itemName = item.name,
                                                    modifier = Modifier.size(30.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.width(10.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = buildString {
                                                    append(item.name)
                                                    if (!item.brand.isNullOrBlank()) append(" · ${item.brand}")
                                                },
                                                color = if (isChecked) palette.modalMuted else palette.modalText,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                textDecoration = if (isChecked) TextDecoration.LineThrough else TextDecoration.None
                                            )
                                            if (item.qtyValue != null) {
                                                Text(
                                                    text = "${FormatUtils.formatQuantity(item.qtyValue)} ${item.qtyUnit}",
                                                    color = palette.modalMuted,
                                                    fontSize = 11.sp
                                                )
                                            }
                                        }

                                        Surface(
                                            shape = CircleShape,
                                            color = if (item.status == ItemStatus.OUT_OF_STOCK) {
                                                Color(0xFF7F1D1D).copy(alpha = 0.25f)
                                            } else {
                                                Color(0xFF78350F).copy(alpha = 0.25f)
                                            }
                                        ) {
                                            Text(
                                                text = item.status.label,
                                                color = if (item.status == ItemStatus.OUT_OF_STOCK) {
                                                    Color(0xFFF87171)
                                                } else {
                                                    GrimoireColors.Gems.RunningLow.Mid
                                                },
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
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

/**
 * Equivalente nativo em Jetpack Compose de `src/components/house/ActivityLog.jsx`.
 */
@Composable
fun ActivityLogModal(
    open: Boolean,
    onClose: () -> Unit,
    entries: List<ActivityLogEntryDto>,
    loading: Boolean,
    hasMore: Boolean,
    onLoadMore: () -> Unit
) {
    val palette = LocalGrimoirePalette.current

    val grouped = remember(entries) {
        val map = linkedMapOf<String, MutableList<ActivityLogEntryDto>>()
        entries.forEach { entry ->
            val dayKey = FormatUtils.formatDayHeader(entry.createdAt)
            map.getOrPut(dayKey) { mutableListOf() }.add(entry)
        }
        map
    }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "📜 Histórico do Caldeirão"
    ) {
        when {
            loading && entries.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 36.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = GrimoireColors.Gold.Light, modifier = Modifier.size(26.dp))
                }
            }

            entries.isEmpty() -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 36.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📋", fontSize = 32.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Nenhuma atividade registrada ainda.",
                        color = palette.modalMuted,
                        fontSize = 13.sp
                    )
                }
            }

            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 460.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    grouped.forEach { (dateLabel, dayEntries) ->
                        Text(
                            text = dateLabel,
                            color = GrimoireColors.Gold.Light,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )

                        dayEntries.forEach { entry ->
                            ActivityEntryCard(entry = entry)
                        }
                    }

                    if (hasMore) {
                        OutlinedButton(
                            onClick = onLoadMore,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text("Carregar mais", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActivityEntryCard(entry: ActivityLogEntryDto) {
    val palette = LocalGrimoirePalette.current
    val profileName = entry.user?.fullName ?: entry.user?.email?.substringBefore("@") ?: "Alguém"
    val itemName = entry.itemName ?: "item"

    val statusLabels = mapOf(
        "in_stock" to "✅ Em Estoque",
        "running_low" to "⚠️ Acabando",
        "out_of_stock" to "❌ Em Falta"
    )

    val icon = when (entry.action) {
        "item_added" -> "➕"
        "item_deleted" -> "🗑️"
        "status_changed" -> "🔄"
        "market_completed" -> "🛒"
        "member_joined" -> "👋"
        "member_left" -> "👤"
        else -> "✏️"
    }

    val description = buildAnnotatedString {
        withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append(profileName) }
        when (entry.action) {
            "item_added" -> {
                append(" adicionou ")
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("\"$itemName\"") }
            }
            "item_deleted" -> {
                append(" removeu ")
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("\"$itemName\"") }
            }
            "status_changed" -> {
                append(" alterou ")
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("\"$itemName\"") }
                append(" de ")
                append(statusLabels[entry.oldValue] ?: entry.oldValue.orEmpty())
                append(" para ")
                append(statusLabels[entry.newValue] ?: entry.newValue.orEmpty())
            }
            "market_completed" -> append(" concluiu a lista de compras")
            "member_joined" -> append(" entrou no caldeirão")
            "member_left" -> append(" saiu do caldeirão")
            else -> {
                append(" editou ")
                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("\"$itemName\"") }
            }
        }
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = palette.modalSurface,
        border = BorderStroke(1.dp, palette.modalBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.Top
        ) {
            AvatarComposable(name = profileName, size = 32.dp)
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = description,
                    color = palette.modalText,
                    fontSize = 13.sp,
                    lineHeight = 17.sp
                )
                Text(
                    text = FormatUtils.timeAgo(entry.createdAt),
                    color = palette.modalMuted,
                    fontSize = 11.sp
                )
            }
            Spacer(modifier = Modifier.width(6.dp))
            Text(icon, fontSize = 16.sp)
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/user/ProfileModal.jsx`.
 */
@Composable
fun ProfileModal(
    open: Boolean,
    onClose: () -> Unit,
    profile: ProfileDto?,
    email: String?,
    onSaveName: (String, () -> Unit) -> Unit,
    onUploadAvatar: (Context, Uri, () -> Unit) -> Unit,
    onChangePassword: (currentPwd: String, newPwd: String, onResult: (String?) -> Unit) -> Unit
) {
    val context = LocalContext.current
    val palette = LocalGrimoirePalette.current

    var tab by remember(open) { mutableStateOf("info") }
    var displayName by remember(open, profile) { mutableStateOf(profile?.fullName.orEmpty()) }
    var savingInfo by remember(open) { mutableStateOf(false) }
    var avatarLoading by remember(open) { mutableStateOf(false) }

    var currentPwd by remember(open) { mutableStateOf("") }
    var newPwd by remember(open) { mutableStateOf("") }
    var confirmPwd by remember(open) { mutableStateOf("") }
    var showPwd by remember(open) { mutableStateOf(false) }
    var savingPwd by remember(open) { mutableStateOf(false) }
    var pwdError by remember(open) { mutableStateOf<String?>(null) }

    val avatarPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            avatarLoading = true
            onUploadAvatar(context, uri) {
                avatarLoading = false
            }
        }
    }

    GrimoireModalDialog(
        open = open,
        onClose = onClose,
        title = "Meu perfil"
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
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
                    listOf("info" to "Informações", "password" to "Senha").forEach { (key, label) ->
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
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (tab == "info") {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(contentAlignment = Alignment.BottomEnd) {
                        AvatarComposable(
                            name = profile?.fullName ?: email ?: "?",
                            imageUrl = profile?.avatarUrl,
                            size = 76.dp
                        )
                        Surface(
                            onClick = {
                                if (!avatarLoading) {
                                    avatarPicker.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                }
                            },
                            shape = CircleShape,
                            color = GrimoireColors.PrimaryPurple,
                            modifier = Modifier.size(28.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (avatarLoading) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        strokeWidth = 2.dp,
                                        modifier = Modifier.size(14.dp)
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = "Alterar foto",
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = displayName,
                        onValueChange = { if (it.length <= 60) displayName = it },
                        label = { Text("Nome de exibição") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = email.orEmpty(),
                        onValueChange = {},
                        enabled = false,
                        label = { Text("E-mail (verificado)") },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            val clean = displayName.trim()
                            if (clean.isEmpty()) return@Button
                            savingInfo = true
                            onSaveName(clean) {
                                savingInfo = false
                            }
                        },
                        enabled = !savingInfo && displayName.trim().isNotEmpty() && displayName.trim() != profile?.fullName,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp)
                    ) {
                        Text("Salvar alterações", color = Color.White)
                    }
                }
            } else {
                val transformation = if (showPwd) VisualTransformation.None else PasswordVisualTransformation()

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = currentPwd,
                        onValueChange = { currentPwd = it; pwdError = null },
                        label = { Text("Senha atual") },
                        visualTransformation = transformation,
                        trailingIcon = {
                            IconButton(onClick = { showPwd = !showPwd }) {
                                Icon(
                                    imageVector = if (showPwd) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null
                                )
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newPwd,
                        onValueChange = { newPwd = it; pwdError = null },
                        label = { Text("Nova senha (mín. 6 caracteres)") },
                        visualTransformation = transformation,
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = confirmPwd,
                        onValueChange = { confirmPwd = it; pwdError = null },
                        label = { Text("Confirmar nova senha") },
                        visualTransformation = transformation,
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (!pwdError.isNullOrBlank()) {
                        Text(
                            text = pwdError!!,
                            color = Color(0xFFEF4444),
                            fontSize = 12.sp
                        )
                    }

                    Button(
                        onClick = {
                            if (newPwd.length < 6) {
                                pwdError = "Mínimo 6 caracteres."
                                return@Button
                            }
                            if (newPwd != confirmPwd) {
                                pwdError = "As senhas não coincidem."
                                return@Button
                            }
                            savingPwd = true
                            onChangePassword(currentPwd, newPwd) { err ->
                                savingPwd = false
                                if (err != null) {
                                    pwdError = err
                                } else {
                                    currentPwd = ""
                                    newPwd = ""
                                    confirmPwd = ""
                                }
                            }
                        },
                        enabled = !savingPwd && currentPwd.isNotBlank() && newPwd.isNotBlank() && confirmPwd.isNotBlank(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp)
                    ) {
                        Text("Alterar senha", color = Color.White)
                    }
                }
            }
        }
    }
}

private fun copyTextToClipboard(context: Context, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    clipboard?.setPrimaryClip(ClipData.newPlainText("Caldeirão de Gaia", text))
}
