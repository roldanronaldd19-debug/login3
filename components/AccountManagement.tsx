'use client'

import { useState } from 'react'

export default function AccountManagement() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Usar el endpoint de Supabase directamente
      const response = await fetch('https://api.supabase.com/v1/auth/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          email: email,
          redirect_to: 'https://login3-three.vercel.app/register'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || 'Error al enviar invitación')
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Invitación enviada exitosamente a ${email}. El usuario recibirá un email con el enlace de registro.` 
      })
      
      setEmail('')
      
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-medium mb-2">Enviar Invitación por Email</h4>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el email del usuario. Recibirá un email automático con el enlace para registrarse.
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
          {loading ? 'Enviando...' : '📧 Enviar Invitación por Email'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-green-50 rounded">
        <p className="text-sm text-green-800">
          <strong>✅ Automático:</strong> El usuario recibirá directamente un email de Supabase con el enlace para registrarse.
        </p>
      </div>
    </div>
  )
}
