import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHouse } from '@/contexts/HouseContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user }        = useAuth()
  const { activeHouse } = useHouse()
  const [permission, setPermission] = useState(Notification.permission)
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [supported,  setSupported]  = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY)
  }, [])

  // Verifica se já está subscrito
  useEffect(() => {
    if (!supported || !user || !activeHouse) return
    checkSubscription()
  }, [supported, user, activeHouse]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) { setSubscribed(false); return }

      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', sub.endpoint)
        .maybeSingle()

      setSubscribed(!!data)
    } catch { setSubscribed(false) }
  }

  async function subscribe() {
    if (!supported || !user || !activeHouse) return
    setLoading(true)
    try {
      // Pede permissão
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return }

      // Regista o service worker de push
      const reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Subscreve o push manager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const json   = sub.toJSON()
      const keys   = json.keys ?? {}

      // Guarda no Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id:    user.id,
        house_id:   activeHouse.id,
        endpoint:   sub.endpoint,
        p256dh:     keys.p256dh,
        auth_key:   keys.auth,
        user_agent: navigator.userAgent.slice(0, 200),
      }, { onConflict: 'user_id,endpoint' })

      if (error) throw error
      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint)

        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
