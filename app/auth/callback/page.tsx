'use client'

import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Verificar si hay un hash en la URL (para recuperación de contraseña)
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        // Procesar el token
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error procesando token:', error)
          router.push('/login?error=auth_failed')
        } else {
          // Redirigir al reset-password si es recuperación
          // o al dashboard si es verificación de email
          router.push('/reset-password')
        }
      } else {
        // Si no hay hash, redirigir al login
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Procesando autenticación...</p>
      </div>
    </div>
  )
}
