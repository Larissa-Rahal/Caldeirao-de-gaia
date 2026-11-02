import { useState, useEffect } from 'react'

const STORAGE_KEY = 'caldeirão_theme'
const DEFAULT     = 'dark'  // grimório por defeito

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Aplica o tema imediatamente ao carregar (antes do React pintar)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggle() {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggle, isDark: theme === 'dark' }
}
