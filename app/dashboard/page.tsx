'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        setLoading(false)
      }
    }

    checkAuth()

    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMessage(null)

    try {
      // Enviar invitación usando la función de invitación de Supabase
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        redirectTo: 'https://login3-three.vercel.app/auth/callback'
      })

      if (error) throw error

      setInviteMessage({ 
        type: 'success', 
        text: `Invitación enviada a ${inviteEmail}. El usuario recibirá un email para crear su cuenta.` 
      })
      setInviteEmail('')
      setShowDropdown(false)
      
    } catch (error: any) {
      setInviteMessage({ 
        type: 'error', 
        text: error.message || 'Error al enviar la invitación' 
      })
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            
            {/* Dropdown del usuario */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span>{user?.email}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 top-12 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4 border-b">
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-gray-500">
                      {user?.email_verified ? '✓ Verificado' : 'Email no verificado'}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Gestión de Cuentas</h3>
                    
                    {inviteMessage && (
                      <div className={`mb-3 p-2 text-sm rounded ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {inviteMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleSendInvite} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email del invitado</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                          placeholder="invitado@ejemplo.com"
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="w-full bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {inviteLoading ? 'Enviando...' : 'Enviar invitación'}
                      </button>
                    </form>
                  </div>

                  <div className="p-4 border-t">
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-red-600 text-white p-2 rounded text-sm hover:bg-red-700"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.email}</h2>
          <p className="text-gray-600 mb-4">
            Sistema de autenticación por invitación
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Gestión de Acceso</h3>
              <p className="text-gray-600">
                Acceso restringido solo por invitación
              </p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Enviar Invitaciones</h3>
              <p className="text-gray-600">
                Haz clic en tu email en la barra superior para enviar invitaciones
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Seguridad</h3>
              <p className="text-gray-600">
                Autenticación protegida por Supabase
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">¿Cómo invitar usuarios?</h3>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>Haz clic en tu email en la esquina superior derecha</li>
              <li>En "Gestión de Cuentas", ingresa el email del invitado</li>
              <li>Haz clic en "Enviar invitación"</li>
              <li>El usuario recibirá un email para crear su cuenta</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
