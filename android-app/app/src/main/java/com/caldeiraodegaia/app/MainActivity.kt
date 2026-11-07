package com.caldeiraodegaia.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caldeiraodegaia.app.ui.components.ornaments.CauldronEmblem
import com.caldeiraodegaia.app.ui.modals.JoinHouseModal
import com.caldeiraodegaia.app.ui.screens.AuthScreen
import com.caldeiraodegaia.app.ui.screens.HomeScreen
import com.caldeiraodegaia.app.ui.screens.OnboardingScreen
import com.caldeiraodegaia.app.ui.theme.CaldeiraoTheme
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.viewmodel.MainViewModel
import com.caldeiraodegaia.app.ui.viewmodel.UiMessage

/**
 * Activity principal que substitui `src/App.jsx` e `src/main.jsx`,
 * gerenciando Deep Links de convite (`?invite=CODE`), estado de autenticação/casas
 * e notificações visuais (Snackbars equivalentes ao `react-hot-toast`).
 */
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels {
        val app = application as CaldeiraoApp
        MainViewModel.provideFactory(app.container)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        extractInviteFromIntent(intent)

        setContent {
            val isDark by viewModel.isDarkTheme.collectAsState()
            CaldeiraoTheme(isDark = isDark) {
                CaldeiraoRootContent(viewModel = viewModel)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        extractInviteFromIntent(intent)
    }

    private fun extractInviteFromIntent(intent: Intent?) {
        val data = intent?.data ?: return
        val code = data.getQueryParameter("invite") ?: data.lastPathSegment
        if (!code.isNullOrBlank() && code.length == 6) {
            viewModel.setPendingInviteCode(code)
        }
    }
}

@Composable
private fun CaldeiraoRootContent(viewModel: MainViewModel) {
    val authState by viewModel.authState.collectAsState()
    val houseState by viewModel.houseState.collectAsState()
    val inventoryState by viewModel.inventoryState.collectAsState()
    val isDark by viewModel.isDarkTheme.collectAsState()
    val viewMode by viewModel.viewMode.collectAsState()
    val geminiKey by viewModel.geminiApiKey.collectAsState()
    val pendingInviteCode by viewModel.pendingInviteCode.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }
    var autoJoinModalOpen by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val text = when (msg) {
                is UiMessage.Success -> msg.text
                is UiMessage.Error -> "❌ ${msg.text}"
                is UiMessage.Info -> msg.text
            }
            snackbarHostState.showSnackbar(text)
        }
    }

    // Equivalente ao useEffect de `App.jsx`: abre o modal de convite se o utilizador já tem casas
    LaunchedEffect(authState.user, houseState.loading, houseState.houses.size, pendingInviteCode) {
        if (authState.user != null && !houseState.loading && !pendingInviteCode.isNullOrBlank()) {
            if (houseState.houses.isNotEmpty()) {
                autoJoinModalOpen = true
            }
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding(),
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        containerColor = Color.Transparent
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when {
                authState.loading || (authState.user != null && houseState.loading) -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(Color(0xFF281147), Color(0xFF120822))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            CauldronEmblem(modifier = Modifier.size(92.dp))
                            Spacer(modifier = Modifier.height(14.dp))
                            CircularProgressIndicator(
                                color = GrimoireColors.Gold.Light,
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Carregando...",
                                color = GrimoireColors.Gold.Cream,
                                fontFamily = FontFamily.Serif,
                                fontSize = 14.sp
                            )
                        }
                    }
                }

                authState.user == null -> {
                    AuthScreen(
                        inviteCode = pendingInviteCode,
                        configMissing = authState.configMissing,
                        onSignIn = { email, pwd, onDone ->
                            viewModel.signIn(email, pwd, onDone)
                        },
                        onSignUp = { email, pwd, fullName, onDone ->
                            viewModel.signUp(email, pwd, fullName, onDone)
                        }
                    )
                }

                houseState.houses.isEmpty() -> {
                    OnboardingScreen(
                        initialInviteCode = pendingInviteCode,
                        onCreateHouse = { name, onDone, onError ->
                            viewModel.createHouse(
                                name = name,
                                onSuccess = { onDone() },
                                onError = onError
                            )
                        },
                        onJoinHouse = { code, onDone, onError ->
                            viewModel.joinHouse(
                                code = code,
                                onSuccess = onDone,
                                onError = onError
                            )
                        }
                    )
                }

                else -> {
                    HomeScreen(
                        houses = houseState.houses,
                        activeHouse = houseState.activeHouse,
                        members = houseState.members,
                        currentUserId = authState.user?.id,
                        currentUserEmail = authState.user?.email,
                        profile = authState.profile,
                        items = inventoryState.items,
                        categories = inventoryState.categories,
                        catalogProducts = inventoryState.catalogProducts,
                        activityEntries = inventoryState.activityEntries,
                        activityHasMore = inventoryState.activityHasMore,
                        activityLoading = inventoryState.activityLoading,
                        inventoryLoading = inventoryState.loading,
                        isDark = isDark,
                        viewMode = viewMode,
                        hasEnvGeminiKey = viewModel.hasEnvGeminiKey,
                        savedGeminiKey = geminiKey,
                        onToggleTheme = viewModel::toggleTheme,
                        onToggleViewMode = viewModel::toggleViewMode,
                        onSelectHouse = viewModel::setActiveHouse,
                        onCreateHouse = { name, onSuccess, onError ->
                            viewModel.createHouse(
                                name = name,
                                onSuccess = { onSuccess() },
                                onError = onError
                            )
                        },
                        onJoinHouse = { code, onSuccess, onError ->
                            viewModel.joinHouse(
                                code = code,
                                onSuccess = onSuccess,
                                onError = onError
                            )
                        },
                        onRenameHouse = viewModel::renameActiveHouse,
                        onRegenerateInviteCode = viewModel::regenerateInviteCode,
                        onRemoveMember = viewModel::removeMember,
                        onAddCategory = viewModel::addCategory,
                        onDeleteCategory = viewModel::deleteCategory,
                        onCycleStatus = viewModel::cycleStatus,
                        onSetStatus = viewModel::setStatus,
                        onRestockAllMarket = viewModel::restockAllMarketItems,
                        onAdjustQty = viewModel::adjustQty,
                        onUpdateQtyValue = viewModel::updateQtyValue,
                        onAddItem = { draft, onSuccess, onError ->
                            viewModel.addItem(
                                draft = draft,
                                onSuccess = { onSuccess() },
                                onError = onError
                            )
                        },
                        onUpdateItem = viewModel::updateItem,
                        onDeleteItem = viewModel::deleteItem,
                        onLoadCatalog = viewModel::loadCatalogProducts,
                        onLoadMoreActivity = viewModel::loadMoreActivityLog,
                        onLookupBarcode = viewModel::lookupBarcode,
                        onUploadImageUri = viewModel::uploadProductImageUri,
                        onSaveGeminiKey = viewModel::saveGeminiApiKey,
                        onAnalyzeReceiptUri = viewModel::analyzeReceiptUri,
                        onRestockItemSuspend = viewModel::restockItemSuspend,
                        onSaveProfileName = viewModel::updateProfileName,
                        onUploadAvatar = viewModel::uploadAvatarUri,
                        onChangePassword = viewModel::changePassword,
                        onSignOut = viewModel::signOut,
                        onShowMessage = { text, isError ->
                            viewModel.emitMessage(
                                if (isError) UiMessage.Error(text) else UiMessage.Success(text)
                            )
                        }
                    )

                    JoinHouseModal(
                        open = autoJoinModalOpen,
                        initialInviteCode = pendingInviteCode,
                        onClose = {
                            autoJoinModalOpen = false
                            viewModel.clearPendingInviteCode()
                        },
                        onJoinHouse = { code, onSuccess, onError ->
                            viewModel.joinHouse(
                                code = code,
                                onSuccess = {
                                    autoJoinModalOpen = false
                                    onSuccess()
                                },
                                onError = onError
                            )
                        }
                    )
                }
            }
        }
    }
}
