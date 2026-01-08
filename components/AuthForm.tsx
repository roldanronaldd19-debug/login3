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
              emailRedirectTo: 'https://login3-three.vercel.app/auth/callback'
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
            redirectTo: 'https://login3-three.vercel.app/reset-password'
          })
          
          if (resetError) throw resetError
          setEmailSent(true)
          setMessage({ 
            type: 'success', 
            text: 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.' 
          })
          break
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  // ... resto del código igual ...
}
