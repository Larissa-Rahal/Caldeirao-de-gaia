package com.caldeiraodegaia.app.ui.components.ornaments

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caldeiraodegaia.app.core.util.Defaults
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.ui.theme.GrimoireColors

/**
 * Emblema do Caldeirão Místico borbulhante — tradução para Compose Canvas de `CauldronEmblem` em `GrimoireOrnaments.jsx`.
 */
@Composable
fun CauldronEmblem(
    modifier: Modifier = Modifier.size(84.dp)
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val sx = w / 140f
        val sy = h / 140f

        // Aura mística
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    GrimoireColors.Gems.OutOfStock.Mid.copy(alpha = 0.45f),
                    GrimoireColors.Cauldron.PotionStart.copy(alpha = 0.18f),
                    Color.Transparent
                ),
                center = Offset(70f * sx, 64f * sy),
                radius = 64f * sx
            ),
            radius = 64f * sx,
            center = Offset(70f * sx, 70f * sy)
        )

        // Fumaça mágica violeta central
        val smokePath = Path().apply {
            moveTo(58f * sx, 54f * sy)
            cubicTo(46f * sx, 42f * sy, 52f * sx, 26f * sy, 65f * sx, 20f * sy)
            cubicTo(74f * sx, 15f * sy, 68f * sx, 6f * sy, 75f * sx, 4f * sy)
            cubicTo(84f * sx, 10f * sy, 78f * sx, 22f * sy, 86f * sx, 28f * sy)
            cubicTo(96f * sx, 35f * sy, 90f * sx, 48f * sy, 80f * sx, 54f * sy)
            close()
        }
        drawPath(
            path = smokePath,
            brush = Brush.verticalGradient(
                colors = listOf(
                    GrimoireColors.Cauldron.SmokePink.copy(alpha = 0.85f),
                    GrimoireColors.Cauldron.SmokePurple.copy(alpha = 0.65f),
                    GrimoireColors.Cauldron.PotionStart.copy(alpha = 0.2f)
                ),
                startY = 8f * sy,
                endY = 62f * sy
            )
        )

        // Bolhas e faíscas
        drawCircle(GrimoireColors.Cauldron.PotionMid, radius = 3f * sx, center = Offset(56f * sx, 46f * sy))
        drawCircle(GrimoireColors.Cauldron.PotionStart, radius = 4f * sx, center = Offset(72f * sx, 40f * sy))
        drawCircle(GrimoireColors.Cauldron.PotionShine, radius = 2.5f * sx, center = Offset(84f * sx, 48f * sy))
        drawCircle(GrimoireColors.Cauldron.SparkYellow, radius = 2.5f * sx, center = Offset(36f * sx, 36f * sy))
        drawCircle(GrimoireColors.Cauldron.SparkYellow, radius = 2.2f * sx, center = Offset(104f * sx, 29f * sy))

        // Argolas laterais de ouro
        val goldBrush = Brush.linearGradient(
            colors = listOf(GrimoireColors.Gold.Dark, GrimoireColors.Gold.Soft, GrimoireColors.Gold.Deep)
        )
        drawCircle(
            brush = goldBrush,
            radius = 8f * sx,
            center = Offset(28f * sx, 78f * sy),
            style = Stroke(width = 3.5f * sx)
        )
        drawCircle(
            brush = goldBrush,
            radius = 8f * sx,
            center = Offset(112f * sx, 78f * sy),
            style = Stroke(width = 3.5f * sx)
        )

        // Pés do caldeirão
        drawRoundRect(
            brush = goldBrush,
            topLeft = Offset(39f * sx, 114f * sy),
            size = Size(10f * sx, 15f * sy),
            cornerRadius = CornerRadius(4f * sx)
        )
        drawRoundRect(
            brush = goldBrush,
            topLeft = Offset(91f * sx, 114f * sy),
            size = Size(10f * sx, 15f * sy),
            cornerRadius = CornerRadius(4f * sx)
        )

        // Corpo do caldeirão
        val bodyPath = Path().apply {
            moveTo(34f * sx, 58f * sy)
            cubicTo(24f * sx, 74f * sy, 26f * sx, 106f * sy, 48f * sx, 118f * sy)
            cubicTo(60f * sx, 124f * sy, 80f * sx, 124f * sy, 92f * sx, 118f * sy)
            cubicTo(114f * sx, 106f * sy, 116f * sx, 74f * sy, 106f * sx, 58f * sy)
            close()
        }
        drawPath(
            path = bodyPath,
            brush = Brush.verticalGradient(
                colors = listOf(
                    GrimoireColors.Cauldron.BodyTop,
                    GrimoireColors.Cauldron.BodyMid,
                    GrimoireColors.Cauldron.BodyBot
                ),
                startY = 56f * sy,
                endY = 124f * sy
            )
        )
        drawPath(
            path = bodyPath,
            color = GrimoireColors.Cauldron.Stroke,
            style = Stroke(width = 2f * sx)
        )

        // Borda superior do caldeirão
        drawOval(
            color = GrimoireColors.Cauldron.RimDark,
            topLeft = Offset(31f * sx, 48f * sy),
            size = Size(78f * sx, 18f * sy)
        )
        drawOval(
            brush = goldBrush,
            topLeft = Offset(31f * sx, 48f * sy),
            size = Size(78f * sx, 18f * sy),
            style = Stroke(width = 3f * sx)
        )

        // Poção verde brilhante
        drawOval(
            brush = Brush.horizontalGradient(
                colors = listOf(
                    GrimoireColors.Cauldron.PotionStart,
                    GrimoireColors.Cauldron.PotionMid,
                    GrimoireColors.Cauldron.PotionEnd
                )
            ),
            topLeft = Offset(36f * sx, 50.5f * sy),
            size = Size(68f * sx, 13f * sy)
        )
        drawOval(
            color = GrimoireColors.Cauldron.PotionShine.copy(alpha = 0.65f),
            topLeft = Offset(50f * sx, 53.5f * sy),
            size = Size(28f * sx, 5f * sy)
        )
    }
}

