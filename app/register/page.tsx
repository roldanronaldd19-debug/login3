'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkInvitation = async () => {
      // Verificar si hay un token en la URL (de la invitación)
      const hash = window.location.hash
      console.log('Hash de la URL:', hash)
      
      if (hash) {
        // Extraer token de la URL hash
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')
        
        console.log('Token encontrado:', { accessToken, type })
        
        if (accessToken && type === 'invite') {
          setToken(accessToken)
          
          try {
            // Establecer la sesión con el token de invitación
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              console.error('Error estableciendo sesión:', error)
              setMessage({ 
                type: 'error', 
                text: 'Enlace de invitación inválido o expirado.' 
              })
              return
            }
            
            if (data?.user?.email) {
              setEmail(data.user.email)
              setInviteData({
                email: data.user.email,
                user_metadata: data.user.user_metadata
              })
            }
          } catch (error) {
            console.error('Error procesando invitación:', error)
          }
        }
      }
    }

    checkInvitation()
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
      // Si hay token de invitación, usar updateUser
      if (token) {
        console.log('Actualizando usuario con token de invitación...')
        
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) {
          console.error('Error actualizando usuario:', updateError)
          throw updateError
        }

        setMessage({ 
          type: 'success', 
          text: '¡Contraseña establecida exitosamente! Redirigiendo...' 
        })
        
        // Esperar y redirigir al dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        
      } else {
        // Registro normal (no debería ocurrir en tu caso)
        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: 'https://login3-three.vercel.app/auth/callback'
          }
        })

        if (signUpError) throw signUpError

        setMessage({ 
          type: 'success', 
          text: 'Registro exitoso. Por favor verifica tu email.' 
        })
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      }
      
    } catch (error: any) {
      console.error('Error en registro:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al completar el registro' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            {token ? 'Completar Registro' : 'Registro por Invitación'}
          </h2>
          <p className="mt-2 text-center text-gray-600">
            {token 
              ? 'Establece tu contraseña para activar tu cuenta'
              : 'Esta página solo es accesible mediante invitación'}
          </p>
          
          {inviteData && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <p><strong>Email:</strong> {inviteData.email}</p>
              {inviteData.user_metadata?.role && (
                <p><strong>Rol asignado:</strong> {inviteData.user_metadata.role}</p>
              )}
            </div>
          )}
          
          {!token && (
            <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-800">
              <p>⚠️ Esta página solo es accesible mediante invitación del administrador.</p>
              <p className="mt-1">Si recibiste una invitación, asegúrate de usar el enlace completo del email.</p>
            </div>
          )}
        </div>

        {token ? (
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
                required
              />
              <p className="text-xs text-gray-500 mt-1">Este email fue proporcionado en la invitación</p>
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
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
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
              {loading ? 'Procesando...' : 'Establecer Contraseña'}
            </button>

            <div className="text-center text-sm">
              <a href="/login" className="text-blue-600 hover:text-blue-800">
                ¿Ya tienes cuenta? Inicia sesión
              </a>
            </div>
          </form>
        ) : (
          <div className="text-center p-4">
            <div className="text-yellow-600 mb-4">
              No se detectó un enlace de invitación válido.
            </div>
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-800"
            >
              Volver al inicio de sesión
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
