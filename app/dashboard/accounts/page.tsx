'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountsManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [sentInvitations, setSentInvitations] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        // Cargar invitaciones enviadas desde localStorage
        const savedInvitations = localStorage.getItem('sentInvitations')
        if (savedInvitations) {
          setSentInvitations(JSON.parse(savedInvitations))
        }
      }
    }

    checkAuth()
  }, [router])

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Usar la función de invitación de Supabase
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://login3-three.vercel.app/register'
      })

      if (error) {
        // Si falla la invitación admin, usar signUp normal con opción de invitación
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: Math.random().toString(36).slice(-12), // Contraseña temporal
          options: {
            emailRedirectTo: 'https://login3-three.vercel.app/register',
            data: {
              invitation: true
            }
          }
        })

        if (signUpError) throw signUpError
      }

      // Guardar en localStorage
      const updatedInvitations = [...sentInvitations, email]
      setSentInvitations(updatedInvitations)
      localStorage.setItem('sentInvitations', JSON.stringify(updatedInvitations))

      setMessage({ 
        type: 'success', 
        text: `Invitación enviada exitosamente a ${email}. El usuario recibirá un email para completar su registro.` 
      })
      setEmail('')
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const resendInvitation = async (emailToResend: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToResend, {
        redirectTo: 'https://login3-three.vercel.app/register'
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `Invitación reenviada a ${emailToResend}` 
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const removeInvitation = (emailToRemove: string) => {
    const updatedInvitations = sentInvitations.filter(e => e !== emailToRemove)
    setSentInvitations(updatedInvitations)
    localStorage.setItem('sentInvitations', JSON.stringify(updatedInvitations))
    setMessage({ type: 'success', text: `Invitación de ${emailToRemove} eliminada` })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Gestión de Cuentas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
              >
                ← Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Formulario para enviar invitación */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Enviar Invitación</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email del nuevo usuario
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="nuevo@usuario.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  El usuario recibirá un email con un enlace para registrarse
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </form>
          </div>

          {/* Lista de invitaciones enviadas */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Invitaciones Enviadas</h2>
            
            {sentInvitations.length === 0 ? (
              <p className="text-gray-500">No hay invitaciones enviadas aún.</p>
            ) : (
              <div className="space-y-3">
                {sentInvitations.map((invitedEmail, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-medium">{invitedEmail}</span>
                      <span className="ml-2 text-sm text-gray-500">• Pendiente de registro</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => resendInvitation(invitedEmail)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        disabled={loading}
                      >
                        Reenviar
                      </button>
                      <button
                        onClick={() => removeInvitation(invitedEmail)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">📋 Instrucciones</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>El usuario recibirá un email con un enlace para registrarse</li>
              <li>El enlace expira después de 24 horas</li>
              <li>El usuario podrá establecer su propia contraseña</li>
              <li>Puedes reenviar la invitación si el usuario no la recibió</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}