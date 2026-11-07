package com.caldeiraodegaia.app.ui.components.layout

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.ManageAccounts
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caldeiraodegaia.app.data.model.HouseDto
import com.caldeiraodegaia.app.data.model.ProfileDto
import com.caldeiraodegaia.app.ui.components.common.AvatarComposable
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette

/**
 * Equivalente nativo em Jetpack Compose de `src/components/layout/Header.jsx`
 * e `src/components/layout/HouseSwitcher.jsx`.
 */
@Composable
fun HeaderComposable(
    houses: List<HouseDto>,
    activeHouse: HouseDto?,
    profile: ProfileDto?,
    isDark: Boolean,
    needsMarket: Int,
    onSelectHouse: (HouseDto) -> Unit,
    onCreateHouse: () -> Unit,
    onJoinHouse: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenMarket: () -> Unit,
    onOpenReceiptScanner: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenProfile: () -> Unit,
    onToggleTheme: () -> Unit,
    onSignOut: () -> Unit
) {
    val palette = LocalGrimoirePalette.current
    var houseMenuOpen by remember { mutableStateOf(false) }
    var userMenuOpen by remember { mutableStateOf(false) }

    Surface(
        color = palette.headerBg,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(58.dp)
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Seletor de Caldeirão (HouseSwitcher)
                Box {
                    Surface(
                        onClick = { houseMenuOpen = true },
                        shape = CircleShape,
                        color = palette.headerPill,
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.65f)),
                        modifier = Modifier.widthIn(max = 185.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Home,
                                contentDescription = null,
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = activeHouse?.name ?: "Caldeirão",
                                color = GrimoireColors.Gold.Cream,
                                fontFamily = FontFamily.Serif,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = houseMenuOpen,
                        onDismissRequest = { houseMenuOpen = false }
                    ) {
                        houses.forEach { house ->
                            val isSelected = house.id == activeHouse?.id
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = house.name,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (house.myRole == "owner") {
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = "dono",
                                                fontSize = 11.sp,
                                                color = GrimoireColors.Gold.Light
                                            )
                                        }
                                    }
                                },
                                leadingIcon = {
                                    Icon(
                                        Icons.Default.Home,
                                        contentDescription = null,
                                        tint = GrimoireColors.Gold.Base
                                    )
                                },
                                onClick = {
                                    houseMenuOpen = false
                                    onSelectHouse(house)
                                }
                            )
                        }

                        HorizontalDivider()
                        DropdownMenuItem(
                            text = { Text("Configurações da casa") },
                            leadingIcon = {
                                Icon(Icons.Default.Settings, contentDescription = null, tint = GrimoireColors.Gold.Base)
                            },
                            onClick = {
                                houseMenuOpen = false
                                onOpenSettings()
                            }
                        )
                        HorizontalDivider()
                        DropdownMenuItem(
                            text = { Text("Novo caldeirão") },
                            leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) },
                            onClick = {
                                houseMenuOpen = false
                                onCreateHouse()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Entrar com código") },
                            leadingIcon = { Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null) },
                            onClick = {
                                houseMenuOpen = false
                                onJoinHouse()
                            }
                        )
                    }
                }

                // Ações à direita: Nota Fiscal, Modo Mercado, Tema, Perfil
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Botão Nota Fiscal
                    Surface(
                        onClick = onOpenReceiptScanner,
                        shape = CircleShape,
                        color = palette.headerPill,
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.55f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.ReceiptLong,
                                contentDescription = "Ler Nota Fiscal",
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Nota",
                                color = GrimoireColors.Gold.Bright,
                                fontFamily = FontFamily.Serif,
                                fontSize = 12.sp
                            )
                        }
                    }

                    // Botão Modo Mercado
                    Surface(
                        onClick = onOpenMarket,
                        shape = CircleShape,
                        color = if (needsMarket > 0) palette.headerAlert else palette.headerPill,
                        border = BorderStroke(
                            1.dp,
                            if (needsMarket > 0) GrimoireColors.Gold.Light else GrimoireColors.Gold.Base.copy(alpha = 0.45f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.ShoppingCart,
                                contentDescription = "Modo Mercado",
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(16.dp)
                            )
                            if (needsMarket > 0) {
                                Spacer(modifier = Modifier.width(5.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(Color(0xFFD97706))
                                        .padding(horizontal = 6.dp, vertical = 1.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (needsMarket > 99) "99+" else needsMarket.toString(),
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    // Botão Alternar Tema
                    Surface(
                        onClick = onToggleTheme,
                        shape = CircleShape,
                        color = palette.headerPill,
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.45f)),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Alternar tema",
                                tint = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    // Menu de Utilizador / Avatar
                    Box {
                        AvatarComposable(
                            name = profile?.fullName ?: profile?.email ?: "?",
                            imageUrl = profile?.avatarUrl,
                            size = 34.dp,
                            modifier = Modifier
                                .border(1.5.dp, GrimoireColors.Gold.Base, CircleShape)
                                .clickable { userMenuOpen = true }
                        )

                        DropdownMenu(
                            expanded = userMenuOpen,
                            onDismissRequest = { userMenuOpen = false }
                        ) {
                            Column(
                                modifier = Modifier
                                    .padding(horizontal = 14.dp, vertical = 8.dp)
                                    .widthIn(min = 180.dp)
                            ) {
                                Text(
                                    text = profile?.fullName ?: "Sem nome",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp
                                )
                                if (!profile?.email.isNullOrBlank()) {
                                    Text(
                                        text = profile?.email.orEmpty(),
                                        fontSize = 11.sp,
                                        color = palette.modalMuted
                                    )
                                }
                            }
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text("Histórico") },
                                leadingIcon = { Icon(Icons.Default.History, contentDescription = null) },
                                onClick = {
                                    userMenuOpen = false
                                    onOpenHistory()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Editar perfil") },
                                leadingIcon = { Icon(Icons.Default.ManageAccounts, contentDescription = null) },
                                onClick = {
                                    userMenuOpen = false
                                    onOpenProfile()
                                }
                            )
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text("Sair", color = Color(0xFFEF4444)) },
                                leadingIcon = {
                                    Icon(
                                        Icons.AutoMirrored.Filled.ExitToApp,
                                        contentDescription = null,
                                        tint = Color(0xFFEF4444)
                                    )
                                },
                                onClick = {
                                    userMenuOpen = false
                                    onSignOut()
                                }
                            )
                        }
                    }
                }
            }

            HorizontalDivider(
                thickness = 1.dp,
                color = GrimoireColors.Gold.Base.copy(alpha = 0.35f)
            )
        }
    }
}
