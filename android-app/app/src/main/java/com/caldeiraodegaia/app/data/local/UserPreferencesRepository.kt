package com.caldeiraodegaia.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.caldeiraodegaia.app.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "caldeirao_preferences")

class UserPreferencesRepository(private val context: Context) {

    companion object {
        private val KEY_ACTIVE_HOUSE_ID = stringPreferencesKey("caldeirao_active_house")
        private val KEY_VIEW_MODE = stringPreferencesKey("caldeirao_view")
        private val KEY_IS_DARK_THEME = booleanPreferencesKey("caldeirao_theme_dark")
        private val KEY_GEMINI_API_KEY = stringPreferencesKey("caldeirao_gemini_api_key")
    }

    val activeHouseIdFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_ACTIVE_HOUSE_ID]
    }

    val viewModeFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_VIEW_MODE] ?: "grid"
    }

    val isDarkThemeFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_IS_DARK_THEME] ?: true // Grimório escuro por padrão
    }

    val geminiApiKeyFlow: Flow<String> = context.dataStore.data.map { prefs ->
        val envKey = BuildConfig.GEMINI_API_KEY.trim()
        if (envKey.isNotEmpty() && envKey != "your-gemini-api-key") {
            envKey
        } else {
            prefs[KEY_GEMINI_API_KEY]?.trim().orEmpty()
        }
    }

    fun hasEnvGeminiKey(): Boolean {
        val envKey = BuildConfig.GEMINI_API_KEY.trim()
        return envKey.isNotEmpty() && envKey != "your-gemini-api-key"
    }

    suspend fun getActiveHouseId(): String? = activeHouseIdFlow.first()

    suspend fun setActiveHouseId(houseId: String?) {
        context.dataStore.edit { prefs ->
            if (houseId.isNullOrBlank()) {
                prefs.remove(KEY_ACTIVE_HOUSE_ID)
            } else {
                prefs[KEY_ACTIVE_HOUSE_ID] = houseId
            }
        }
    }

    suspend fun toggleViewMode(): String {
        var next = "grid"
        context.dataStore.edit { prefs ->
            val current = prefs[KEY_VIEW_MODE] ?: "grid"
            next = if (current == "grid") "compact" else "grid"
            prefs[KEY_VIEW_MODE] = next
        }
        return next
    }

    suspend fun toggleTheme(): Boolean {
        var next = true
        context.dataStore.edit { prefs ->
            val current = prefs[KEY_IS_DARK_THEME] ?: true
            next = !current
            prefs[KEY_IS_DARK_THEME] = next
        }
        return next
    }

    suspend fun saveGeminiApiKey(key: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_GEMINI_API_KEY] = key.trim()
        }
    }

    suspend fun getResolvedGeminiApiKey(): String = geminiApiKeyFlow.first()
}
