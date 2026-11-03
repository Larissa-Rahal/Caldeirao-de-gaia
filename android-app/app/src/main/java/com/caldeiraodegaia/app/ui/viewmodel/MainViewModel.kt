package com.caldeiraodegaia.app.ui.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.caldeiraodegaia.app.core.util.ItemStatus
import com.caldeiraodegaia.app.data.model.HouseDto
import com.caldeiraodegaia.app.data.model.InventoryItem
import com.caldeiraodegaia.app.data.model.ItemDraftInput
import com.caldeiraodegaia.app.data.model.ProductDto
import com.caldeiraodegaia.app.data.repository.AuthState
import com.caldeiraodegaia.app.data.repository.HouseState
import com.caldeiraodegaia.app.data.repository.InventoryState
import com.caldeiraodegaia.app.di.AppContainer
import com.caldeiraodegaia.app.hardware.ReceiptAnalysisResult
import com.caldeiraodegaia.app.hardware.ScannedBarcodeProduct
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface UiMessage {
    data class Success(val text: String) : UiMessage
    data class Error(val text: String) : UiMessage
    data class Info(val text: String) : UiMessage
}

/**
 * ViewModel principal MVVM que coordena o estado reativo de:
 * - Autenticação (`AuthContext`)
 * - Casas / Membros / Convites (`HouseContext`)
 * - Itens / Categorias / Histórico (`useItems`, `useCategories`, `useActivityLog`)
 * - Preferências de Tema e Visualização (`useTheme`, `VIEW_KEY`)
 * - Leitura de Código de Barras e Notas Fiscais (`BarcodeScanner`, `receiptScanner`)
 */
