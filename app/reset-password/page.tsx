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
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión activa (necesaria para resetear contraseña)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Si no hay sesión, podría ser que el usuario llegó sin el token
        setMessage({ 
          type: 'error', 
          text: 'Enlace inválido o expirado. Por favor solicita un nuevo enlace de recuperación.' 
        })
      } else {
        setSession(session)
      }
    }

    checkSession()
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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: '¡Contraseña actualizada exitosamente!' 
      })
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
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
            <a 
              href="/forgot-password" 
              className="text-blue-600 hover:text-blue-800"
            >
              Solicitar nuevo enlace
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

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