/**
 * Gema facetada de status — tradução de `StatusGem` em `GrimoireOrnaments.jsx`.
 */
@Composable
fun StatusGem(
    status: ItemStatus,
    size: Dp = 16.dp,
    modifier: Modifier = Modifier
) {
    val (outer, mid, light, shine) = when (status) {
        ItemStatus.IN_STOCK -> listOf(
            GrimoireColors.Gems.InStock.Outer,
            GrimoireColors.Gems.InStock.Mid,
            GrimoireColors.Gems.InStock.Light,
            GrimoireColors.Gems.InStock.Shine
        )
        ItemStatus.RUNNING_LOW -> listOf(
            GrimoireColors.Gems.RunningLow.Outer,
            GrimoireColors.Gems.RunningLow.Mid,
            GrimoireColors.Gems.RunningLow.Light,
            GrimoireColors.Gems.RunningLow.Shine
        )
        ItemStatus.OUT_OF_STOCK -> listOf(
            GrimoireColors.Gems.OutOfStock.Outer,
            GrimoireColors.Gems.OutOfStock.Mid,
            GrimoireColors.Gems.OutOfStock.Light,
            GrimoireColors.Gems.OutOfStock.Shine
        )
    }

    Canvas(modifier = modifier.size(size)) {
        val sx = this.size.width / 24f
        val sy = this.size.height / 24f

        fun poly(vararg pts: Pair<Float, Float>): Path = Path().apply {
            pts.forEachIndexed { idx, (x, y) ->
                if (idx == 0) moveTo(x * sx, y * sy) else lineTo(x * sx, y * sy)
            }
            close()
        }

        val outerPoly = poly(12f to 1f, 21f to 8f, 18f to 21f, 6f to 21f, 3f to 8f)
        drawPath(outerPoly, color = outer)
        drawPath(outerPoly, color = GrimoireColors.Gold.Amber, style = Stroke(width = 1.4f * sx))

        val midPoly = poly(12f to 2.5f, 19.5f to 8.5f, 17f to 19.5f, 7f to 19.5f, 4.5f to 8.5f)
        drawPath(midPoly, color = mid)

        val topFacet = poly(12f to 2.5f, 19.5f to 8.5f, 12f to 12f, 4.5f to 8.5f)
        drawPath(topFacet, color = light.copy(alpha = 0.75f))

        val shinePoly = poly(12f to 3.5f, 15f to 8f, 12f to 10f, 8.5f to 8f)
        drawPath(shinePoly, color = shine.copy(alpha = 0.9f))
    }
}

/**
 * Ornamento de canto dourado com ramos e folhas para a moldura do Grimório (`CornerVine`).
 */
