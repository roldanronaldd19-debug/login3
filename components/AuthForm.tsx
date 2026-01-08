'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'forgot-password'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (loginError) throw loginError
        setMessage({ type: 'success', text: 'Inicio de sesión exitoso' })
        router.push('/dashboard')
      } 
      else if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://login3-three.vercel.app/reset-password'
        })
        
        if (resetError) throw resetError
        setEmailSent(true)
        setMessage({ 
          type: 'success', 
          text: 'Se ha enviado un enlace de recuperación a tu email.' 
        })
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

      {mode === 'login' && (
        <>
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

          <div className="text-right">
            <a 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Cargando...' : 
          mode === 'login' ? 'Iniciar Sesión' : 'Enviar enlace de recuperación'}
      </button>

      {mode === 'forgot-password' && (
        <div className="text-center text-sm">
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            Volver al inicio de sesión
          </a>
        </div>
      )}
    </form>
  )
}
