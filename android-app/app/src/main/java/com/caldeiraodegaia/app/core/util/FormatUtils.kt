package com.caldeiraodegaia.app.core.util

import java.text.Normalizer
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

object FormatUtils {
    private val ptBrLocale = Locale("pt", "BR")
    private val shortDateFormatter = DateTimeFormatter.ofPattern("d 'de' MMM", ptBrLocale)
    private val dayHeaderFormatter = DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", ptBrLocale)

    /**
     * Equivalente a `timeAgo(dateStr)` em `src/lib/utils.js`.
     */
    fun timeAgo(isoDateStr: String?): String {
        if (isoDateStr.isNullOrBlank()) return ""
        return try {
            val instant = Instant.parse(isoDateStr)
            val now = Instant.now()
            val diffSeconds = ChronoUnit.SECONDS.between(instant, now).coerceAtLeast(0)

            when {
                diffSeconds < 60 -> "agora mesmo"
                diffSeconds < 3600 -> "há ${diffSeconds / 60} min"
                diffSeconds < 86400 -> "há ${diffSeconds / 3600} h"
                diffSeconds < 2592000 -> "há ${diffSeconds / 86400} dias"
                else -> shortDateFormatter.format(instant.atZone(ZoneId.systemDefault()))
            }
        } catch (_: Exception) {
            ""
        }
    }

    fun formatDayHeader(isoDateStr: String?): String {
        if (isoDateStr.isNullOrBlank()) return "Hoje"
        return try {
            val instant = Instant.parse(isoDateStr)
            dayHeaderFormatter.format(instant.atZone(ZoneId.systemDefault()))
                .replaceFirstChar { if (it.isLowerCase()) it.titlecase(ptBrLocale) else it.toString() }
        } catch (_: Exception) {
            "Recente"
        }
    }

    /**
     * Equivalente a `getInitials(name)` em `src/lib/utils.js`.
     */
    fun getInitials(name: String?): String {
        if (name.isNullOrBlank()) return "?"
        return name.trim()
            .split(Regex("\\s+"))
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .ifEmpty { "?" }
    }

    /**
     * Equivalente a `normalizeStr(str)` em `src/lib/receiptScanner.js`.
     */
    fun normalizeForMatch(input: String?): String {
        if (input.isNullOrBlank()) return ""
        val nfd = Normalizer.normalize(input.lowercase(ptBrLocale), Normalizer.Form.NFD)
        return nfd.replace(Regex("[\\u0300-\\u036f]"), "").trim()
    }

    fun formatQuantity(value: Double?): String {
        if (value == null) return ""
        return if (value % 1.0 == 0.0) {
            value.toLong().toString()
        } else {
            value.toBigDecimal().stripTrailingZeros().toPlainString()
        }
    }
}