@Composable
fun CornerVine(
    flipX: Boolean = false,
    flipY: Boolean = false,
    modifier: Modifier = Modifier.size(76.dp)
) {
    Canvas(modifier = modifier) {
        scale(
            scaleX = if (flipX) -1f else 1f,
            scaleY = if (flipY) -1f else 1f,
            pivot = Offset(size.width / 2f, size.height / 2f)
        ) {
            val sx = size.width / 180f
            val sy = size.height / 180f

            val framePath = Path().apply {
                moveTo(6f * sx, 165f * sy)
                lineTo(6f * sx, 16f * sy)
                quadraticTo(6f * sx, 6f * sy, 16f * sx, 6f * sy)
                lineTo(165f * sx, 6f * sy)
            }
            drawPath(
                path = framePath,
                color = GrimoireColors.Gold.Base.copy(alpha = 0.7f),
                style = Stroke(width = 2.2f * sx, cap = StrokeCap.Round)
            )

            val vinePath = Path().apply {
                moveTo(8f * sx, 118f * sy)
                cubicTo(14f * sx, 70f * sy, 32f * sx, 32f * sy, 118f * sx, 10f * sy)
            }
            drawPath(
                path = vinePath,
                color = GrimoireColors.Gold.Base,
                style = Stroke(width = 2.2f * sx, cap = StrokeCap.Round)
            )

            // Folhas botânicas
            drawOval(
                color = GrimoireColors.Foliage.Forest,
                topLeft = Offset(24f * sx, 28f * sy),
                size = Size(20f * sx, 12f * sy)
            )
            drawOval(
                color = GrimoireColors.Foliage.Dark,
                topLeft = Offset(60f * sx, 12f * sy),
                size = Size(22f * sx, 11f * sy)
            )
            drawCircle(
                color = GrimoireColors.Gold.Light.copy(alpha = 0.85f),
                radius = 5f * sx,
                center = Offset(32f * sx, 78f * sy)
            )
        }
    }
}

/**
 * Botão Flutuante de Orbe Mágica "+ Adicionar" (`AddOrbButton` em `GrimoireOrnaments.jsx`).
 */