class MainViewModel(
    private val container: AppContainer
) : ViewModel() {

    val authState: StateFlow<AuthState> = container.authRepository.authState
    val houseState: StateFlow<HouseState> = container.houseRepository.houseState
    val inventoryState: StateFlow<InventoryState> = container.inventoryRepository.state

    val isDarkTheme: StateFlow<Boolean> = container.preferencesRepository.isDarkThemeFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    val viewMode: StateFlow<String> = container.preferencesRepository.viewModeFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, "grid")

    val geminiApiKey: StateFlow<String> = container.preferencesRepository.geminiApiKeyFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, "")

    val hasEnvGeminiKey: Boolean = container.preferencesRepository.hasEnvGeminiKey()

    private val _pendingInviteCode = MutableStateFlow<String?>(null)
    val pendingInviteCode: StateFlow<String?> = _pendingInviteCode.asStateFlow()

    private val _messages = MutableSharedFlow<UiMessage>(extraBufferCapacity = 8)
    val messages: SharedFlow<UiMessage> = _messages.asSharedFlow()

    fun setPendingInviteCode(code: String?) {
        _pendingInviteCode.value = code?.trim()?.uppercase()?.takeIf { it.isNotEmpty() }
    }

    fun clearPendingInviteCode() {
        _pendingInviteCode.value = null
    }

    fun emitMessage(msg: UiMessage) {
        _messages.tryEmit(msg)
    }

    // ── Tema e Modo de Visualização ──

    fun toggleTheme() {
        viewModelScope.launch {
            container.preferencesRepository.toggleTheme()
        }
    }

    fun toggleViewMode() {
        viewModelScope.launch {
            container.preferencesRepository.toggleViewMode()
        }
    }

    // ── Autenticação & Perfil ──

    fun signIn(
        email: String,
        password: String,
        onComplete: (Boolean) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                container.authRepository.signIn(email, password)
                emitMessage(UiMessage.Success("Bem-vindo de volta! 🫧"))
                onComplete(true)
            } catch (e: Exception) {
                val friendly = if (e.message?.contains("Invalid login credentials", ignoreCase = true) == true) {
                    "E-mail ou senha incorretos."
                } else {
                    e.message ?: "Erro ao entrar na conta."
                }
                emitMessage(UiMessage.Error(friendly))
                onComplete(false)
            }
        }
    }

    fun signUp(
        email: String,
        password: String,
        fullName: String,
        onComplete: (Boolean) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                container.authRepository.signUp(email, password, fullName)
                emitMessage(UiMessage.Success("Conta criada! Você já pode entrar."))
                onComplete(true)
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao criar conta."))
                onComplete(false)
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { container.authRepository.signOut() }
        }
    }

    fun updateProfileName(newName: String, onDone: () -> Unit = {}) {
        viewModelScope.launch {
            try {
                container.authRepository.updateProfile(fullName = newName)
                emitMessage(UiMessage.Success("Perfil atualizado!"))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao atualizar perfil."))
            } finally {
                onDone()
            }
        }
    }

    fun uploadAvatarUri(context: Context, uri: Uri, onDone: () -> Unit = {}) {
        viewModelScope.launch {
            try {
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                    ?: throw IllegalArgumentException("Não foi possível ler a imagem.")
                container.authRepository.uploadAvatar(bytes, "jpg")
                emitMessage(UiMessage.Success("Foto atualizada!"))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error("Erro ao enviar foto: ${e.message}"))
            } finally {
                onDone()
            }
        }
    }

    fun changePassword(
        currentPwd: String,
        newPwd: String,
        onResult: (String?) -> Unit
    ) {
        viewModelScope.launch {
            try {
                container.authRepository.changePassword(currentPwd, newPwd)
                emitMessage(UiMessage.Success("Senha alterada com sucesso!"))
                onResult(null)
            } catch (e: Exception) {
                onResult(e.message ?: "Erro ao alterar senha.")
            }
        }
    }

    // ── Casas (Caldeirões) & Membros ──

    fun setActiveHouse(house: HouseDto) {
        viewModelScope.launch {
            container.houseRepository.setActiveHouse(house)
        }
    }

    fun createHouse(
        name: String,
        onSuccess: (HouseDto) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                val created = container.houseRepository.createHouse(name)
                container.houseRepository.setActiveHouse(created)
                emitMessage(UiMessage.Success("Caldeirão \"${created.name}\" criado! 🫧"))
                onSuccess(created)
            } catch (e: Exception) {
                val msg = e.message ?: "Erro ao criar caldeirão."
                emitMessage(UiMessage.Error(msg))
                onError(msg)
            }
        }
    }

    fun joinHouse(
        code: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                val result = container.houseRepository.joinHouse(code)
                clearPendingInviteCode()
                val text = if (result.alreadyMember) {
                    "Você já é membro deste caldeirão!"
                } else {
                    "Adicionado ao caldeirão com sucesso! ✨"
                }
                emitMessage(UiMessage.Success(text))
                onSuccess()
            } catch (e: Exception) {
                val msg = if (e.message?.contains("Código de convite inválido", ignoreCase = true) == true) {
                    "Código inválido. Verifica e tenta novamente."
                } else {
                    e.message ?: "Erro ao entrar no caldeirão."
                }
                onError(msg)
            }
        }
    }

    fun renameActiveHouse(newName: String, onDone: () -> Unit = {}) {
        val houseId = houseState.value.activeHouse?.id ?: return
        viewModelScope.launch {
            try {
                container.houseRepository.updateHouseName(houseId, newName)
                emitMessage(UiMessage.Success("Nome atualizado!"))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao renomear."))
            } finally {
                onDone()
            }
        }
    }

    fun regenerateInviteCode() {
        val houseId = houseState.value.activeHouse?.id ?: return
        viewModelScope.launch {
            try {
                container.houseRepository.regenerateInviteCode(houseId)
                emitMessage(UiMessage.Success("Novo código gerado!"))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao gerar novo código."))
            }
        }
    }

    fun removeMember(memberId: String) {
        viewModelScope.launch {
            try {
                container.houseRepository.removeMember(memberId)
                emitMessage(UiMessage.Success("Membro removido."))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao remover membro."))
            }
        }
    }

    // ── Itens e Categorias ──

    fun addItem(
        draft: ItemDraftInput,
        silentToast: Boolean = false,
        onSuccess: (InventoryItem) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                val added = container.inventoryRepository.addItem(draft)
                if (!silentToast) {
                    emitMessage(UiMessage.Success("Item adicionado ao caldeirão!"))
                }
                onSuccess(added)
            } catch (e: Exception) {
                val msg = e.message ?: "Erro ao adicionar item."
                emitMessage(UiMessage.Error(msg))
                onError(msg)
            }
        }
    }

    fun updateItem(
        itemId: String,
        draft: ItemDraftInput,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.updateItem(itemId, draft)
                emitMessage(UiMessage.Success("Item atualizado!"))
                onSuccess()
            } catch (e: Exception) {
                val msg = e.message ?: "Erro ao atualizar item."
                emitMessage(UiMessage.Error(msg))
                onError(msg)
            }
        }
    }

    fun cycleStatus(itemId: String, currentStatus: ItemStatus) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.cycleStatus(itemId, currentStatus)
            } catch (_: Exception) {
                emitMessage(UiMessage.Error("Erro ao atualizar status."))
            }
        }
    }

    fun setStatus(itemId: String, status: ItemStatus) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.setStatus(itemId, status)
            } catch (_: Exception) {
                emitMessage(UiMessage.Error("Erro ao atualizar status."))
            }
        }
    }

    fun restockAllMarketItems(itemsToRestock: List<InventoryItem>) {
        viewModelScope.launch {
            try {
                itemsToRestock.forEach { item ->
                    container.inventoryRepository.setStatus(item.id, ItemStatus.IN_STOCK)
                }
                emitMessage(UiMessage.Success("Todos os itens repostos!"))
            } catch (_: Exception) {
                emitMessage(UiMessage.Error("Erro ao repor itens."))
            }
        }
    }

    fun adjustQty(itemId: String, delta: Double) {
        viewModelScope.launch {
            runCatching { container.inventoryRepository.adjustQty(itemId, delta) }
        }
    }

    fun updateQtyValue(itemId: String, value: Double) {
        viewModelScope.launch {
            runCatching { container.inventoryRepository.updateQtyValue(itemId, value) }
        }
    }

    fun restockItem(itemId: String, addedQty: Double, unit: String?) {
        viewModelScope.launch {
            runCatching { container.inventoryRepository.restockItem(itemId, addedQty, unit) }
        }
    }

    suspend fun restockItemSuspend(itemId: String, addedQty: Double, unit: String?) {
        container.inventoryRepository.restockItem(itemId, addedQty, unit)
    }

    fun deleteItem(itemId: String) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.deleteItem(itemId)
                emitMessage(UiMessage.Success("Item excluído."))
            } catch (_: Exception) {
                emitMessage(UiMessage.Error("Erro ao excluir."))
            }
        }
    }

    fun addCategory(name: String, emoji: String) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.addCategory(name, emoji)
                emitMessage(UiMessage.Success("Categoria adicionada!"))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao criar categoria."))
            }
        }
    }

    fun deleteCategory(categoryId: String) {
        viewModelScope.launch {
            try {
                container.inventoryRepository.deleteCategory(categoryId)
                emitMessage(UiMessage.Success("Categoria eliminada."))
            } catch (e: Exception) {
                emitMessage(UiMessage.Error(e.message ?: "Erro ao excluir categoria."))
            }
        }
    }

    fun loadCatalogProducts() {
        viewModelScope.launch {
            container.inventoryRepository.fetchCatalogProducts()
        }
    }

    fun loadMoreActivityLog() {
        viewModelScope.launch {
            container.inventoryRepository.loadMoreActivityLog()
        }
    }

    // ── Câmera, Código de Barras, Upload e Nota Fiscal ──

    suspend fun lookupBarcode(code: String): ScannedBarcodeProduct {
        return container.barcodeLookupService.lookupBarcode(code)
    }

    suspend fun findExistingProductByBarcode(code: String): ProductDto? {
        return container.inventoryRepository.findProductByBarcode(code)
    }

    suspend fun uploadProductImageUri(context: Context, uri: Uri): String {
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Não foi possível ler a imagem.")
        return container.inventoryRepository.uploadProductImage(bytes, "jpg")
    }

    fun saveGeminiApiKey(key: String) {
        viewModelScope.launch {
            container.preferencesRepository.saveGeminiApiKey(key)
            emitMessage(UiMessage.Success("Chave salva neste dispositivo!"))
        }
    }

    suspend fun analyzeReceiptUri(
        uri: Uri,
        apiKeyOverride: String? = null
    ): Pair<android.graphics.Bitmap, ReceiptAnalysisResult> {
        val resolvedKey = apiKeyOverride?.trim()?.takeIf { it.isNotEmpty() }
            ?: container.preferencesRepository.getResolvedGeminiApiKey()

        val compressed = container.receiptScannerManager.prepareAndScanReceiptUri(uri)
        val currentState = inventoryState.value
        val result = container.receiptScannerManager.analyzeReceiptImage(
            compressed = compressed,
            existingItems = currentState.items,
            categories = currentState.categories,
            apiKey = resolvedKey
        )
        return compressed.bitmap to result
    }

    companion object {
        fun provideFactory(container: AppContainer): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return MainViewModel(container) as T
                }
            }
    }
}
