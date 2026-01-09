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
  const [isProcessingCode, setIsProcessingCode] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Manejar el código de recuperación de Supabase
    const handleRecoveryCode = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        console.log('Código de recuperación:', code)
        
        if (code) {
          // Supabase envía el código como query parameter, no como hash
          setIsProcessingCode(true)
          
          // Intercambiar el código por una sesión
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error intercambiando código:', error)
            setMessage({ 
              type: 'error', 
              text: 'El enlace de recuperación es inválido o ha expirado.' 
            })
            setIsProcessingCode(false)
            return
          }
          
          // Obtener la sesión actual
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            setSession(session)
            console.log('Sesión establecida para:', session.user.email)
          }
        } else {
          // Verificar si ya hay una sesión activa
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            setSession(session)
          } else {
            setMessage({ 
              type: 'error', 
              text: 'No tienes permiso para restablecer la contraseña. Solicita un nuevo enlace.' 
            })
          }
        }
      } catch (error: any) {
        console.error('Error en handleRecoveryCode:', error)
        setMessage({ 
          type: 'error', 
          text: 'Error al procesar el enlace de recuperación.' 
        })
      } finally {
        setIsProcessingCode(false)
      }
    }

    handleRecoveryCode()
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

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      setLoading(false)
      return
    }

    try {
      // Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '¡Contraseña actualizada exitosamente!' 
      })
      
      // Cerrar sesión y redirigir al login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?message=password_reset_success')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar la contraseña' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (isProcessingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Procesando enlace de recuperación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Nueva Contraseña</h2>
          <p className="mt-2 text-center text-gray-600">
            Crea una nueva contraseña para tu cuenta
          </p>
        </div>

        {!session ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">
              No tienes permiso para restablecer la contraseña.
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                El enlace de recuperación es inválido, expiró o ya fue utilizado.
              </p>
              <div className="space-y-2">
                <a 
                  href="/forgot-password" 
                  className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Solicitar nuevo enlace
                </a>
                <a 
                  href="/login" 
                  className="inline-block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Volver al inicio de sesión
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Estableciendo nueva contraseña para: <span className="font-semibold">{session.user.email}</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>

            <div className="text-center text-sm">
              <a href="/login" className="text-blue-600 hover:text-blue-800">
                Volver al inicio de sesión
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
