'use client'

import { useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isInvited, setIsInvited] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar si hay parámetros de invitación en la URL
  const inviteParam = searchParams.get('invite')
  const emailParam = searchParams.get('email')
  
  if (inviteParam && emailParam && !isInvited) {
    try {
      const decodedEmail = atob(inviteParam)
      if (decodedEmail === emailParam) {
        setEmail(emailParam)
        setIsInvited(true)
      }
    } catch (error) {
      console.error('Error decoding invite:', error)
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

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://login3-three.vercel.app/auth/callback'
        }
      })
      
      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Registro exitoso. Por favor verifica tu email para activar tu cuenta.' 
      })
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!isInvited) {
    return (
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-center">Acceso Restringido</h2>
          <p className="mt-4 text-gray-600">
            El registro en este sistema es solo por invitación.
          </p>
          <p className="mt-2 text-gray-600">
            Si recibiste una invitación, asegúrate de usar el enlace proporcionado.
          </p>
          <div className="mt-6">
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div>
        <h2 className="text-3xl font-bold text-center">Completar Registro</h2>
        <p className="mt-2 text-center text-gray-600">
          Crear cuenta para: <span className="font-semibold">{email}</span>
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
            readOnly
            className="w-full p-2 border rounded bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Este email fue invitado al sistema</p>
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
          {loading ? 'Registrando...' : 'Completar Registro'}
        </button>

        <div className="text-center text-sm">
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </div>
      </form>
    </div>
  )
}

// Loading fallback component
function RegisterLoading() {
  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

// Página principal con Suspense
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<RegisterLoading />}>
        <RegisterContent />
      </Suspense>
    </div>
  )
}
