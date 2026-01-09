'use client'

import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Procesando callback de autenticación...')
      
      // Verificar si hay un hash en la URL
      const hash = window.location.hash
      console.log('Hash de la URL:', hash)
      
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const type = params.get('type')
        const accessToken = params.get('access_token')
        
        console.log('Parámetros:', { type, accessToken })
        
        if (type === 'invite' && accessToken) {
          // Es una invitación, redirigir al registro con el token
          router.push(`/register#${hash}`)
          return
        }
        
        if (type === 'recovery' && accessToken) {
          // Es recuperación de contraseña, redirigir al reset-password
          router.push(`/reset-password#${hash}`)
          return
        }
        
        if (accessToken) {
          // Es un login normal, intentar establecer sesión
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token') || ''
            })
            
            if (error) {
              console.error('Error estableciendo sesión:', error)
              router.push('/login?error=auth_failed')
            } else {
              router.push('/dashboard')
            }
          } catch (error) {
            console.error('Error en callback:', error)
            router.push('/login')
          }
        }
      } else {
        // Si no hay hash, redirigir al login
        router.push('/login')
      }
    }

    handleCallback()
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