@Composable
fun AddOrbButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    Box(
        modifier = modifier
            .size(92.dp)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val sx = w / 140f
            val sy = h / 140f
            val center = Offset(70f * sx, 74f * sy)

            val goldBrush = Brush.linearGradient(
                colors = listOf(
                    GrimoireColors.Gold.Bright,
                    GrimoireColors.Gold.Amber,
                    GrimoireColors.Gold.Bronze
                )
            )

            // Brilho externo
            drawCircle(
                color = GrimoireColors.Cauldron.SmokePurple.copy(alpha = 0.34f),
                radius = 54f * sx,
                center = center
            )

            // Argola superior do amuleto
            drawCircle(
                brush = goldBrush,
                radius = 7f * sx,
                center = Offset(70f * sx, 18f * sy),
                style = Stroke(width = 3.5f * sx)
            )

            // Moldura circular de ouro
            drawCircle(
                color = GrimoireColors.Orb.RingFill,
                radius = 46f * sx,
                center = center
            )
            drawCircle(
                brush = goldBrush,
                radius = 46f * sx,
                center = center,
                style = Stroke(width = 4.5f * sx)
            )

            // Esfera de cristal roxa
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        GrimoireColors.Orb.CoreLight,
                        GrimoireColors.Orb.CoreMid,
                        GrimoireColors.Orb.CoreDeep,
                        GrimoireColors.Orb.CoreDark
                    ),
                    center = Offset(55f * sx, 54f * sy),
                    radius = 52f * sx
                ),
                radius = 39f * sx,
                center = center
            )

            // Reflexo vítreo
            drawOval(
                color = Color.White.copy(alpha = 0.32f),
                topLeft = Offset(44f * sx, 46f * sy),
                size = Size(24f * sx, 12f * sy)
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 4.dp)
        ) {
            Text(
                text = "+",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Adicionar",
                color = GrimoireColors.Gold.Cream,
                fontSize = 11.sp,
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Desenha nativamente em Compose Canvas as ilustrações alquímicas procedurais de `getCategoryPlaceholder`
 * em `src/lib/defaults.js`.
 */
@Composable
fun AlchemicalIllustration(
    categoryName: String?,
    itemName: String?,
    modifier: Modifier = Modifier.size(72.dp)
) {
    val archetype = remember(categoryName, itemName) {
        Defaults.resolveArchetype(categoryName, itemName)
    }

    Canvas(modifier = modifier) {
        val sx = size.width / 120f
        val sy = size.height / 120f
        val center = Offset(60f * sx, 64f * sy)
        val c = GrimoireColors.Illustrations

        when (archetype) {
            Defaults.AlchemicalArchetype.MAGIC_JAR -> {
                drawGlow(center, 50f * sx, c.PotionMid)
                drawRoundRect(
                    color = c.GlassFill.copy(alpha = 0.35f),
                    topLeft = Offset(32f * sx, 44f * sy),
                    size = Size(56f * sx, 52f * sy),
                    cornerRadius = CornerRadius(14f * sx)
                )
                drawRoundRect(
                    color = c.PowderLight,
                    topLeft = Offset(35f * sx, 62f * sy),
                    size = Size(50f * sx, 31f * sy),
                    cornerRadius = CornerRadius(12f * sx)
                )
                drawOval(
                    color = c.AmberMid,
                    topLeft = Offset(34f * sx, 38f * sy),
                    size = Size(52f * sx, 12f * sy)
                )
                drawCircle(color = c.AmberBright, radius = 5.5f * sx, center = Offset(60f * sx, 32f * sy))
            }

            Defaults.AlchemicalArchetype.ELIXIR_FLASK_AMBER,
            Defaults.AlchemicalArchetype.ELIXIR_FLASK_LIME -> {
                val liquid = if (archetype == Defaults.AlchemicalArchetype.ELIXIR_FLASK_AMBER) c.AmberMid else c.LimeMid
                val top = if (archetype == Defaults.AlchemicalArchetype.ELIXIR_FLASK_AMBER) c.AmberPale else c.LimeLight
                drawGlow(center, 50f * sx, liquid)
                drawRoundRect(
                    color = c.AmberDeep,
                    topLeft = Offset(53f * sx, 18f * sy),
                    size = Size(14f * sx, 11f * sy),
                    cornerRadius = CornerRadius(3f * sx)
                )
                drawCircle(
                    color = c.LimePale.copy(alpha = 0.25f),
                    radius = 28f * sx,
                    center = Offset(60f * sx, 72f * sy)
                )
                drawCircle(
                    color = liquid,
                    radius = 24f * sx,
                    center = Offset(60f * sx, 74f * sy)
                )
                drawOval(
                    color = top,
                    topLeft = Offset(38f * sx, 60f * sy),
                    size = Size(44f * sx, 9f * sy)
                )
            }

            Defaults.AlchemicalArchetype.COFFEE_SACK -> {
                drawGlow(center, 50f * sx, c.AmberDark)
                drawRoundRect(
                    color = c.CoffeeBag,
                    topLeft = Offset(34f * sx, 46f * sy),
                    size = Size(52f * sx, 52f * sy),
                    cornerRadius = CornerRadius(10f * sx)
                )
                drawOval(
                    color = c.CoffeeDark,
                    topLeft = Offset(37f * sx, 40f * sy),
                    size = Size(46f * sx, 14f * sy)
                )
                drawOval(
                    color = c.CoffeeDark,
                    topLeft = Offset(52f * sx, 63f * sy),
                    size = Size(16f * sx, 22f * sy)
                )
            }

            Defaults.AlchemicalArchetype.BOTANICAL_HERBS -> {
                drawGlow(center, 50f * sx, c.EmeraldMid)
                drawLine(
                    color = c.AmberDark,
                    start = Offset(44f * sx, 96f * sy),
                    end = Offset(74f * sx, 24f * sy),
                    strokeWidth = 3f * sx,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = c.LimeDark,
                    start = Offset(72f * sx, 96f * sy),
                    end = Offset(44f * sx, 28f * sy),
                    strokeWidth = 3f * sx,
                    cap = StrokeCap.Round
                )
                drawOval(color = c.AmberBright, topLeft = Offset(52f * sx, 36f * sy), size = Size(12f * sx, 20f * sy))
                drawOval(color = c.LimeMid, topLeft = Offset(64f * sx, 50f * sy), size = Size(12f * sx, 20f * sy))
                drawOval(color = c.EmeraldLight, topLeft = Offset(42f * sx, 54f * sy), size = Size(12f * sx, 20f * sy))
            }

            Defaults.AlchemicalArchetype.CHEESE_WHEEL -> {
                drawGlow(center, 50f * sx, c.AmberBright)
                drawRoundRect(
                    color = c.AmberMid,
                    topLeft = Offset(28f * sx, 46f * sy),
                    size = Size(64f * sx, 42f * sy),
                    cornerRadius = CornerRadius(10f * sx)
                )
                drawCircle(color = c.AmberDeep.copy(alpha = 0.65f), radius = 4.5f * sx, center = Offset(48f * sx, 68f * sy))
                drawCircle(color = c.AmberDeep.copy(alpha = 0.65f), radius = 5.5f * sx, center = Offset(68f * sx, 72f * sy))
            }

            Defaults.AlchemicalArchetype.TAVERN_PROVISION -> {
                drawGlow(center, 50f * sx, c.OrangeGlow)
                drawOval(
                    color = c.PlatterSlate,
                    topLeft = Offset(24f * sx, 72f * sy),
                    size = Size(72f * sx, 24f * sy)
                )
                drawOval(
                    color = c.AmberDeep,
                    topLeft = Offset(34f * sx, 52f * sy),
                    size = Size(52f * sx, 32f * sy)
                )
                drawCircle(color = c.EmeraldMid, radius = 6f * sx, center = Offset(60f * sx, 48f * sy))
            }

            Defaults.AlchemicalArchetype.BURLAP_GRAIN_LIGHT,
            Defaults.AlchemicalArchetype.BURLAP_GRAIN_DARK -> {
                val grainColor = if (archetype == Defaults.AlchemicalArchetype.BURLAP_GRAIN_DARK) c.CoffeeBean else c.PowderLight
                drawGlow(center, 50f * sx, GrimoireColors.Gold.Amber)
                drawOval(
                    color = grainColor,
                    topLeft = Offset(36f * sx, 32f * sy),
                    size = Size(48f * sx, 24f * sy)
                )
                drawRoundRect(
                    color = c.BurlapFill,
                    topLeft = Offset(30f * sx, 44f * sy),
                    size = Size(60f * sx, 54f * sy),
                    cornerRadius = CornerRadius(12f * sx)
                )
                drawLine(
                    color = c.BurlapRune,
                    start = Offset(60f * sx, 58f * sy),
                    end = Offset(60f * sx, 86f * sy),
                    strokeWidth = 2.5f * sx,
                    cap = StrokeCap.Round
                )
            }

            Defaults.AlchemicalArchetype.RUBY_HEALING_POTION -> {
                drawGlow(center, 50f * sx, c.RubyGlow)
                drawRoundRect(
                    color = c.AmberDeep,
                    topLeft = Offset(52f * sx, 18f * sy),
                    size = Size(16f * sx, 10f * sy),
                    cornerRadius = CornerRadius(3f * sx)
                )
                drawRoundRect(
                    color = c.RubyMain,
                    topLeft = Offset(36f * sx, 50f * sy),
                    size = Size(48f * sx, 46f * sy),
                    cornerRadius = CornerRadius(14f * sx)
                )
                drawLine(
                    color = c.RubyCross,
                    start = Offset(60f * sx, 64f * sy),
                    end = Offset(60f * sx, 82f * sy),
                    strokeWidth = 5f * sx,
                    cap = StrokeCap.Round
                )
                drawLine(
                    color = c.RubyCross,
                    start = Offset(51f * sx, 73f * sy),
                    end = Offset(69f * sx, 73f * sy),
                    strokeWidth = 5f * sx,
                    cap = StrokeCap.Round
                )
            }

            Defaults.AlchemicalArchetype.MYSTIC_VIOLET_POTION -> {
                drawGlow(center, 50f * sx, c.PotionMid)
                drawRoundRect(
                    color = c.AmberDeep,
                    topLeft = Offset(53f * sx, 20f * sy),
                    size = Size(14f * sx, 10f * sy),
                    cornerRadius = CornerRadius(3f * sx)
                )
                drawCircle(
                    color = c.PotionGlass.copy(alpha = 0.28f),
                    radius = 28f * sx,
                    center = Offset(60f * sx, 72f * sy)
                )
                drawCircle(
                    color = c.PotionDeep,
                    radius = 23f * sx,
                    center = Offset(60f * sx, 75f * sy)
                )
                drawOval(
                    color = c.PotionMid,
                    topLeft = Offset(38f * sx, 63f * sy),
                    size = Size(44f * sx, 10f * sy)
                )
                drawCircle(color = c.PotionBubble, radius = 3.5f * sx, center = Offset(52f * sx, 80f * sy))
            }
        }
    }
}

private fun DrawScope.drawGlow(center: Offset, radius: Float, color: Color) {
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(color.copy(alpha = 0.42f), Color.Transparent),
            center = center,
            radius = radius
        ),
        radius = radius,
        center = center
    )
}
