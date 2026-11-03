package com.caldeiraodegaia.app.core.util

import java.net.URLEncoder
import java.nio.charset.StandardCharsets

enum class ItemStatus(val dbValue: String, val label: String, val icon: String) {
    IN_STOCK("in_stock", "Em Estoque", "✅"),
    RUNNING_LOW("running_low", "Acabando", "⚠️"),
    OUT_OF_STOCK("out_of_stock", "Em Falta", "❌");

    fun next(): ItemStatus = when (this) {
        IN_STOCK -> RUNNING_LOW
        RUNNING_LOW -> OUT_OF_STOCK
        OUT_OF_STOCK -> IN_STOCK
    }

    companion object {
        fun fromDb(value: String?): ItemStatus =
            entries.firstOrNull { it.dbValue == value } ?: IN_STOCK
    }
}

data class DefaultCategorySeed(
    val name: String,
    val emoji: String,
    val sortOrder: Int
)

object Defaults {
    val DEFAULT_CATEGORIES = listOf(
        DefaultCategorySeed(name = "Mercearia", emoji = "🛒", sortOrder = 0),
        DefaultCategorySeed(name = "Higiene Pessoal", emoji = "🪥", sortOrder = 1),
        DefaultCategorySeed(name = "Limpeza", emoji = "🧹", sortOrder = 2),
        DefaultCategorySeed(name = "Geladeira", emoji = "❄️", sortOrder = 3),
        DefaultCategorySeed(name = "Congelados", emoji = "🧊", sortOrder = 4),
        DefaultCategorySeed(name = "Bebidas", emoji = "🥤", sortOrder = 5),
        DefaultCategorySeed(name = "Farmácia", emoji = "💊", sortOrder = 6),
        DefaultCategorySeed(name = "Outros", emoji = "📦", sortOrder = 7),
    )

    val UNIT_OPTIONS = listOf("un", "unid", "cx", "pct", "par")
    val WEIGHT_OPTIONS = listOf("kg", "g", "L", "mL", "mg")

    fun buildInviteUrl(inviteCode: String?): String {
        val baseUrl = "https://estoque-casa-five.vercel.app/"
        return if (!inviteCode.isNullOrBlank()) "${baseUrl}?invite=${inviteCode.trim()}" else baseUrl
    }

    fun buildInviteMessage(houseName: String, inviteCode: String): String {
        return "🫧 Oi! Te convido para o Caldeirão de Gaia — $houseName.\n\nUse o código *$inviteCode ou entre pelo link:*\n${buildInviteUrl(inviteCode)}"
    }

    /**
     * Identifica o arquétipo de ilustração mística/alquímica pelo nome do produto ou categoria,
     * fiel à lógica de `getCategoryPlaceholder` em `src/lib/defaults.js`.
     */
    enum class AlchemicalArchetype {
        MAGIC_JAR,
        ELIXIR_FLASK_AMBER,
        ELIXIR_FLASK_LIME,
        COFFEE_SACK,
        BOTANICAL_HERBS,
        CHEESE_WHEEL,
        TAVERN_PROVISION,
        BURLAP_GRAIN_LIGHT,
        BURLAP_GRAIN_DARK,
        RUBY_HEALING_POTION,
        MYSTIC_VIOLET_POTION
    }

    fun resolveArchetype(categoryName: String?, itemName: String?): AlchemicalArchetype {
        val cat = (categoryName ?: "").lowercase()
        val item = (itemName ?: "").lowercase()

        return when {
            Regex("a[cç][uú]car|sal\\b|mel\\b|geleia|doce|pote|fermento|leite em p[oó]|maionese|requeij[aã]o|iogurte").containsMatchIn(item) ->
                AlchemicalArchetype.MAGIC_JAR

            Regex("azeite|[oó]leo|vinagre|vinho|suco|[aá]gua\\b|leite\\b|bebida|refrigerante|cerveja|ch[aá]\\b").containsMatchIn(item) || cat.contains("bebidas") -> {
                if (Regex("leite|suco|refrigerante").containsMatchIn(item)) {
                    AlchemicalArchetype.ELIXIR_FLASK_AMBER
                } else {
                    AlchemicalArchetype.ELIXIR_FLASK_LIME
                }
            }

            Regex("caf[eé]|cacau|achocolatado|chocolate").containsMatchIn(item) ->
                AlchemicalArchetype.COFFEE_SACK

            Regex("aveia|trigo|cereal|granola|erva|tempero|or[eé]gano|manjeric[aã]o|alecrim|folha|hortifr|verdura|legume|ervilha|milho|molho|tomate|alho|cebola|batata|cenoura").containsMatchIn(item) || cat.contains("hortifr") ->
                AlchemicalArchetype.BOTANICAL_HERBS

            Regex("queijo|manteiga|margarina|latic|p[aã]o|pizza|bolo|biscoito|bolacha|torrada|ovos?").containsMatchIn(item) ->
                AlchemicalArchetype.CHEESE_WHEEL

            Regex("carne|frango|peito|bife|presunto|lingui[cç]a|bacon|peixe|hamb[uú]rguer|salsicha").containsMatchIn(item) || cat.contains("congelados") || cat.contains("geladeira") ->
                AlchemicalArchetype.TAVERN_PROVISION

            Regex("arroz|feij[aã]o|farinha|lentilha|gr[aã]o|macarr[aã]o|massa").containsMatchIn(item) || cat.contains("mercearia") -> {
                if (Regex("feij[aã]o|lentilha").containsMatchIn(item)) {
                    AlchemicalArchetype.BURLAP_GRAIN_DARK
                } else {
                    AlchemicalArchetype.BURLAP_GRAIN_LIGHT
                }
            }

            Regex("antiss[eé]ptico|curativo|gaze|soro|term[oô]metro|rem[eé]dio|vitamina|dipirona|paracetamol|algod[aã]o").containsMatchIn(item) || cat.contains("farm") ->
                AlchemicalArchetype.RUBY_HEALING_POTION

            else -> AlchemicalArchetype.MYSTIC_VIOLET_POTION
        }
    }

    fun buildGoogleShoppingUrl(productName: String, brand: String?): String {
        val query = listOfNotNull(productName.takeIf { it.isNotBlank() }, brand?.takeIf { it.isNotBlank() })
            .joinToString(" ")
        val encoded = URLEncoder.encode(query, StandardCharsets.UTF_8.toString())
        return "https://www.google.com/search?tbm=shop&q=$encoded&hl=pt"
    }
}
