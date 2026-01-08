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
      // Usar la función de invitación por email de Supabase
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://login3-three.vercel.app/register'
      })

      if (error) {
        // Si el usuario ya existe, mostrar mensaje diferente
        if (error.message.includes('already registered')) {
          setMessage({ 
            type: 'error', 
            text: `El usuario ${email} ya está registrado en el sistema.` 
          })
        } else {
          throw error
        }
      } else {
        setMessage({ 
          type: 'success', 
          text: `¡Invitación enviada exitosamente a ${email}! El usuario recibirá un email con el enlace de registro.` 
        })
        setEmail('')
      }
      
    } catch (error: any) {
      console.error('Error enviando invitación:', error)
      setMessage({ 
        type: 'error', 
        text: `Error al enviar invitación: ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Enviar Invitación por Email</h4>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el email del usuario que deseas invitar. Recibirá un email con un enlace para registrarse.
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
            El usuario recibirá un email con un enlace de invitación.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enviando invitación...' : 'Enviar Invitación por Email'}
        </button>
      </form>

      <div className="border-t pt-4">
        <h5 className="font-medium mb-2">Cómo funciona:</h5>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
            <span>Ingresa el email del usuario a invitar</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
            <span>El usuario recibirá un email de Supabase con enlace de invitación</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
            <span>El usuario hace clic en el enlace y es redirigido a la página de registro</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
            <span>Completa el registro con su contraseña</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">5</span>
            <span>¡Listo! Puede iniciar sesión con sus credenciales</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-800 mb-1">Nota importante:</h5>
        <p className="text-sm text-yellow-700">
          Necesitas configurar las invitaciones por email en el dashboard de Supabase para que funcione correctamente.
        </p>
      </div>
    </div>
  )
}
