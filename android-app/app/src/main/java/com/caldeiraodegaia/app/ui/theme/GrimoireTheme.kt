package com.caldeiraodegaia.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class GrimoirePalette(
    val isDark: Boolean,
    val shellBgTop: Color,
    val shellBgBottom: Color,
    val frameBgTop: Color,
    val frameBgBottom: Color,
    val headerBg: Color,
    val headerPill: Color,
    val headerAlert: Color,
    val cardBgTop: Color,
    val cardBgBottom: Color,
    val medallionBg: Color,
    val medallionActiveBg: Color,
    val plaqueBg: Color,
    val plaqueActiveBg: Color,
    val statusBarBg: Color,
    val statusBtnActiveBg: Color,
    val inputBg: Color,
    val textPrimary: Color,
    val textMuted: Color,
    val titleGold: Color,
    val modalBg: Color,
    val modalSurface: Color,
    val modalText: Color,
    val modalMuted: Color,
    val modalBorder: Color
)

private val DarkGrimoirePalette = GrimoirePalette(
    isDark = true,
    shellBgTop = Color(0xFF130921),
    shellBgBottom = Color(0xFF0B0514),
    frameBgTop = Color(0xFF1D1033),
    frameBgBottom = Color(0xFF130A22),
    headerBg = Color(0xEE160B28),
    headerPill = Color(0xFF24133D),
    headerAlert = Color(0xFF422014),
    cardBgTop = Color(0xFF281744),
    cardBgBottom = Color(0xFF1A0E2E),
    medallionBg = Color(0xFF24143D),
    medallionActiveBg = Color(0xFF3E1F69),
    plaqueBg = Color(0xFF211238),
    plaqueActiveBg = Color(0xFF391C61),
    statusBarBg = Color(0xFF1E1033),
    statusBtnActiveBg = Color(0xFF381E5E),
    inputBg = Color(0xFF1A0E2B),
    textPrimary = Color(0xFFFDF6E2),
    textMuted = Color(0xFFB9A6D4),
    titleGold = GrimoireColors.Gold.Bright,
    modalBg = Color(0xFF1E1132),
    modalSurface = Color(0xFF2A1845),
    modalText = Color(0xFFFDF6E2),
    modalMuted = Color(0xFFBBA8D6),
    modalBorder = Color(0xFF4A3170)
)

private val LightGrimoirePalette = GrimoirePalette(
    isDark = false,
    shellBgTop = Color(0xFFF6EFE0),
    shellBgBottom = Color(0xFFEADBC0),
    frameBgTop = Color(0xFFFDF8EE),
    frameBgBottom = Color(0xFFF3E7CE),
    headerBg = Color(0xF2281642),
    headerPill = Color(0xFF2E1A4B),
    headerAlert = Color(0xFF4D2512),
    cardBgTop = Color(0xFFFFFCF5),
    cardBgBottom = Color(0xFFF4E6C8),
    medallionBg = Color(0xFFF5E6C4),
    medallionActiveBg = Color(0xFFEAD096),
    plaqueBg = Color(0xFFFAF1DC),
    plaqueActiveBg = Color(0xFFEED7A1),
    statusBarBg = Color(0xFF271540),
    statusBtnActiveBg = Color(0xFF42246B),
    inputBg = Color(0xFFFFFDF8),
    textPrimary = Color(0xFF2B1B10),
    textMuted = Color(0xFF6E563A),
    titleGold = Color(0xFF8A5E10),
    modalBg = Color(0xFFFFFFFF),
    modalSurface = Color(0xFFF9FAFB),
    modalText = Color(0xFF111827),
    modalMuted = Color(0xFF6B7280),
    modalBorder = Color(0xFFE5E7EB)
)

val LocalGrimoirePalette = staticCompositionLocalOf { DarkGrimoirePalette }

private val DarkMaterialScheme = darkColorScheme(
    primary = GrimoireColors.Gold.Light,
    onPrimary = Color(0xFF1F1200),
    secondary = GrimoireColors.Orb.CoreMid,
    background = DarkGrimoirePalette.shellBgTop,
    surface = DarkGrimoirePalette.frameBgTop,
    onBackground = DarkGrimoirePalette.textPrimary,
    onSurface = DarkGrimoirePalette.textPrimary
)

private val LightMaterialScheme = lightColorScheme(
    primary = GrimoireColors.PrimaryPurple,
    onPrimary = Color.White,
    secondary = GrimoireColors.Gold.Dark,
    background = LightGrimoirePalette.shellBgTop,
    surface = LightGrimoirePalette.frameBgTop,
    onBackground = LightGrimoirePalette.textPrimary,
    onSurface = LightGrimoirePalette.textPrimary
)

@Composable
fun CaldeiraoTheme(
    isDark: Boolean = true,
    content: @Composable () -> Unit
) {
    val palette = if (isDark) DarkGrimoirePalette else LightGrimoirePalette
    val materialScheme = if (isDark) DarkMaterialScheme else LightMaterialScheme

    CompositionLocalProvider(LocalGrimoirePalette provides palette) {
        MaterialTheme(
            colorScheme = materialScheme,
            content = content
        )
    }
}
