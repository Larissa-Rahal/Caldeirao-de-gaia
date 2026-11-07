package com.caldeiraodegaia.app.core.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Suíte de Testes de QA — `Defaults` e `ItemStatus`
 * Cobertura de:
 * - Máquina de estados finitos (`ItemStatus.next()` e `ItemStatus.fromDb()`)
 * - Sementes de categorias padrão (`DEFAULT_CATEGORIES`)
 * - Geração de links de convite e busca Google Shopping
 * - Particionamento de todas as 11 classes de equivalência de `AlchemicalArchetype`
 */
class DefaultsTest {

    @Test
    fun `ItemStatus cicla corretamente na maquina de estados IN_STOCK - RUNNING_LOW - OUT_OF_STOCK`() {
        assertEquals(ItemStatus.RUNNING_LOW, ItemStatus.IN_STOCK.next())
        assertEquals(ItemStatus.OUT_OF_STOCK, ItemStatus.RUNNING_LOW.next())
        assertEquals(ItemStatus.IN_STOCK, ItemStatus.OUT_OF_STOCK.next())
    }

    @Test
    fun `ItemStatus fromDb converte valores do banco e faz fallback seguro para IN_STOCK`() {
        assertEquals(ItemStatus.IN_STOCK, ItemStatus.fromDb("in_stock"))
        assertEquals(ItemStatus.RUNNING_LOW, ItemStatus.fromDb("running_low"))
        assertEquals(ItemStatus.OUT_OF_STOCK, ItemStatus.fromDb("out_of_stock"))
        assertEquals(ItemStatus.IN_STOCK, ItemStatus.fromDb(null))
        assertEquals(ItemStatus.IN_STOCK, ItemStatus.fromDb("status_desconhecido"))
    }

    @Test
    fun `DEFAULT_CATEGORIES contem exatamente 8 categorias ordenadas sequencialmente`() {
        val cats = Defaults.DEFAULT_CATEGORIES
        assertEquals(8, cats.size)
        assertEquals("Mercearia", cats.first().name)
        assertEquals("🛒", cats.first().emoji)
        assertEquals("Outros", cats.last().name)
        assertEquals("📦", cats.last().emoji)

        cats.forEachIndexed { index, seed ->
            assertEquals(index, seed.sortOrder)
            assertTrue(seed.name.isNotBlank())
            assertTrue(seed.emoji.isNotBlank())
        }
    }

    @Test
    fun `buildInviteUrl e buildInviteMessage formatam convites corretamente`() {
        assertEquals(
            "https://estoque-casa-five.vercel.app/?invite=C99AB3",
            Defaults.buildInviteUrl("C99AB3")
        )
        assertEquals(
            "https://estoque-casa-five.vercel.app/",
            Defaults.buildInviteUrl(null)
        )
        assertEquals(
            "https://estoque-casa-five.vercel.app/",
            Defaults.buildInviteUrl("   ")
        )

        val message = Defaults.buildInviteMessage("Caldeirão TESTE", "C99AB3")
        assertTrue(message.contains("Caldeirão TESTE"))
        assertTrue(message.contains("C99AB3"))
        assertTrue(message.contains("https://estoque-casa-five.vercel.app/?invite=C99AB3"))
    }

    @Test
    fun `buildGoogleShoppingUrl codifica query com nome e marca`() {
        val urlWithBrand = Defaults.buildGoogleShoppingUrl("Café Torrado", "Melitta")
        assertTrue(urlWithBrand.startsWith("https://www.google.com/search?tbm=shop&q="))
        assertTrue(urlWithBrand.contains("Melitta"))
        assertTrue(urlWithBrand.endsWith("&hl=pt"))

        val urlWithoutBrand = Defaults.buildGoogleShoppingUrl("Arroz Branco", null)
        assertTrue(urlWithoutBrand.contains("Arroz+Branco"))
    }

