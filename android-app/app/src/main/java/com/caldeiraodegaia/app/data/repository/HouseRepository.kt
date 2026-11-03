package com.caldeiraodegaia.app.data.repository

import com.caldeiraodegaia.app.core.util.Defaults
import com.caldeiraodegaia.app.data.local.UserPreferencesRepository
import com.caldeiraodegaia.app.data.model.CategoryInsertDto
import com.caldeiraodegaia.app.data.model.HouseDto
import com.caldeiraodegaia.app.data.model.HouseMemberDto
import com.caldeiraodegaia.app.data.model.HouseMemberJoinRow
import com.caldeiraodegaia.app.data.remote.SupabaseModule
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.postgrest.rpc
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.UUID

data class HouseState(
    val houses: List<HouseDto> = emptyList(),
    val activeHouse: HouseDto? = null,
    val members: List<HouseMemberDto> = emptyList(),
    val loading: Boolean = true
)

data class JoinHouseResult(
    val houseId: String?,
    val alreadyMember: Boolean
)

/**
 * Equivalente nativo em Kotlin de `src/contexts/HouseContext.jsx`.
 */
class HouseRepository(
    private val authRepository: AuthRepository,
    private val preferencesRepository: UserPreferencesRepository
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val supabase get() = SupabaseModule.client

    private val _houseState = MutableStateFlow(HouseState())
    val houseState: StateFlow<HouseState> = _houseState.asStateFlow()

    init {
        scope.launch {
            authRepository.authState.collect { auth ->
                if (auth.loading) return@collect
                if (auth.user == null) {
                    _houseState.value = HouseState(
                        houses = emptyList(),
                        activeHouse = null,
                        members = emptyList(),
                        loading = false
                    )
                } else {
                    fetchHouses()
                }
            }
        }
    }

    suspend fun fetchHouses() {
        val user = authRepository.authState.value.user
        if (user == null || !SupabaseModule.isConfigured) {
            _houseState.value = HouseState(loading = false)
            return
        }

        try {
            val rows = supabase.postgrest.from("house_members")
                .select(Columns.raw("role, houses(*)")) {
                    filter { eq("user_id", user.id) }
                    order("joined_at", Order.ASCENDING)
                }
                .decodeList<HouseMemberJoinRow>()

            val list = rows.mapNotNull { row ->
                row.houses?.copy(myRole = row.role)
            }

            val savedHouseId = preferencesRepository.getActiveHouseId()
            val foundActive = list.firstOrNull { it.id == savedHouseId } ?: list.firstOrNull()

            _houseState.value = _houseState.value.copy(
                houses = list,
                activeHouse = foundActive,
                loading = false
            )

            if (foundActive != null) {
                preferencesRepository.setActiveHouseId(foundActive.id)
                fetchMembers(foundActive.id)
            } else {
                _houseState.value = _houseState.value.copy(members = emptyList())
            }
        } catch (_: Exception) {
            _houseState.value = _houseState.value.copy(loading = false)
        }
    }

    suspend fun fetchMembers(houseId: String) {
        try {
            val memberList = supabase.postgrest.from("house_members")
                .select(Columns.raw("*, profiles(*)")) {
                    filter { eq("house_id", houseId) }
                }
                .decodeList<HouseMemberDto>()

            _houseState.value = _houseState.value.copy(members = memberList)
        } catch (_: Exception) {
            // Mantém lista atual se falhar
        }
    }

    suspend fun setActiveHouse(house: HouseDto) {
        _houseState.value = _houseState.value.copy(activeHouse = house)
        preferencesRepository.setActiveHouseId(house.id)
        fetchMembers(house.id)
    }

    suspend fun createHouse(name: String): HouseDto {
        val user = authRepository.authState.value.user
            ?: throw IllegalStateException("Utilizador não autenticado.")

        authRepository.ensureProfile()

        val houseId = UUID.randomUUID().toString()
        val cleanName = name.trim()

        // Inserimos sem encadear select() para respeitar a RLS antes do commit do trigger on_house_created
        supabase.postgrest.from("houses")
            .insert(
                buildJsonObject {
                    put("id", houseId)
                    put("name", cleanName)
                    put("owner_id", user.id)
                }
            )

        val fetched = supabase.postgrest.from("houses")
            .select {
                filter { eq("id", houseId) }
            }
            .decodeSingleOrNull<HouseDto>()

        val created = (fetched ?: HouseDto(id = houseId, name = cleanName, ownerId = user.id))
            .copy(myRole = "owner")

        val categoriesSeed = Defaults.DEFAULT_CATEGORIES.map { seed ->
            CategoryInsertDto(
                houseId = houseId,
                name = seed.name,
                emoji = seed.emoji,
                sortOrder = seed.sortOrder
            )
        }

        runCatching {
            supabase.postgrest.from("categories").insert(categoriesSeed)
        }

        preferencesRepository.setActiveHouseId(houseId)
        fetchHouses()
        if (_houseState.value.activeHouse == null) {
            _houseState.value = _houseState.value.copy(activeHouse = created)
        }
        return created
    }

    suspend fun joinHouse(inviteCode: String): JoinHouseResult {
        authRepository.ensureProfile()
        val cleanCode = inviteCode.trim().uppercase()
        val alreadyMember = _houseState.value.houses.any {
            it.inviteCode?.uppercase() == cleanCode
        }

        val response = supabase.postgrest.rpc(
            function = "join_house_by_code",
            parameters = buildJsonObject {
                put("p_invite_code", cleanCode)
            }
        )

        val joinedHouseId = runCatching { response.decodeAs<String>() }.getOrNull()
            ?: runCatching { response.decodeAs<JsonPrimitive>().content }.getOrNull()

        if (!joinedHouseId.isNullOrBlank()) {
            preferencesRepository.setActiveHouseId(joinedHouseId)
        }
        fetchHouses()

        return JoinHouseResult(
            houseId = joinedHouseId,
            alreadyMember = alreadyMember
        )
    }

    suspend fun updateHouseName(houseId: String, newName: String): HouseDto {
        val cleanName = newName.trim()
        val updated = supabase.postgrest.from("houses")
            .update(buildJsonObject { put("name", cleanName) }) {
                filter { eq("id", houseId) }
                select()
            }
            .decodeSingle<HouseDto>()

        val currentHouses = _houseState.value.houses.map { h ->
            if (h.id == houseId) updated.copy(myRole = h.myRole) else h
        }
        val currentActive = _houseState.value.activeHouse?.let { act ->
            if (act.id == houseId) updated.copy(myRole = act.myRole) else act
        }

        _houseState.value = _houseState.value.copy(
            houses = currentHouses,
            activeHouse = currentActive
        )
        return updated
    }

    suspend fun regenerateInviteCode(houseId: String): String {
        val response = supabase.postgrest.rpc(
            function = "regenerate_invite_code",
            parameters = buildJsonObject {
                put("p_house_id", houseId)
            }
        )
        val newCode = response.decodeAs<String>()

        val currentHouses = _houseState.value.houses.map { h ->
            if (h.id == houseId) h.copy(inviteCode = newCode) else h
        }
        val currentActive = _houseState.value.activeHouse?.let { act ->
            if (act.id == houseId) act.copy(inviteCode = newCode) else act
        }
        _houseState.value = _houseState.value.copy(
            houses = currentHouses,
            activeHouse = currentActive
        )
        return newCode
    }

    suspend fun removeMember(memberId: String) {
        supabase.postgrest.from("house_members")
            .delete {
                filter { eq("id", memberId) }
            }

        _houseState.value = _houseState.value.copy(
            members = _houseState.value.members.filterNot { it.id == memberId }
        )
    }
}
