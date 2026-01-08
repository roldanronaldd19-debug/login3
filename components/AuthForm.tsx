'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'register' | 'forgot-password'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      switch (mode) {
        case 'login':
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (loginError) throw loginError
          setMessage({ type: 'success', text: 'Inicio de sesión exitoso' })
          // Redirigir al dashboard usando router
          router.push('/dashboard')
          break

        case 'register':
          if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden')
          }
          
          const { error: registerError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/api/auth/callback`
            }
          })
          
          if (registerError) throw registerError
          setMessage({ type: 'success', text: 'Registro exitoso. Por favor verifica tu email.' })
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          break

        case 'forgot-password':
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })
          
          if (resetError) throw resetError
          setEmailSent(true)
          setMessage({ 
            type: 'success', 
            text: 'Se ha enviado un enlace de recuperación a tu email' 
          })
          break
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'forgot-password' && emailSent) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Revisa tu email</h2>
        <p className="mb-4">Hemos enviado un enlace para restablecer tu contraseña.</p>
        <button
          onClick={() => {
            setEmailSent(false)
            setEmail('')
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          ¿No lo recibiste? Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
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
      </div>

      {(mode === 'login' || mode === 'register') && (
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
      )}

      {mode === 'register' && (
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
      )}

      {mode === 'login' && (
        <div className="text-right">
          <a 
            href="/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Cargando...' : 
          mode === 'login' ? 'Iniciar Sesión' :
          mode === 'register' ? 'Registrarse' :
          'Enviar enlace de recuperación'}
      </button>

      <div className="text-center text-sm">
        {mode === 'login' ? (
          <p>
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-800">
              Regístrate
            </a>
          </p>
        ) : mode === 'register' ? (
          <p>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800">
              Inicia sesión
            </a>
          </p>
        ) : (
          <p>
            <a href="/login" className="text-blue-600 hover:text-blue-800">
              Volver al inicio de sesión
            </a>
          </p>
        )}
      </div>
    </form>
  )
}
