package com.caldeiraodegaia.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caldeiraodegaia.app.ui.components.ornaments.CauldronEmblem
import com.caldeiraodegaia.app.ui.theme.GrimoireColors

/**
 * Equivalente nativo em Jetpack Compose de `src/pages/OnboardingPage.jsx`.
 */
@Composable
fun OnboardingScreen(
    initialInviteCode: String?,
    onCreateHouse: (name: String, onDone: () -> Unit, onError: (String) -> Unit) -> Unit,
    onJoinHouse: (code: String, onDone: () -> Unit, onError: (String) -> Unit) -> Unit
) {
    var tab by remember { mutableStateOf("create") }
    var houseName by remember { mutableStateOf("") }
    var inviteCode by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(initialInviteCode) {
        if (!initialInviteCode.isNullOrBlank()) {
            inviteCode = initialInviteCode.trim().uppercase().take(6)
            tab = "join"
        }
    }

    fun submitCreate() {
        val clean = houseName.trim()
        if (clean.isEmpty()) {
            errorText = "Dê um nome ao seu caldeirão."
            return
        }
        loading = true
        errorText = null
        onCreateHouse(
            clean,
            { loading = false },
            { err ->
                loading = false
                errorText = err
            }
        )
    }

    fun submitJoin() {
        val clean = inviteCode.trim().uppercase()
        if (clean.length != 6) {
            errorText = "O código tem 6 caracteres."
            return
        }
        loading = true
        errorText = null
        onJoinHouse(
            clean,
            { loading = false },
            { err ->
                loading = false
                errorText = err
            }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF281147), Color(0xFF120822))
                )
            )
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 440.dp),
            shape = RoundedCornerShape(28.dp),
            color = Color(0xFF1F1135),
            border = BorderStroke(1.5.dp, GrimoireColors.Gold.Base.copy(alpha = 0.7f)),
            shadowElevation = 16.dp
        ) {
            Column(
                modifier = Modifier.padding(26.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CauldronEmblem(modifier = Modifier.size(78.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Bem-vindo ao Caldeirão de Gaia!",
                    color = GrimoireColors.Gold.Bright,
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Crie ou entre em um caldeirão para começar.",
                    color = Color(0xFFCBB9E2),
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(18.dp))

                // Seletor de abas
                Surface(
                    color = Color(0xFF140B24),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OnboardingTabButton(
                            selected = tab == "create",
                            label = "Criar caldeirão",
                            icon = { Icon(Icons.Default.Home, contentDescription = null, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                tab = "create"
                                errorText = null
                            },
                            modifier = Modifier.weight(1f)
                        )
                        OnboardingTabButton(
                            selected = tab == "join",
                            label = "Entrar com código",
                            icon = { Icon(Icons.Default.Groups, contentDescription = null, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                tab = "join"
                                errorText = null
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                if (tab == "create") {
                    OutlinedTextField(
                        value = houseName,
                        onValueChange = {
                            if (it.length <= 60) houseName = it
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

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = ::submitCreate,
                        enabled = !loading,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GrimoireColors.Gold.Base,
                            contentColor = Color(0xFF1F1200)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(
                                color = Color(0xFF1F1200),
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                        } else {
                            Text("Criar caldeirão", fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                    }
                } else {
                    OutlinedTextField(
                        value = inviteCode,
                        onValueChange = {
                            inviteCode = it.uppercase().take(6)
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

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = ::submitJoin,
                        enabled = !loading,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GrimoireColors.Gold.Base,
                            contentColor = Color(0xFF1F1200)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(
                                color = Color(0xFF1F1200),
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                        } else {
                            Text("Entrar no caldeirão", fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OnboardingTabButton(
    selected: Boolean,
    label: String,
    icon: @Composable () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(10.dp),
        color = if (selected) Color(0xFF331B59) else Color.Transparent,
        border = if (selected) BorderStroke(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.6f)) else null,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            icon()
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                color = if (selected) GrimoireColors.Gold.Bright else Color(0xFFA792C4)
            )
        }
    }
}
