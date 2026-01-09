'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Componente principal envuelto en Suspense
function RegisterContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [invitationValid, setInvitationValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar si hay un token en la URL (de la invitación)
    const hash = window.location.hash
    const urlToken = searchParams.get('token')
    const type = searchParams.get('type')
    
    console.log('Hash:', hash)
    console.log('URL params:', { token: urlToken, type })
    
    // Para invitaciones de Supabase, el token viene en el hash
    if (hash) {
      // Procesar el hash de Supabase
      processHash(hash)
    } else if (urlToken && type === 'invite') {
      // Token en query params
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

  const processHash = (hash: string) => {
    // Extraer parámetros del hash (#access_token=...&refresh_token=...)
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    const type = params.get('type')
    
    if (accessToken && type === 'invite') {
      setToken(accessToken)
      verifyInvitation(accessToken)
    } else {
      setInvitationValid(false)
    }
  }

  const verifyInvitation = async (invitationToken: string) => {
    try {
      // Verificar el token con Supabase
      const { data, error } = await supabase.auth.getUser(invitationToken)
      
      if (error || !data.user) {
        console.error('Error verificando token:', error)
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

  const setToken = (token: string) => {
    // Guardar token en localStorage temporalmente
    if (typeof window !== 'undefined') {
      localStorage.setItem('invitation_token', token)
    }
  }

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('invitation_token')
    }
    return null
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
      const token = getToken()
      
      if (token) {
        // 1. Establecer la sesión con el token de invitación
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '' // Refresh token no disponible en invitaciones
        })

        if (sessionError) {
          console.warn('Error estableciendo sesión:', sessionError)
          // Continuar de todos modos
        }

        // 2. Actualizar la contraseña del usuario
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) {
          // Si falla por sesión, intentar de otra manera
          console.error('Error actualizando contraseña:', updateError)
          throw new Error('No se pudo establecer la contraseña. Intenta recargar la página.')
        }

        setMessage({ 
          type: 'success', 
          text: '✅ Contraseña establecida exitosamente. Redirigiendo...' 
        })

        // 3. Iniciar sesión con la nueva contraseña
        setTimeout(async () => {
          try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            })

            if (signInError) {
              console.warn('Error iniciando sesión:', signInError)
              router.push('/login?message=registration_success')
            } else {
              router.push('/dashboard')
            }
          } catch (signInErr) {
            router.push('/login?message=registration_success')
          }
        }, 2000)

      } else {
        // No hay token - flujo de registro normal
        setMessage({ 
          type: 'error', 
          text: 'Token de invitación no encontrado. Recarga la página o contacta al administrador.' 
        })
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      setMessage({ 
        type: 'error', 
        text: `❌ ${error.message || 'Error al completar el registro'}` 
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-800">Email registrado:</p>
            <p className="text-lg font-semibold text-blue-900 mt-1">{email}</p>
          </div>
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contraseña
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                Estableciendo contraseña...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Completar Registro y Acceder
              </div>
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Problemas con el registro?{' '}
              <a href="mailto:soporte@tudominio.com" className="text-blue-600 hover:text-blue-800 font-medium">
                Contactar soporte
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente principal con Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Cargando página de registro...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
