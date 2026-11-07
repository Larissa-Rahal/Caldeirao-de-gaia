package com.caldeiraodegaia.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caldeiraodegaia.app.ui.components.ornaments.CauldronEmblem
import com.caldeiraodegaia.app.ui.theme.GrimoireColors

/**
 * Equivalente nativo em Jetpack Compose de `src/pages/AuthPage.jsx`.
 */
@Composable
fun AuthScreen(
    inviteCode: String?,
    configMissing: Boolean,
    onSignIn: (email: String, password: String, onDone: (Boolean) -> Unit) -> Unit,
    onSignUp: (email: String, password: String, fullName: String, onDone: (Boolean) -> Unit) -> Unit
) {
    var mode by remember { mutableStateOf("login") }
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }

    LaunchedEffect(inviteCode) {
        if (!inviteCode.isNullOrBlank()) {
            mode = "register"
        }
    }

    fun validate(): Boolean {
        var valid = true
        nameError = null
        emailError = null
        passwordError = null

        val trimmedEmail = email.trim()
        if (trimmedEmail.isEmpty()) {
            emailError = "E-mail obrigatório"
            valid = false
        } else if (!Regex("^\\S+@\\S+\\.\\S+$").matches(trimmedEmail)) {
            emailError = "E-mail inválido"
            valid = false
        }

        if (password.length < 6) {
            passwordError = "Mínimo 6 caracteres"
            valid = false
        }

        if (mode == "register" && fullName.trim().isEmpty()) {
            nameError = "Nome obrigatório"
            valid = false
        }
        return valid
    }

    fun submit() {
        if (!validate()) return
        submitting = true
        if (mode == "login") {
            onSignIn(email.trim(), password) {
                submitting = false
            }
        } else {
            onSignUp(email.trim(), password, fullName.trim()) { success ->
                submitting = false
                if (success) {
                    mode = "login"
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF281147),
                        Color(0xFF120822)
                    )
                )
            )
            .padding(horizontal = 16.dp, vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 440.dp)
                .verticalScroll(rememberScrollState()),
            shape = RoundedCornerShape(28.dp),
            color = Color(0xFF1F1135),
            border = BorderStroke(1.5.dp, GrimoireColors.Gold.Base.copy(alpha = 0.7f)),
            shadowElevation = 16.dp
        ) {
            Column(
                modifier = Modifier.padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CauldronEmblem(modifier = Modifier.size(84.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Caldeirão de Gaia",
                    color = GrimoireColors.Gold.Bright,
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 24.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (mode == "login") "Entre na sua conta" else "Crie sua conta",
                    color = Color(0xFFCBB9E2),
                    fontSize = 14.sp
                )

                if (configMissing) {
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        color = Color(0xFF451A1A),
                        border = BorderStroke(1.dp, Color(0xFFF87171)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env ou local.properties.",
                            color = Color(0xFFFECACA),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                if (!inviteCode.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        color = Color(0xFF2E1B4E),
                        border = BorderStroke(1.dp, GrimoireColors.Gold.Light),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "🎉 Você tem um convite! Código: $inviteCode\n" +
                                    (if (mode == "login") "Entre ou crie uma conta" else "Crie sua conta") +
                                    " para aceitar.",
                            color = GrimoireColors.Gold.Cream,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (mode == "register") {
                        OutlinedTextField(
                            value = fullName,
                            onValueChange = {
                                fullName = it
                                nameError = null
                            },
                            label = { Text("Nome") },
                            placeholder = { Text("Seu nome") },
                            isError = nameError != null,
                            supportingText = nameError?.let { err -> { Text(err) } },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            emailError = null
                        },
                        label = { Text("E-mail") },
                        placeholder = { Text("voce@exemplo.com") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        isError = emailError != null,
                        supportingText = emailError?.let { err -> { Text(err) } },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            passwordError = null
                        },
                        label = { Text("Senha") },
                        placeholder = { Text("••••••") },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        isError = passwordError != null,
                        supportingText = passwordError?.let { err -> { Text(err) } },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = ::submit,
                        enabled = !submitting,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GrimoireColors.Gold.Base,
                            contentColor = Color(0xFF1F1200)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (submitting) {
                            CircularProgressIndicator(
                                color = Color(0xFF1F1200),
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                        } else {
                            Text(
                                text = if (mode == "login") "Entrar" else "Criar conta",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                TextButton(
                    onClick = {
                        mode = if (mode == "login") "register" else "login"
                        nameError = null
                        emailError = null
                        passwordError = null
                    }
                ) {
                    Text(
                        text = if (mode == "login") {
                            "Não tem conta? Crie uma aqui"
                        } else {
                            "Já tem conta? Entre aqui"
                        },
                        color = GrimoireColors.Gold.Light,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
