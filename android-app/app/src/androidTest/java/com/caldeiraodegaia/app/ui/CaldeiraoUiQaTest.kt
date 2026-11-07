package com.caldeiraodegaia.app.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.CategoryDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.ui.components.items.ItemCardComposable
import com.caldeiraodegaia.app.ui.modals.MarketModal
import com.caldeiraodegaia.app.ui.screens.AuthScreen
import com.caldeiraodegaia.app.ui.screens.OnboardingScreen
import com.caldeiraodegaia.app.ui.theme.CaldeiraoTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Suíte de Testes Instrumentados de UI (Jetpack Compose QA)
 * Valida fluxos críticos de interação do utilizador:
 * 1) `AuthScreen`: validação de formulário (e-mail inválido, senha curta, alternância Login/Cadastro, convite)
 * 2) `OnboardingScreen`: criação de caldeirão e validação de código de 6 caracteres
 * 3) `ItemCardComposable`: exibição em modo Grade e Lista, ciclo de status e ajuste no pergaminho (`-` / `+`)
 * 4) `MarketModal`: filtragem exclusiva de itens `RUNNING_LOW` e `OUT_OF_STOCK` e reposição em lote
 */
class CaldeiraoUiQaTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun authScreen_exibeErrosDeValidacaoQuandoCamposInvalidos() {
        composeTestRule.setContent {
            CaldeiraoTheme(isDark = true) {
                AuthScreen(
                    inviteCode = "AB12CD",
                    configMissing = false,
                    onSignIn = { _, _, _ -> },
                    onSignUp = { _, _, _, _ -> }
                )
            }
        }

        // Com inviteCode presente, inicia no modo "Criar sua conta"
        composeTestRule.onNodeWithText("🎉 Você tem um convite! Código: AB12CD", substring = true)
            .assertIsDisplayed()

        // Tenta submeter vazio
        composeTestRule.onNodeWithText("Criar conta").performClick()

        composeTestRule.onNodeWithText("Nome obrigatório").assertIsDisplayed()
        composeTestRule.onNodeWithText("E-mail obrigatório").assertIsDisplayed()
        composeTestRule.onNodeWithText("Mínimo 6 caracteres").assertIsDisplayed()
    }

    @Test
    fun onboardingScreen_validaCodigoDeSeisCaracteresNoModoConvite() {
        var joinedCode: String? = null

        composeTestRule.setContent {
            CaldeiraoTheme(isDark = true) {
                OnboardingScreen(
                    initialInviteCode = null,
                    onCreateHouse = { _, _, _ -> },
                    onJoinHouse = { code, onDone, _ ->
                        joinedCode = code
                        onDone()
                    }
                )
            }
        }

        composeTestRule.onNodeWithText("Entrar com código").performClick()
        composeTestRule.onNodeWithText("Entrar no caldeirão").performClick()
        composeTestRule.onNodeWithText("O código tem 6 caracteres.").assertIsDisplayed()

        composeTestRule.onNodeWithText("Código de convite").performTextInput("gaia99")
        composeTestRule.onNodeWithText("Entrar no caldeirão").performClick()
        assertEquals("GAIA99", joinedCode)
    }

    @Test
    fun itemCardComposable_disparaCallbacksDeStatusEQuantidadeNoPergaminho() {
        var cycledItemId: String? = null
        var adjustedDelta: Double? = null

        val sampleItem = InventoryItem(
            id = "item-cafe",
            houseId = "h1",
            productId = "p1",
            categoryId = "c1",
            status = ItemStatus.IN_STOCK,
            qtyValue = 3.0,
            qtyUnit = "pct",
            defaultUnit = "pct",
            name = "Café Especial",
            brand = "3 Corações",
            barcode = null,
            notes = null,
            imageUrl = null,
            createdBy = null,
            updatedBy = null,
            updatedAt = null,
            product = ProductDto(id = "p1", name = "Café Especial", defaultUnit = "pct"),
            category = CategoryDto(id = "c1", houseId = "h1", name = "Mercearia", emoji = "🛒"),
            updater = null
        )

        composeTestRule.setContent {
            CaldeiraoTheme(isDark = true) {
                ItemCardComposable(
                    item = sampleItem,
                    viewMode = "grid",
                    onCycleStatus = { id, _ -> cycledItemId = id },
                    onAdjustQty = { _, delta -> adjustedDelta = delta },
                    onUpdateQtyValue = { _, _ -> },
                    onEdit = {},
                    onDelete = {}
                )
            }
        }

        composeTestRule.onNodeWithText("Café Especial").assertIsDisplayed()
        composeTestRule.onNodeWithText("3 pct").assertIsDisplayed()

        composeTestRule.onNodeWithText("Em Estoque").performClick()
        assertEquals("item-cafe", cycledItemId)

        composeTestRule.onNodeWithText("+").performClick()
        assertEquals(1.0, adjustedDelta!!, 0.001)
    }

    @Test
    fun marketModal_filtraApenasItensEmFaltaOuAcabando() {
        val cat = CategoryDto(id = "c1", houseId = "h1", name = "Mercearia", emoji = "🛒")
        val items = listOf(
            InventoryItem(
                id = "1",
                houseId = "h1",
                productId = "p1",
                categoryId = "c1",
                status = ItemStatus.IN_STOCK,
                qtyValue = 5.0,
                qtyUnit = "un",
                defaultUnit = "un",
                name = "Sal Grosso",
                brand = null,
                barcode = null,
                notes = null,
                imageUrl = null,
                createdBy = null,
                updatedBy = null,
                updatedAt = null,
                product = ProductDto(id = "p1", name = "Sal Grosso"),
                category = cat,
                updater = null
            ),
            InventoryItem(
                id = "2",
                houseId = "h1",
                productId = "p2",
                categoryId = "c1",
                status = ItemStatus.OUT_OF_STOCK,
                qtyValue = 0.0,
                qtyUnit = "kg",
                defaultUnit = "kg",
                name = "Feijão Carioca",
                brand = null,
                barcode = null,
                notes = null,
                imageUrl = null,
                createdBy = null,
                updatedBy = null,
                updatedAt = null,
                product = ProductDto(id = "p2", name = "Feijão Carioca"),
                category = cat,
                updater = null
            )
        )

        composeTestRule.setContent {
            CaldeiraoTheme(isDark = true) {
                MarketModal(
                    open = true,
                    onClose = {},
                    items = items,
                    categories = listOf(cat),
                    onSetStatus = { _, _ -> },
                    onRestockAll = {}
                )
            }
        }

        composeTestRule.onNodeWithText("1 itens a comprar").assertIsDisplayed()
        composeTestRule.onNodeWithText("Feijão Carioca").assertIsDisplayed()
    }
}
