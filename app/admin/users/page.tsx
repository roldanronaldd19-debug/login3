'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: 'admin' | 'tecnico' | 'usuario'
  nombre: string | null
  telefono: string | null
  created_at: string
}

// Tipo para mensajes que pueden ser string o JSX
type MessageContent = string | React.ReactNode

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'tecnico' | 'usuario'>('usuario')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: MessageContent } | null>(null)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Verificar si es admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
      loadUsers()
    }

    checkAdmin()
  }, [router])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMessage(null)

    try {
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al generar invitación')
      }

      // Mostrar el enlace de invitación para copiar
      const invitationLink = result.data.invitation_link
      
      // Crear mensaje con JSX
      const successMessage = (
        <div>
          <p className="font-semibold mb-2">✅ Invitación generada para {inviteEmail}</p>
          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-2">Enlace de invitación:</p>
            <div className="flex items-center">
              <input
                type="text"
                readOnly
                value={invitationLink}
                className="flex-1 p-2 text-sm bg-white border border-blue-300 rounded-l"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invitationLink)
                  alert('Enlace copiado al portapapeles')
                }}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-r hover:bg-blue-700"
              >
                📋 Copiar
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Envía este enlace al usuario por email o mensaje.
            </p>
          </div>
        </div>
      )

      setInviteMessage({ 
        type: 'success', 
        text: successMessage
      })
      setInviteEmail('')
      
      // Recargar lista
      setTimeout(() => {
        loadUsers()
      }, 2000)
      
    } catch (error: any) {
      console.error('Error generando invitación:', error)
      setInviteMessage({ 
        type: 'error', 
        text: `❌ ${error.message}` 
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdateLoading(userId)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Actualizar lista localmente
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error al actualizar el rol')
    } finally {
      setUpdateLoading(null)
    }
  }

  const handleResendInvite = async (email: string, role: string) => {
    if (!confirm(`¿Reenviar invitación a ${email}?`)) return

    try {
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: email,
          role: role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al reenviar invitación')
      }

      alert(`✅ Invitación reenviada a ${email}`)
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">👑 Admin: {userProfile?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Sección de Invitación */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Invitar Nuevo Usuario</h2>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              {inviteMessage && (
                <div className={`p-3 rounded ${
                  inviteMessage.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    <span className="mr-2 text-lg">
                      {inviteMessage.type === 'success' ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      {inviteMessage.text}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email del Usuario</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="nuevo@ejemplo.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El usuario recibirá un enlace para completar su registro
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="usuario">👤 Usuario</option>
                    <option value="tecnico">🔧 Técnico</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Los admins solo se crean manualmente
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generando...
                    </>
                  ) : (
                    '📨 Generar Invitación'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-2xl font-bold">Usuarios Registrados ({users.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            {user.nombre && (
                              <div className="text-sm text-gray-500">
                                {user.nombre}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          disabled={updateLoading === user.id || user.role === 'admin'}
                          className={`text-sm px-2 py-1 rounded border ${
                            user.role === 'admin' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            user.role === 'tecnico' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          } ${user.role === 'admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="admin">👑 Admin</option>
                          <option value="tecnico">🔧 Técnico</option>
                          <option value="usuario">👤 Usuario</option>
                        </select>
                        {updateLoading === user.id && (
                          <span className="ml-2 text-xs text-gray-500">Actualizando...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.id ? '✅ Activo' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleResendInvite(user.email, user.role)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 hover:bg-blue-50 rounded"
                              title="Reenviar invitación"
                            >
                              ↻ Reenviar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3 text-blue-800">📋 Guía Rápida</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">Para Invitar Usuarios:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-600">
                  <li>Ingresa el email del nuevo usuario</li>
                  <li>Selecciona el rol (Usuario o Técnico)</li>
                  <li>Haz clic en "Generar Invitación"</li>
                  <li>Copia el enlace generado y envíalo al usuario</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">Flujo del Usuario Invitado:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                  <li>Usuario recibe enlace y hace clic</li>
                  <li>Completa formulario con email y contraseña</li>
                  <li>Sistema crea la cuenta automáticamente</li>
                  <li>Usuario puede iniciar sesión inmediatamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
