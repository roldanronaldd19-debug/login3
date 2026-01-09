'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Enviar enlace de recuperación usando Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://login3-three.vercel.app/reset-password'
      })
      
      if (error) throw error
      
      setEmailSent(true)
      setMessage({ 
        type: 'success', 
        text: 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.' 
      })
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-center">Revisa tu email</h2>
            <p className="mt-2 text-center text-gray-600">
              Hemos enviado un enlace para restablecer tu contraseña.
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📧 Enlace enviado a: <span className="font-semibold">{email}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Si no ves el email, revisa tu carpeta de spam.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="w-full text-blue-600 hover:text-blue-800 font-medium"
            >
              ¿No lo recibiste? Intentar con otro email
            </button>
            
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Recuperar Contraseña</h2>
          <p className="mt-2 text-center text-gray-600">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

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

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Email
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="tu@email.com"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Enviando...
              </div>
            ) : (
              '📨 Enviar enlace de recuperación'
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
