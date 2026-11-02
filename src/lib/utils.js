import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60)      return 'agora mesmo'
  if (diff < 3600)    return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400)   return `há ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `há ${Math.floor(diff / 86400)} dias`
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

export function getInviteCodeFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('invite') || null
}

export function clearInviteFromUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState({}, '', url.toString())
}

export async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return true
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