    @Test
    fun `resolveArchetype mapeia todas as 11 classes de ilustracoes alquimicas corretamente`() {
        // 1. MAGIC_JAR (potes, açúcar, sal, mel, geleia, maionese, iogurte)
        assertEquals(
            Defaults.AlchemicalArchetype.MAGIC_JAR,
            Defaults.resolveArchetype("Mercearia", "Açúcar Cristal")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.MAGIC_JAR,
            Defaults.resolveArchetype("Geladeira", "Iogurte Natural")
        )

        // 2. ELIXIR_FLASK_AMBER (leite, suco, refrigerante)
        assertEquals(
            Defaults.AlchemicalArchetype.ELIXIR_FLASK_AMBER,
            Defaults.resolveArchetype("Bebidas", "Leite Integral")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.ELIXIR_FLASK_AMBER,
            Defaults.resolveArchetype("Bebidas", "Suco de Uva")
        )

        // 3. ELIXIR_FLASK_LIME (azeite, óleo, água, vinho, cerveja)
        assertEquals(
            Defaults.AlchemicalArchetype.ELIXIR_FLASK_LIME,
            Defaults.resolveArchetype("Mercearia", "Azeite de Oliva")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.ELIXIR_FLASK_LIME,
            Defaults.resolveArchetype("Bebidas", "Água Mineral")
        )

        // 4. COFFEE_SACK (café, cacau, chocolate)
        assertEquals(
            Defaults.AlchemicalArchetype.COFFEE_SACK,
            Defaults.resolveArchetype("Mercearia", "Café em Pó")
        )

        // 5. BOTANICAL_HERBS (aveia, ervas, temperos, hortifruti, tomate, alho)
        assertEquals(
            Defaults.AlchemicalArchetype.BOTANICAL_HERBS,
            Defaults.resolveArchetype("Mercearia", "Aveia em Flocos")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.BOTANICAL_HERBS,
            Defaults.resolveArchetype("Hortifruti", "Manjericão Fresco")
        )

        // 6. CHEESE_WHEEL (queijos, manteiga, pães, biscoitos, ovos)
        assertEquals(
            Defaults.AlchemicalArchetype.CHEESE_WHEEL,
            Defaults.resolveArchetype("Geladeira", "Queijo Mussarela")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.CHEESE_WHEEL,
            Defaults.resolveArchetype("Mercearia", "Ovos Brancos")
        )

        // 7. TAVERN_PROVISION (carnes, aves, frios, congelados)
        assertEquals(
            Defaults.AlchemicalArchetype.TAVERN_PROVISION,
            Defaults.resolveArchetype("Congelados", "Peito de Frango")
        )

        // 8. BURLAP_GRAIN_LIGHT (arroz, farinha, macarrão)
        assertEquals(
            Defaults.AlchemicalArchetype.BURLAP_GRAIN_LIGHT,
            Defaults.resolveArchetype("Mercearia", "Arroz Agulhinha")
        )

        // 9. BURLAP_GRAIN_DARK (feijão, lentilha)
        assertEquals(
            Defaults.AlchemicalArchetype.BURLAP_GRAIN_DARK,
            Defaults.resolveArchetype("Mercearia", "Feijão Preto")
        )

        // 10. RUBY_HEALING_POTION (farmácia, remédios, curativos)
        assertEquals(
            Defaults.AlchemicalArchetype.RUBY_HEALING_POTION,
            Defaults.resolveArchetype("Farmácia", "Dipirona 500mg")
        )

        // 11. MYSTIC_VIOLET_POTION (limpeza, higiene e fallback geral)
        assertEquals(
            Defaults.AlchemicalArchetype.MYSTIC_VIOLET_POTION,
            Defaults.resolveArchetype("Limpeza", "Detergente Neutro")
        )
        assertEquals(
            Defaults.AlchemicalArchetype.MYSTIC_VIOLET_POTION,
            Defaults.resolveArchetype(null, null)
        )
    }
}
