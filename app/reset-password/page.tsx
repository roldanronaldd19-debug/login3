'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un hash en la URL (para recuperación de contraseña)
    const hash = window.location.hash
    console.log('Hash en reset-password:', hash)
    
    if (hash) {
      // Procesar el hash de Supabase
      processHash(hash)
    } else {
      // Verificar sesión normal
      checkSession()
    }
  }, [])

  const processHash = (hash: string) => {
    // Extraer parámetros del hash (#access_token=...&refresh_token=...&type=...)
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    const type = params.get('type')
    
    if (accessToken && type === 'recovery') {
      // Establecer sesión con el token de recuperación
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: ''
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error estableciendo sesión:', error)
          setMessage({ 
            type: 'error', 
            text: 'Enlace de recuperación inválido o expirado.' 
          })
        } else if (data.session) {
          setSession(data.session)
          setEmail(data.session.user.email || '')
        }
      })
    }
  }

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setSession(session)
        setEmail(session.user.email || '')
      } else {
        setMessage({ 
          type: 'error', 
          text: 'No tienes permiso para restablecer la contraseña. Usa un enlace válido.' 
        })
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
  }

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
        text: '✅ ¡Contraseña actualizada exitosamente! Redirigiendo...' 
      })
      
      // Cerrar sesión y redirigir al login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?message=password_updated')
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
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-center">Nueva Contraseña</h2>
          <p className="mt-2 text-center text-gray-600">
            Crea una nueva contraseña para tu cuenta
          </p>
          {email && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800">Email:</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">{email}</p>
            </div>
          )}
        </div>

        {!session ? (
          <div className="text-center space-y-4">
            <div className="text-red-600 mb-4">
              No tienes permiso para restablecer la contraseña.
            </div>
            <div className="space-y-3">
              <a 
                href="/forgot-password" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Solicitar nuevo enlace
              </a>
              <p className="text-sm text-gray-600">o</p>
              <Link 
                href="/login" 
                className="inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                <div className="flex items-start">
                  <span className="mr-2 text-xl mt-0.5">
                    {message.type === 'success' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Nueva Contraseña
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Requisitos de seguridad:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{password.length >= 8 ? '✓' : '○'}</span>
                      <span className="text-sm">Mínimo 8 caracteres</span>
                    </div>
                    <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                      <span className="text-sm">Al menos una minúscula</span>
                    </div>
                    <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      <span className="text-sm">Al menos una mayúscula</span>
                    </div>
                    <div className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/\d/.test(password) ? '✓' : '○'}</span>
                      <span className="text-sm">Al menos un número</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Confirmar Contraseña
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">❌</span> Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Actualizando contraseña...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Actualizar Contraseña
                </div>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
