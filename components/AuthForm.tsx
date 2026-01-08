'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'

// Schemas separados
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

const registerSchema = loginSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

// Tipos explícitos
type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

type AuthFormData = LoginFormData | RegisterFormData | ForgotPasswordFormData

interface AuthFormProps {
  mode: 'login' | 'register' | 'forgot-password'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const getSchema = () => {
    switch (mode) {
      case 'login': return loginSchema
      case 'register': return registerSchema
      case 'forgot-password': return forgotPasswordSchema
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AuthFormData>({
    resolver: zodResolver(getSchema())
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setMessage(null)

    try {
      switch (mode) {
        case 'login':
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          })
          
          if (loginError) throw loginError
          setMessage({ type: 'success', text: 'Inicio de sesión exitoso' })
          window.location.href = '/dashboard'
          break

        case 'register':
          const { error: registerError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })
          
          if (registerError) throw registerError
          setMessage({ type: 'success', text: 'Registro exitoso. Por favor verifica tu email.' })
          reset()
          break

        case 'forgot-password':
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
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
          onClick={() => setEmailSent(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          ¿No lo recibiste? Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          className="w-full p-2 border rounded"
          placeholder="tu@email.com"
        />
        {(errors as any).email && (
          <p className="text-red-500 text-sm mt-1">{(errors as any).email.message}</p>
        )}
      </div>

      {(mode === 'login' || mode === 'register') && (
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            {...register('password')}
            type="password"
            className="w-full p-2 border rounded"
            placeholder="••••••••"
          />
          {(errors as any).password && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).password.message}</p>
          )}
        </div>
      )}

      {mode === 'register' && (
        <div>
          <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="w-full p-2 border rounded"
            placeholder="••••••••"
          />
          {(errors as any).confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{(errors as any).confirmPassword.message}</p>
          )}
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
