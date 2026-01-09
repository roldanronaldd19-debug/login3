'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token en el hash de la URL
    const hash = window.location.hash
    
    if (hash) {
      // Procesar el hash para extraer el token
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')
      
      if (accessToken && type === 'recovery') {
        // Establecer sesión con el token de recuperación
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error estableciendo sesión:', error)
            setMessage({ 
              type: 'error', 
              text: 'Enlace inválido o expirado. Solicita un nuevo enlace.' 
            })
          } else if (data.session) {
            setSession(data.session)
            setEmail(data.session.user.email || '')
          }
        })
      }
    } else {
      // Si no hay hash, verificar sesión normal
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session)
          setEmail(session.user.email || '')
        } else {
          setMessage({ 
            type: 'error', 
            text: 'No tienes permiso para restablecer la contraseña.' 
          })
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' })
      setLoading(false)
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setMessage({ 
        type: 'error', 
        text: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número' 
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '✅ ¡Contraseña actualizada exitosamente! Iniciando sesión...' 
      })
      
      // Iniciar sesión automáticamente con la nueva contraseña
      setTimeout(async () => {
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (signInError) {
            console.warn('Error iniciando sesión automáticamente:', signInError)
            router.push('/login?message=password_updated')
          } else {
            router.push('/dashboard')
          }
        } catch (signInErr) {
          router.push('/login?message=password_updated')
        }
      }, 2000)
      
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error)
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message || 'Error al actualizar la contraseña'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Establecer Contraseña</h2>
          <p className="mt-2 text-center text-gray-600">
            {email ? `Para: ${email}` : 'Crea una nueva contraseña para tu cuenta'}
          </p>
        </div>

        {!session ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">
              {message?.text || 'Cargando...'}
            </div>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                <div className="flex items-start">
                  <span className="mr-2 text-xl mt-0.5">
                    {message.type === 'success' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="text-sm text-gray-500 mt-2">
                Mínimo 8 caracteres, incluyendo mayúscula, minúscula y número
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Estableciendo contraseña...
                </div>
              ) : (
                '🔐 Establecer Contraseña y Acceder'
              )}
            </button>

            <div className="text-center text-sm">
              <a href="/login" className="text-blue-600 hover:text-blue-800">
                ← Volver al inicio de sesión
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
