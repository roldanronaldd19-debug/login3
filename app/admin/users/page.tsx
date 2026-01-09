'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: 'admin' | 'tecnico' | 'usuario'
  nombre: string | null
  telefono: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'tecnico' | 'usuario'>('usuario')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
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

  useEffect(() => {
    // Filtrar usuarios
    let filtered = users
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nombre && user.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const loadUsers = async () => {
    try {
      // Obtener usuarios de user_profiles
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Obtener información de autenticación para cada usuario
      const usersWithAuthInfo = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            // Obtener información de auth.users usando admin API
            const supabaseAdmin = createAdminClient()
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            const authUser = authUsers?.users?.find(u => u.email === profile.email)
            
            return {
              ...profile,
              last_sign_in_at: authUser?.last_sign_in_at || null
            }
          } catch (err) {
            console.error(`Error obteniendo info de auth para ${profile.email}:`, err)
            return {
              ...profile,
              last_sign_in_at: null
            }
          }
        })
      )

      setUsers(usersWithAuthInfo)
      setFilteredUsers(usersWithAuthInfo)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAdminClient = () => {
    return supabase
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
    
    setInviteMessage({ 
      type: 'success', 
      text: (
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

  const handleUpdateRole = async (userId: string, newRole: string, currentEmail: string) => {
    if (currentEmail === userProfile?.email) {
      alert('No puedes cambiar tu propio rol por seguridad.')
      return
    }
    
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
      
      alert(`Rol actualizado a ${newRole} para el usuario`)
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

      alert(result.message || `✅ Invitación reenviada a ${email}`)
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleSendPasswordReset = async (email: string) => {
    if (!confirm(`¿Enviar enlace para restablecer contraseña a ${email}?`)) return

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://login3-three.vercel.app/reset-password'
      })

      if (error) throw error

      alert(`✅ Enlace de recuperación enviado a ${email}`)
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === userProfile?.email) {
      alert('No puedes eliminar tu propia cuenta.')
      return
    }
    
    if (!confirm(`¿Estás seguro de eliminar al usuario ${email}?\n\nEsta acción no se puede deshacer.`)) return

    try {
      // Primero eliminar de user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Actualizar lista
      setUsers(users.filter(user => user.id !== userId))
      
      alert(`Usuario ${email} eliminado exitosamente`)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar usuario')
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'tecnico': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑'
      case 'tecnico': return '🔧'
      default: return '👤'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Cargando usuarios...</p>
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
                className="text-gray-700 hover:text-gray-900 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                <span className="font-semibold">👑 Admin:</span> {userProfile?.email}
              </span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {users.length}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usuarios</p>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">👥</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administradores</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-2xl">👑</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Técnicos</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {users.filter(u => u.role === 'tecnico').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">🔧</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuarios</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {users.filter(u => u.role === 'usuario').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-2xl">👤</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Invitación */}
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 pb-3 border-b">📨 Invitar Nuevo Usuario</h2>
            
            <form onSubmit={handleInviteUser} className="space-y-6">
              {inviteMessage && (
                <div className={`p-4 rounded-lg ${
                  inviteMessage.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    <span className="mr-2 text-xl mt-0.5">
                      {inviteMessage.type === 'success' ? '✅' : '❌'}
                    </span>
                    <div>
                      <span className="font-medium">{inviteMessage.text}</span>
                      {inviteMessage.type === 'success' && (
                        <p className="text-sm mt-1">
                          El usuario recibirá un email con instrucciones para completar su registro.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Email del Usuario
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="nuevo.usuario@ejemplo.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    El usuario recibirá un email con enlace para completar su registro.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Rol
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      <option value="usuario">👤 Usuario Regular</option>
                      <option value="tecnico">🔧 Técnico</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Los administradores solo se asignan manualmente
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando invitación...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar Invitación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
                <p className="text-sm text-gray-600">
                  {filteredUsers.length} de {users.length} usuarios mostrados
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                    placeholder="Buscar por email o nombre..."
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="tecnico">Técnicos</option>
                  <option value="usuario">Usuarios</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acceso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            {user.nombre && (
                              <div className="text-sm text-gray-500">
                                {user.nombre}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getRoleIcon(user.role)}</span>
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value, user.email)}
                            disabled={updateLoading === user.id || user.email === userProfile?.email}
                            className={`text-sm px-3 py-1.5 rounded-lg border ${getRoleBadgeClass(user.role)} ${
                              user.email === userProfile?.email 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'cursor-pointer hover:opacity-90'
                            } transition-all`}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="tecnico">🔧 Técnico</option>
                            <option value="usuario">👤 Usuario</option>
                          </select>
                          {updateLoading === user.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          user.last_sign_in_at 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}>
                          {user.last_sign_in_at ? '✅ Activo' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {!user.last_sign_in_at ? (
                            <button
                              onClick={() => handleResendInvite(user.email, user.role)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 text-sm font-medium transition-colors flex items-center"
                              title="Reenviar invitación"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reenviar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendPasswordReset(user.email)}
                              className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors flex items-center"
                              title="Enviar recuperación de contraseña"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Reset Pass
                            </button>
                          )}
                          
                          {user.email !== userProfile?.email && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-medium transition-colors flex items-center"
                              title="Eliminar usuario"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                  <p className="text-gray-600">
                    {searchTerm || roleFilter !== 'all' 
                      ? 'Intenta con otros términos de búsqueda o filtros.' 
                      : 'Aún no hay usuarios registrados. ¡Invita al primero!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instrucciones y Notas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Información Importante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-700">📋 Estados de Usuario:</h4>
                <ul className="space-y-2 text-sm text-blue-600">
                  <li className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span><strong>✅ Activo:</strong> El usuario ha iniciado sesión al menos una vez</span>
                  </li>
                  <li className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    <span><strong>⏳ Pendiente:</strong> Usuario invitado que aún no completó registro</span>
                  </li>
                  <li className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                    <span><strong>Nunca:</strong> No ha iniciado sesión desde el registro</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-700">🔧 Acciones Disponibles:</h4>
                <ul className="space-y-2 text-sm text-blue-600">
                  <li><strong>Reenviar:</strong> Para usuarios pendientes, envía nueva invitación</li>
                  <li><strong>Reset Pass:</strong> Envía enlace para recuperar contraseña</li>
                  <li><strong>Cambiar Rol:</strong> Actualiza permisos del usuario</li>
                  <li><strong>Eliminar:</strong> Remueve usuario del sistema (no reversible)</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
              <p className="text-sm text-blue-800 font-medium">
                ⚠️ <strong>Nota de Seguridad:</strong> No puedes cambiar tu propio rol ni eliminar tu propia cuenta por motivos de seguridad.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

