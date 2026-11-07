package com.caldeiraodegaia.app.core.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Suíte de Testes de QA — `FormatUtils`
 * Técnicas aplicadas: Particionamento de Equivalência, Análise de Valor Limite (Boundary Value Analysis)
 * e Tratamento de Entradas Inválidas / Nulas.
 */
class FormatUtilsTest {

    // ── 1. timeAgo() — Análise de Valores Limite ──

    @Test
    fun `timeAgo retorna string vazia para nulo, vazio ou formato ISO invalido`() {
        assertEquals("", FormatUtils.timeAgo(null))
        assertEquals("", FormatUtils.timeAgo(""))
        assertEquals("", FormatUtils.timeAgo("   "))
        assertEquals("", FormatUtils.timeAgo("data-invalida-nao-iso"))
    }

    @Test
    fun `timeAgo retorna agora mesmo para menos de 60 segundos ou data futura`() {
        val now = Instant.now()
        val thirtySecAgo = now.minus(30, ChronoUnit.SECONDS).toString()
        val futureDate = now.plus(120, ChronoUnit.SECONDS).toString()

        assertEquals("agora mesmo", FormatUtils.timeAgo(thirtySecAgo))
        assertEquals("agora mesmo", FormatUtils.timeAgo(futureDate))
    }

    @Test
    fun `timeAgo retorna minutos entre 1 e 59 minutos`() {
        val fifteenMinAgo = Instant.now().minus(15, ChronoUnit.MINUTES).toString()
        assertEquals("há 15 min", FormatUtils.timeAgo(fifteenMinAgo))
    }

    @Test
    fun `timeAgo retorna horas entre 1 e 23 horas`() {
        val threeHoursAgo = Instant.now().minus(3, ChronoUnit.HOURS).toString()
        assertEquals("há 3 h", FormatUtils.timeAgo(threeHoursAgo))
    }

    @Test
    fun `timeAgo retorna dias entre 1 e 29 dias`() {
        val fiveDaysAgo = Instant.now().minus(5, ChronoUnit.DAYS).toString()
        assertEquals("há 5 dias", FormatUtils.timeAgo(fiveDaysAgo))
    }

    @Test
    fun `timeAgo retorna data curta formatada para 30 dias ou mais`() {
        val sixtyDaysAgo = Instant.now().minus(60, ChronoUnit.DAYS).toString()
        val result = FormatUtils.timeAgo(sixtyDaysAgo)
        assertTrue(result.isNotBlank())
        assertFalse(result.contains("há"))
        assertTrue(result.contains("de"))
    }

    // ── 2. getInitials() — Particionamento de Equivalência ──

    @Test
    fun `getInitials extrai ate duas iniciais em maiusculas`() {
        assertEquals("LR", FormatUtils.getInitials("Larissa Rahal Coelho"))
        assertEquals("CG", FormatUtils.getInitials("  caldeirão   de   gaia "))
        assertEquals("C", FormatUtils.getInitials("casa"))
    }

    @Test
    fun `getInitials retorna interrogacao quando nulo ou em branco`() {
        assertEquals("?", FormatUtils.getInitials(null))
        assertEquals("?", FormatUtils.getInitials(""))
        assertEquals("?", FormatUtils.getInitials("    "))
    }

    // ── 3. normalizeForMatch() — Normalização NFD e Remoção de Diacríticos ──

    @Test
    fun `normalizeForMatch remove acentos, converte para minusculas e faz trim`() {
        assertEquals("acucar uniao", FormatUtils.normalizeForMatch("  Açúcar União  "))
        assertEquals(" macarrao espaguete ", " " + FormatUtils.normalizeForMatch("Macarrão Espaguete") + " ")
        assertEquals("feijao carioca", FormatUtils.normalizeForMatch("FEIJÃO CARIOCA"))
        assertEquals("agua sanitaria ype", FormatUtils.normalizeForMatch("Água Sanitária Ypê"))
        assertEquals("", FormatUtils.normalizeForMatch(null))
        assertEquals("", FormatUtils.normalizeForMatch("   "))
    }

    // ── 4. formatQuantity() — Formatação Numérica Sem Zeros Desnecessários ──

    @Test
    fun `formatQuantity formata inteiros sem casas decimais e preserva decimais significativos`() {
        assertEquals("", FormatUtils.formatQuantity(null))
        assertEquals("0", FormatUtils.formatQuantity(0.0))
        assertEquals("1", FormatUtils.formatQuantity(1.0))
        assertEquals("12", FormatUtils.formatQuantity(12.000))
        assertEquals("1.5", FormatUtils.formatQuantity(1.5))
        assertEquals("0.25", FormatUtils.formatQuantity(0.250))
        assertEquals("2.75", FormatUtils.formatQuantity(2.75))
    }

    // ── 5. formatDayHeader() ──

    @Test
    fun `formatDayHeader trata nulo, invalido e ISO valido com inicial maiuscula`() {
        assertEquals("Hoje", FormatUtils.formatDayHeader(null))
        assertEquals("Hoje", FormatUtils.formatDayHeader(""))
        assertEquals("Recente", FormatUtils.formatDayHeader("invalido"))

        val valid = FormatUtils.formatDayHeader("2026-11-04T15:00:00Z")
        assertTrue(valid.first().isUpperCase())
        assertTrue(valid.contains("de"))
    }
}
