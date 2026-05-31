/**
 * require-admin.ts
 * Helper de autorización para Route Handlers que requieren sesión admin.
 * Uso: const deny = requireAdmin(req); if (deny) return deny;
 */
import { type NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './admin-auth'

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}
