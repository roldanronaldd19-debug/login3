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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'tecnico' | 'usuario'>('usuario')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
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
      // 1. Invitar usuario por email usando Supabase Auth
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        inviteEmail,
        {
          data: { role: inviteRole },
          redirectTo: 'https://login3-three.vercel.app/register'
        }
      )

      if (inviteError) throw inviteError

      // 2. Crear registro en user_profiles (si la función trigger no lo hace automáticamente)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          email: inviteEmail,
          role: inviteRole
        })

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.warn('Profile creation warning:', profileError)
      }

      setInviteMessage({ 
        type: 'success', 
        text: `Invitación enviada a ${inviteEmail} con rol ${inviteRole}` 
      })
      setInviteEmail('')
      loadUsers() // Recargar lista
    } catch (error: any) {
      setInviteMessage({ 
        type: 'error', 
        text: error.message || 'Error al enviar invitación' 
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

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${email}?`)) return

    try {
      // Eliminar de auth.users (esto requiere permisos de admin)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) throw authError

      // Recargar lista
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar usuario')
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
                <div className={`p-3 rounded ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {inviteMessage.text}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="tecnico">Técnico</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  El usuario recibirá un email para completar su registro.
                </p>
              </div>
            </form>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
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
                      Fecha Registro
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
                          className={`text-sm rounded border ${
                            user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                            user.role === 'tecnico' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          } ${user.role === 'admin' ? 'cursor-not-allowed' : ''}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="tecnico">Técnico</option>
                          <option value="usuario">Usuario</option>
                        </select>
                        {updateLoading === user.id && (
                          <span className="ml-2 text-xs text-gray-500">Actualizando...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Eliminar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Reenviar invitación
                            setInviteEmail(user.email)
                            setInviteRole(user.role === 'tecnico' ? 'tecnico' : 'usuario')
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reenviar Invitación
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información para el admin */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">📋 Instrucciones para el Administrador</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Invitar usuario:</strong> Ingresa el email y selecciona el rol (Usuario o Técnico).</li>
              <li><strong>Cambiar rol:</strong> Usa el dropdown en la columna "Rol" para actualizar permisos.</li>
              <li><strong>Eliminar usuario:</strong> Solo disponible para usuarios no administradores.</li>
              <li><strong>Reenviar invitación:</strong> Útil si el usuario no recibió el email inicial.</li>
              <li><strong>Nota:</strong> Los administradores no pueden cambiar su propio rol por seguridad.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}