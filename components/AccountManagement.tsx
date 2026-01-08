'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AccountManagement() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [invitationLink, setInvitationLink] = useState('')

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setInvitationLink('')

    try {
      // Crear un enlace de registro personalizado
      const registrationLink = `https://login3-three.vercel.app/register?invite=${btoa(email)}&email=${encodeURIComponent(email)}`
      
      // Aquí normalmente enviarías el email con el enlace
      // Para este ejemplo, solo mostramos el enlace
      
      setInvitationLink(registrationLink)
      setMessage({ 
        type: 'success', 
        text: `Invitación creada para ${email}. Copia el enlace y envíalo al usuario.` 
      })
      
      // Opcional: Podrías guardar la invitación en tu base de datos
      // const { error } = await supabase.from('invitations').insert({
      //   email: email,
      //   invitation_link: registrationLink,
      //   created_at: new Date().toISOString()
      // })

      setEmail('')
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink)
      .then(() => {
        alert('Enlace copiado al portapapeles')
      })
      .catch(err => {
        console.error('Error al copiar:', err)
      })
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-medium mb-2">Enviar Invitación</h4>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el email del usuario que deseas invitar al sistema.
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Invitación'}
        </button>
      </form>

      {invitationLink && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-2">Enlace de invitación:</h5>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={invitationLink}
              readOnly
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Comparte este enlace con el usuario para que pueda registrarse.
          </p>
        </div>
      )}

      <div className="border-t pt-4">
        <h5 className="font-medium mb-2">Instrucciones:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Ingresa el email del usuario a invitar</li>
          <li>2. Haz clic en "Enviar Invitación"</li>
          <li>3. Copia el enlace generado</li>
          <li>4. Envía el enlace al usuario por email o mensaje</li>
          <li>5. El usuario hará clic en el enlace para registrarse</li>
        </ul>
      </div>
    </div>
  )
}
