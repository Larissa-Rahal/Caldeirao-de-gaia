// Supabase Edge Function — envia notificações Web Push
// Deploy: supabase functions deploy send-push-notification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@estoquecasa.app'

const STATUS_LABELS: Record<string, string> = {
  in_stock:     '✅ Em Estoque',
  running_low:  '⚠️ Acabando',
  out_of_stock: '❌ Em Falta',
}

// Converte base64url para Uint8Array
function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded  = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

// Assina o JWT VAPID
async function signVapidJwt(audience: string): Promise<string> {
  const header  = { alg: 'ES256', typ: 'JWT' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  }

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${enc(header)}.${enc(payload)}`

  const keyBytes = base64urlToBytes(VAPID_PRIVATE_KEY)
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  )

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${signingInput}.${sigB64}`
}

// Encripta o payload com ECDH + AES-GCM (Web Push encryption)
async function encryptPayload(
  subscription: { p256dh: string; auth_key: string },
  plaintext: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const salt            = crypto.getRandomValues(new Uint8Array(16))
  const clientPublicKey = base64urlToBytes(subscription.p256dh)
  const authSecret      = base64urlToBytes(subscription.auth_key)

  // Gera par de chaves efémero
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  )
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  )

  const clientKey = await crypto.subtle.importKey(
    'raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeyPair.privateKey, 256)
  )

  // HKDF para derivar chave de encriptação
  const prk = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits'])
  const hkdfInfo = (label: string, len: number) => {
    const enc  = new TextEncoder()
    const info = new Uint8Array(enc.encode(label).length + 1)
    info.set(enc.encode(label))
    info[enc.encode(label).length] = len
    return info
  }

  const context = new Uint8Array([
    0x00, ...authSecret,
    0x00, 0x41, ...clientPublicKey,
    0x00, 0x41, ...serverPublicKeyRaw,
  ])

  const prkKey = await crypto.subtle.importKey('raw', authSecret, 'HKDF', false, ['deriveBits'])
  const ikm    = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: hkdfInfo('Content-Encoding: auth\0', 32) },
    prk, 256
  ))
  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey', 'deriveBits'])

  const cek = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: hkdfInfo('Content-Encoding: aesgcm\0', 16) },
    ikmKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt']
  )
  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: hkdfInfo('Content-Encoding: nonce\0', 12) },
    ikmKey, 96
  ))

  const data        = new TextEncoder().encode(plaintext)
  const padded      = new Uint8Array(data.length + 2)
  padded.set(data, 2)

  const encrypted   = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce }, cek, padded
  ))

  return { ciphertext: encrypted, salt, serverPublicKey: serverPublicKeyRaw }
}

// Envia uma notificação para um endpoint
async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth_key: string },
  payload: object
): Promise<boolean> {
  const url      = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt      = await signVapidJwt(audience)

  const { ciphertext, salt, serverPublicKey } = await encryptPayload(sub, JSON.stringify(payload))

  const b64url = (buf: Uint8Array) =>
    btoa(String.fromCharCode(...buf)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type':     'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'Encryption':       `salt=${b64url(salt)}`,
      'Crypto-Key':       `dh=${b64url(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC_KEY}`,
      'Authorization':    `WebPush ${jwt}`,
      'TTL':              '86400',
    },
    body: ciphertext,
  })

  return res.ok || res.status === 201
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()

    // Chamado via Database Webhook quando há INSERT no activity_log
    const record = body.record ?? body

    if (!record?.house_id || !record?.action) {
      return new Response('No relevant data', { status: 200 })
    }

    // Só notifica para alterações de itens
    if (!['item_created','item_updated','status_changed','item_deleted'].includes(record.action)) {
      return new Response('Not a notifiable action', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca quem fez a ação
    const actorId = record.user_id

    // Busca todas as subscrições da casa, excluindo quem fez a ação
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('house_id', record.house_id)
      .neq('user_id', actorId ?? '')

    if (!subs?.length) return new Response('No subscribers', { status: 200 })

    // Busca o nome de quem fez a ação
    const { data: actor } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', actorId)
      .single()

    const actorName = actor?.full_name ?? actor?.email?.split('@')[0] ?? 'Alguém'

    // Monta a notificação
    let title = 'EstoqueCasa'
    let body_text = ''

    switch (record.action) {
      case 'item_created':
        title     = '➕ Item adicionado'
        body_text = `${actorName} adicionou "${record.item_name}"`
        break
      case 'status_changed':
        title     = '🔄 Estado alterado'
        body_text = `${actorName} marcou "${record.item_name}" como ${STATUS_LABELS[record.new_value] ?? record.new_value}`
        break
      case 'item_deleted':
        title     = '🗑️ Item removido'
        body_text = `${actorName} removeu "${record.item_name}"`
        break
      case 'item_updated':
        title     = '✏️ Item editado'
        body_text = `${actorName} editou "${record.item_name}"`
        break
    }

    const notification = { title, body: body_text, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' }

    // Envia para todos os dispositivos subscritos
    const results = await Promise.allSettled(
      subs.map(sub => sendPushNotification(sub, notification))
    )

    // Remove subscrições inválidas (endpoint expirou)
    const expiredEndpoints = subs
      .filter((_, i) => results[i].status === 'rejected')
      .map(s => s.endpoint)

    if (expiredEndpoints.length) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    return new Response(JSON.stringify({ sent: results.length }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
