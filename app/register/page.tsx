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
  const [tokenType, setTokenType] = useState<'invite' | 'recovery' | null>(null)
  const [accessToken, setAccessToken] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // Leer parámetros DIRECTAMENTE de window.location SIN useSearchParams
    const hash = window.location.hash
    const urlSearchParams = new URLSearchParams(window.location.search)
    const type = urlSearchParams.get('type')
    
    console.log('Hash:', hash)
    console.log('Type from URL:', type)
    console.log('Full URL:', window.location.href)
    
    if (hash) {
      // Procesar token del hash (para invitaciones)
      const params = new URLSearchParams(hash.replace('#', ''))
      const token = params.get('access_token')
      const hashType = params.get('type')
      
      if (token && hashType === 'invite') {
        setAccessToken(token)
        setTokenType('invite')
        verifyToken(token)
      } else if (token && hashType === 'recovery') {
        setAccessToken(token)
        setTokenType('recovery')
        verifyToken(token)
      } else {
        setMessage({
          type: 'error',
          text: 'Enlace inválido o expirado. Contacta al administrador.'
        })
      }
    } else if (type === 'recovery') {
      // Para recuperación sin hash
      setTokenType('recovery')
    } else {
      setMessage({
        type: 'error',
        text: 'Enlace inválido o expirado. Contacta al administrador.'
      })
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      // Verificar el token con Supabase
      const { data, error } = await supabase.auth.getUser(token)
      
      if (error || !data.user) {
        console.error('Error verificando token:', error)
        setMessage({
          type: 'error',
          text: 'Enlace inválido o expirado. Contacta al administrador.'
        })
        return
      }

      // El usuario existe o fue invitado
      setEmail(data.user.email || '')
      
    } catch (error) {
      console.error('Error verificando token:', error)
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
      if (tokenType === 'invite' && accessToken) {
        // Flujo de invitación: usuario ya existe, solo necesita contraseña
        
        // 1. Establecer sesión con el token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        })

        if (sessionError) {
          console.warn('Error estableciendo sesión:', sessionError)
        }

        // 2. Actualizar contraseña
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) throw updateError

        setMessage({ 
          type: 'success', 
          text: '✅ Contraseña establecida exitosamente. Redirigiendo...' 
        })

        // 3. Iniciar sesión automáticamente
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

      } else if (tokenType === 'recovery' && accessToken) {
        // Flujo de recuperación: establecer nueva contraseña
        
        // 1. Establecer sesión con el token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        })

        if (sessionError) {
          console.warn('Error estableciendo sesión:', sessionError)
        }

        // 2. Actualizar contraseña
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) throw updateError

        setMessage({ 
          type: 'success', 
          text: '✅ Contraseña actualizada exitosamente. Redirigiendo...' 
        })

        setTimeout(() => {
          router.push('/login?message=password_updated')
        }, 2000)

      } else {
        // Flujo normal de registro (no debería ocurrir aquí)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://login3-three.vercel.app/auth/callback'
          }
        })

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Este email ya está registrado. Usa "¿Olvidaste tu contraseña?" si no la recuerdas.')
          }
          throw error
        }

        setMessage({ 
          type: 'success', 
          text: '✅ Registro completado. Por favor verifica tu email.' 
        })
        
        setTimeout(() => {
          router.push('/login?message=registration_success')
        }, 3000)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-center">
            {tokenType === 'recovery' ? 'Restablecer Contraseña' : 'Completar Registro'}
          </h2>
          <p className="mt-2 text-center text-gray-600">
            {tokenType === 'recovery' 
              ? 'Crea una nueva contraseña para tu cuenta'
              : 'Crea tu contraseña para acceder al sistema'}
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
              />
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

          <button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {tokenType === 'recovery' ? 'Actualizando...' : 'Creando cuenta...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {tokenType === 'recovery' ? 'Actualizar Contraseña' : 'Crear Mi Cuenta'}
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
