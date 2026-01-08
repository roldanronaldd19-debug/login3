'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isValidInvitation, setIsValidInvitation] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay un token en la URL (invitación)
    const token = searchParams.get('token') || window.location.hash
    
    if (token) {
      // El usuario llegó a través de una invitación
      setIsValidInvitation(true)
      
      // Intentar obtener el email del token
      // En un caso real, aquí verificarías el token con tu backend
      // Por ahora, mostramos un formulario genérico
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Enlace de invitación inválido o expirado. Contacta al administrador.' 
      })
    }
  }, [searchParams])

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
      // Intentar completar el registro
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        // Si falla, intentar crear cuenta nueva
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://login3-three.vercel.app/dashboard'
          }
        })

        if (signUpError) throw signUpError
        
        setMessage({ 
          type: 'success', 
          text: '¡Registro completado! Serás redirigido al login.' 
        })
        
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setMessage({ 
          type: 'success', 
          text: '¡Contraseña establecida exitosamente! Serás redirigido al dashboard.' 
        })
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-2xl font-bold text-center text-red-600">Inválido</h2>
            <p className="mt-2 text-center text-gray-600">
              {message?.text || 'Este enlace de invitación no es válido.'}
            </p>
          </div>
          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-800">
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Completar Registro</h2>
          <p className="mt-2 text-center text-gray-600">
            Has sido invitado a unirte. Completa tu registro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="tu@email.com"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Usa el email al que fue enviada la invitación
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="••••••••"
              required
              minLength={6}
            />
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
            {loading ? 'Completando registro...' : 'Completar Registro'}
          </button>
        </form>
      </div>
    </div>
  )
}
