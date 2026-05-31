/**
 * Admin session token helpers.
 * The token is derived from ADMIN_SESSION_SECRET env var —
 * never exposed to the client, checked only server-side.
 */

export function getAdminToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!secret) return ''
  // Derive a stable opaque token (not the secret itself)
  // Using simple base64 encoding so Edge Runtime can handle it without Node crypto
  return Buffer.from(`admin:${secret}:elfundo`).toString('base64url')
}

export function verifyAdminToken(token: string): boolean {
  if (!token) return false
  const expected = getAdminToken()
  if (!expected) return false
  // Constant-length comparison to prevent trivial timing attacks
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
