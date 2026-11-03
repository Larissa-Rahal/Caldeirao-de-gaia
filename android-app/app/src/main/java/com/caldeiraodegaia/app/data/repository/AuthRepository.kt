package com.caldeiraodegaia.app.data.repository

import com.caldeiraodegaia.app.data.model.ProfileDto
import com.caldeiraodegaia.app.data.remote.SupabaseModule
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

data class AuthState(
    val user: UserInfo? = null,
    val profile: ProfileDto? = null,
    val loading: Boolean = true,
    val configMissing: Boolean = !SupabaseModule.isConfigured
)

/**
 * Equivalente nativo em Kotlin de `src/contexts/AuthContext.jsx` e `ProfileModal.jsx`.
 */
class AuthRepository {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val supabase get() = SupabaseModule.client

    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        if (!SupabaseModule.isConfigured) {
            _authState.value = AuthState(loading = false, configMissing = true)
        } else {
            scope.launch {
                supabase.auth.sessionStatus.collect { status ->
                    when (status) {
                        is SessionStatus.Authenticated -> {
                            val user = status.session.user
                            val profile = user?.let { fetchOrCreateProfile(it) }
                            _authState.value = AuthState(
                                user = user,
                                profile = profile,
                                loading = false,
                                configMissing = false
                            )
                        }
                        is SessionStatus.NotAuthenticated -> {
                            _authState.value = AuthState(
                                user = null,
                                profile = null,
                                loading = false,
                                configMissing = false
                            )
                        }
                        is SessionStatus.Initializing -> {
                            _authState.value = _authState.value.copy(loading = true)
                        }
                        is SessionStatus.RefreshFailure -> {
                            _authState.value = _authState.value.copy(loading = false)
                        }
                    }
                }
            }
        }
    }

    suspend fun fetchOrCreateProfile(authUser: UserInfo): ProfileDto? {
        return try {
            val existing = supabase.postgrest.from("profiles")
                .select {
                    filter { eq("id", authUser.id) }
                }
                .decodeSingleOrNull<ProfileDto>()

            if (existing != null) return existing

            val metadataName = authUser.userMetadata?.get("full_name")?.jsonPrimitive?.content
            val defaultName = metadataName?.takeIf { it.isNotBlank() }
                ?: authUser.email?.substringBefore("@")
                ?: "Utilizador"

            val toUpsert = ProfileDto(
                id = authUser.id,
                email = authUser.email,
                fullName = defaultName
            )

            supabase.postgrest.from("profiles")
                .upsert(toUpsert) {
                    onConflict = "id"
                    select()
                }
                .decodeSingleOrNull<ProfileDto>() ?: toUpsert
        } catch (_: Exception) {
            ProfileDto(
                id = authUser.id,
                email = authUser.email,
                fullName = authUser.email?.substringBefore("@") ?: "Utilizador"
            )
        }
    }

    suspend fun ensureProfile() {
        val user = _authState.value.user ?: supabase.auth.currentUserOrNull() ?: return
        fetchOrCreateProfile(user)
    }

    suspend fun signIn(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signUp(email: String, password: String, fullName: String) {
        supabase.auth.signUpWith(Email) {
            this.email = email.trim()
            this.password = password
            this.data = buildJsonObject {
                put("full_name", fullName.trim())
            }
        }
    }

    suspend fun signOut() {
        supabase.auth.signOut()
    }

    suspend fun updateProfile(fullName: String? = null, avatarUrl: String? = null): ProfileDto {
        val userId = _authState.value.user?.id
            ?: throw IllegalStateException("Utilizador não autenticado.")

        val payload = buildJsonObject {
            if (fullName != null) put("full_name", fullName.trim())
            if (avatarUrl != null) put("avatar_url", avatarUrl)
        }

        val updated = supabase.postgrest.from("profiles")
            .update(payload) {
                filter { eq("id", userId) }
                select()
            }
            .decodeSingle<ProfileDto>()

        _authState.value = _authState.value.copy(profile = updated)
        return updated
    }

    suspend fun uploadAvatar(imageBytes: ByteArray, extension: String = "jpg"): ProfileDto {
        val userId = _authState.value.user?.id
            ?: throw IllegalStateException("Utilizador não autenticado.")
        if (imageBytes.size > 3 * 1024 * 1024) {
            throw IllegalArgumentException("Máximo 3 MB.")
        }
        val cleanExt = extension.lowercase().ifBlank { "jpg" }
        val path = "$userId/avatar.$cleanExt"

        val bucket = supabase.storage.from("avatars")
        bucket.upload(path, imageBytes) {
            upsert = true
        }
        val publicUrl = "${bucket.publicUrl(path)}?t=${System.currentTimeMillis()}"
        return updateProfile(avatarUrl = publicUrl)
    }

    suspend fun changePassword(currentPassword: String, newPassword: String) {
        val email = _authState.value.user?.email
            ?: throw IllegalStateException("E-mail do utilizador não encontrado.")

        try {
            supabase.auth.signInWith(Email) {
                this.email = email
                this.password = currentPassword
            }
        } catch (_: Exception) {
            throw IllegalArgumentException("Senha atual incorreta.")
        }

        supabase.auth.updateUser {
            password = newPassword
        }
    }
}
