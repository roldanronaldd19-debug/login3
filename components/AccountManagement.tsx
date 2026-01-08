'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AccountManagement() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Método 1: Usar signUp con un password temporal
      // Esto enviará automáticamente un email de confirmación
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temporary_password_' + Math.random().toString(36).slice(2), // Password temporal
        options: {
          emailRedirectTo: 'https://login3-three.vercel.app/register',
          data: {
            invited: true,
            invitation_date: new Date().toISOString()
          }
        }
      })

      if (error) {
        // Si el usuario ya existe, intentar enviar reset password
        if (error.message.includes('already registered')) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://login3-three.vercel.app/reset-password'
          })
          
          if (resetError) throw new Error('El usuario ya existe. Se ha enviado un enlace para recuperar contraseña.')
          
          setMessage({ 
            type: 'success', 
            text: `✅ El usuario ${email} ya existe. Se ha enviado un enlace para recuperar contraseña.` 
          })
          setEmail('')
          setLoading(false)
          return
        }
        throw error
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Invitación enviada exitosamente a ${email}. El usuario recibirá un email con el enlace para completar el registro.` 
      })
      
      setEmail('')
      
    } catch (error: any) {
      console.error('Error completo:', error)
      
      let errorMessage = error.message
      if (error.message.includes('rate limit')) {
        errorMessage = 'Límite de envíos alcanzado. Por favor, intenta más tarde.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'El usuario necesita confirmar su email primero.'
      }
      
      setMessage({ type: 'error', text: `❌ Error: ${errorMessage}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-medium mb-2">Enviar Invitación por Email</h4>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el email del usuario que deseas invitar. Recibirá un email con el enlace de registro.
        </p>
      </div>

      <form onSubmit={handleSendInvitation} className="space-y-4">
        {message && (
          <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email del usuario</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="usuario@ejemplo.com"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            El usuario recibirá un email directamente de Supabase
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando invitación...
            </>
          ) : (
            '📧 Enviar Invitación por Email'
          )}
        </button>
      </form>

      <div className="border-t pt-4">
        <h5 className="font-medium mb-2">📋 ¿Cómo funciona?</h5>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Ingresas el email del usuario</li>
          <li>Supabase envía automáticamente un email de invitación</li>
          <li>El email contiene un enlace para completar el registro</li>
          <li>El usuario hace clic y establece su contraseña</li>
          <li>¡Listo! Puede iniciar sesión</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> El usuario debe usar el mismo email al que se envió la invitación.
          </p>
        </div>
      </div>
    </div>
  )
}
