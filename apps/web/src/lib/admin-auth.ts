/**
 * admin-auth.ts — HMAC-SHA256 (Web Crypto, compatible Edge + Node)
 * El token NO es reversible. Comparación siempre en tiempo constante.
 */

const TOKEN_CONTEXT = 'elfundo:admin:session:v2'

async function _hmac(secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(TOKEN_CONTEXT))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function getAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (!secret) return ''
  return _hmac(secret)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false
  const expected = await getAdminToken()
  if (!expected) return false
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
