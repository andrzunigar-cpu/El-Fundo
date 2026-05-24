import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

const FALLBACK_URL  = 'https://tubrjgkzookemtnvpvdg.supabase.co'
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YnJqZ2t6b29rZW10bnZwdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIxMzYsImV4cCI6MjA5NTEwODEzNn0.qJ8sLl0g0U6q58pFtRelt8fQAOdkXG_mirknJPLkW0I'

function validUrl(v: string | undefined): boolean {
  if (!v) return false
  try { new URL(v); return true } catch { return false }
}

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const envUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const url = validUrl(envUrl) ? envUrl! : FALLBACK_URL
  const key = (envKey && envKey.length > 20) ? envKey : FALLBACK_ANON
  _client = createClient(url, key)
  return _client
}

// Backwards compat - lazy proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
