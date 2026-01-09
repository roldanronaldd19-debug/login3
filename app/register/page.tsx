'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [invitationValid, setInvitationValid] = useState<boolean | null>(null)
  const [invitationData, setInvitationData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Leer parámetros de la URL
    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (token && emailParam) {
      // Verificar la invitación
      verifyInvitation(token, decodeURIComponent(emailParam))
    } else {
      setInvitationValid(false)
      setMessage({
        type: 'error',
        text: 'Enlace de invitación inválido. Contacta al administrador.'
      })
    }
  }, [])

  const verifyInvitation = async (token: string, invitedEmail: string) => {
    try {
      // Verificar la invitación en la base de datos
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('*')
        .eq('token', token)
        .eq('email', invitedEmail)
        .single()

      if (error || !data) {
        throw new Error('Invitación no encontrada')
      }

      // Verificar que no haya expirado
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('La invitación ha expirado')
      }

      // Verificar que no haya sido usada
      if (data.used_at) {
        throw new Error('Esta invitación ya fue utilizada')
      }

      setEmail(invitedEmail)
      setInvitationData(data)
      setInvitationValid(true)
      
    } catch (error: any) {
      console.error('Error verificando invitación:', error)
      setInvitationValid(false)
      setMessage({
        type: 'error',
        text: error.message || 'Enlace de invitación inválido o expirado.'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validaciones
    if (!email) {
      setMessage({ type: 'error', text: 'El email es requerido' })
      setLoading(false)
      return
    }

    if (email !== invitationData?.email) {
      setMessage({ type: 'error', text: 'El email no coincide con la invitación' })
      setLoading(false)
      return
    }

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
      // 1. Registrar el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: invitationData.role
          },
          emailRedirectTo: 'https://login3-three.vercel.app/auth/callback'
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Usa "¿Olvidaste tu contraseña?" si no la recuerdas.')
        }
        throw authError
      }

      // 2. Marcar la invitación como usada
      if (invitationData?.token) {
        await supabase
          .from('pending_invitations')
          .update({ 
            used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('token', invitationData.token)
      }

      // 3. Crear perfil en user_profiles
      if (authData.user) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: authData.user.id,
            email: email,
            role: invitationData.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          })
      }

      setMessage({ 
        type: 'success', 
        text: '✅ Registro completado exitosamente. Redirigiendo al inicio de sesión...' 
      })

      // 4. Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login?message=registration_success')
      }, 3000)

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
              {message?.text || 'El enlace de invitación es inválido, expiró o ya fue utilizado.'}
            </p>
          </div>
          
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-center">Completar Registro</h2>
          <p className="mt-2 text-center text-gray-600">
            Has sido invitado como <span className="font-semibold capitalize">{invitationData?.role}</span>
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-800">Instrucciones:</p>
            <p className="text-sm text-blue-700 mt-1">
              Ingresa tu información para crear tu cuenta. El email debe coincidir con la invitación.
            </p>
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
                disabled={!!invitationData?.email}
              />
              {invitationData?.email && (
                <p className="text-xs text-gray-500 mt-1">
                  Email de la invitación: <span className="font-semibold">{invitationData.email}</span>
                </p>
              )}
            </div>

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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Información importante</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• El email debe coincidir exactamente con la invitación recibida</p>
                  <p>• Tu rol será: <span className="font-semibold capitalize">{invitationData?.role}</span></p>
                  <p>• Después del registro, podrás iniciar sesión normalmente</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creando cuenta...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Crear Mi Cuenta
              </div>
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Tienes una cuenta?{' '}
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
