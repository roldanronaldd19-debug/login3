import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// URLs dinámicas según el entorno
const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'
}

const getAuthRedirects = () => {
  const siteUrl = getSiteUrl()
  return {
    confirm: `${siteUrl}/auth/callback`,
    reset: `${siteUrl}/reset-password`,
    invite: `${siteUrl}/register`,
    signup: `${siteUrl}/auth/callback`
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    debug: process.env.NODE_ENV === 'development'
  }
})

// Helper para obtener URLs de redirección
export const getRedirectUrls = () => {
  return getAuthRedirects()
}

// Cliente admin para funciones del lado del servidor
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
