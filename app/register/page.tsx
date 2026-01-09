'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [token, setToken] = useState<string>('')
  const [invitationValid, setInvitationValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay un token en la URL (de la invitación)
    const hash = window.location.hash
    const urlToken = searchParams.get('token')
    
    if (hash) {
      // Extraer token del hash (#access_token=...)
      const tokenMatch = hash.match(/access_token=([^&]+)/)
      if (tokenMatch) {
        setToken(tokenMatch[1])
        verifyInvitation(tokenMatch[1])
      }
    } else if (urlToken) {
      setToken(urlToken)
      verifyInvitation(urlToken)
    } else {
      setInvitationValid(false)
      setMessage({
        type: 'error',
        text: 'Enlace de invitación inválido o expirado. Contacta al administrador.'
      })
    }
  }, [searchParams])

  const verifyInvitation = async (invitationToken: string) => {
    try {
      // Verificar el token con Supabase
      const { data, error } = await supabase.auth.getUser(invitationToken)
      
      if (error || !data.user) {
        setInvitationValid(false)
        setMessage({
          type: 'error',
          text: 'Enlace de invitación inválido o expirado. Contacta al administrador.'
        })
        return
      }

      // El usuario existe (fue creado por la invitación)
      setEmail(data.user.email || '')
      setInvitationValid(true)
      
    } catch (error) {
      console.error('Error verificando invitación:', error)
      setInvitationValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validaciones
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
      // 1. Si hay token, actualizar la contraseña del usuario existente
      if (token) {
        const { error } = await supabase.auth.updateUser({
          password: password
        })

        if (error) throw error

        // 2. Actualizar el email confirmado
        const { error: confirmError } = await supabase.auth.updateUser({
          email_confirm: true
        })

        if (confirmError) console.warn('Warning confirming email:', confirmError)

        setMessage({ 
          type: 'success', 
          text: '✅ Contraseña establecida exitosamente. Redirigiendo...' 
        })

        // 3. Iniciar sesión automáticamente
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          // Si no puede iniciar sesión, redirigir al login
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          // Si inicia sesión exitosamente, redirigir al dashboard
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } else {
        // Flujo normal de registro (no debería ocurrir aquí)
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
          text: '✅ Registro completado. Por favor verifica tu email.' 
        })
        
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  if (invitationValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center text-red-600">Invitación Inválida</h2>
            <p className="mt-2 text-center text-gray-600">
              El enlace de invitación es inválido, expiró o ya fue utilizado.
            </p>
          </div>
          
          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
          
          <div className="text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
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
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-center">Completar Registro</h2>
          <p className="mt-2 text-center text-gray-600">
            Crea tu contraseña para acceder al sistema
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
            <p className="font-medium">Email: {email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              <div className="flex items-start">
                <span className="mr-2 text-lg">
                  {message.type === 'success' ? '✅' : '❌'}
                </span>
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Contraseña
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
            <div className="mt-2 text-xs text-gray-500">
              <p>Requisitos de seguridad:</p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>Mínimo 8 caracteres</li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>Al menos una minúscula</li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>Al menos una mayúscula</li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>Al menos un número</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
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
              <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              '✅ Completar Registro'
            )}
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>Al completar el registro, aceptas los términos y condiciones del sistema.</p>
          </div>
        </form>
      </div>
    </div>
  )
}
