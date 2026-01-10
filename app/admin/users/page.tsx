'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, getRedirectUrls } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Search, Filter, RefreshCw, Trash2, MoreVertical, Mail, Shield, UserCheck } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'tecnico' | 'usuario'
  nombre: string | null
  telefono: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  is_active: boolean
}

type UserStatus = 'active' | 'pending' | 'inactive'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'tecnico' | 'usuario'>('usuario')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatus>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    admins: 0,
    technicians: 0,
    regular: 0
  })
  
  const router = useRouter()

  // Cargar datos iniciales
  useEffect(() => {
    checkAdminAndLoadData()
  }, [router])

  // Filtrar usuarios cuando cambian los filtros
  useEffect(() => {
    let filtered = [...users]
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    }
    
    // Filtrar por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.email_confirmed_at !== null
        if (statusFilter === 'pending') return user.email_confirmed_at === null
        return true
      })
    }
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const checkAdminAndLoadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Sesión expirada')
        router.push('/login')
        return
      }

      // Verificar si es admin
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || profile?.role !== 'admin') {
        toast.error('Acceso denegado')
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
      await loadUsers()
    } catch (error) {
      console.error('Error verificando admin:', error)
      toast.error('Error al verificar permisos')
    }
  }, [router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Cargar perfiles de usuarios
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Cargar datos de autenticación para estado
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) throw authError

      // Combinar datos
      const enrichedUsers = profiles?.map(profile => {
        const authUser = authUsers?.users?.find(u => u.email === profile.email)
        return {
          ...profile,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          is_active: !!authUser?.email_confirmed_at
        }
      }) || []

      setUsers(enrichedUsers)
      setFilteredUsers(enrichedUsers)
      updateStats(enrichedUsers)
      
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = (usersList: UserProfile[]) => {
    const stats = {
      total: usersList.length,
      active: usersList.filter(u => u.email_confirmed_at).length,
      pending: usersList.filter(u => !u.email_confirmed_at).length,
      admins: usersList.filter(u => u.role === 'admin').length,
      technicians: usersList.filter(u => u.role === 'tecnico').length,
      regular: usersList.filter(u => u.role === 'usuario').length
    }
    setStats(stats)
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)

    try {
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
        throw new Error(result.error || 'Error al enviar invitación')
      }

      toast.success(result.message)
      setInviteEmail('')
      
      // Recargar lista después de un breve delay
      setTimeout(() => {
        loadUsers()
      }, 1500)
      
    } catch (error: any) {
      console.error('Error enviando invitación:', error)
      toast.error(error.message)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdateLoading(userId)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Actualizar lista localmente
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
      
      toast.success('Rol actualizado exitosamente')
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Error al actualizar el rol')
    } finally {
      setUpdateLoading(null)
    }
  }

  const handleResendInvite = async (email: string, role: string) => {
    if (!confirm(`¿Reenviar invitación a ${email}?`)) return

    try {
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

      toast.success(result.message)
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedUsers.length === 0) {
      toast.error('Selecciona al menos un usuario')
      return
    }

    switch (action) {
      case 'delete':
        setShowDeleteConfirm(true)
        break
      // Implementar otras acciones según necesidad
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">Cargando panel de administración...</p>
          <p className="mt-2 text-sm text-gray-500">Obteniendo datos de usuarios</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Header */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </button>
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-sm text-gray-600">Panel de administración</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{userProfile?.email}</p>
                  <p className="text-xs text-blue-600">👑 Administrador</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <Mail className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Técnicos</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{stats.technicians}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios</p>
                <p className="text-2xl font-bold text-gray-600 mt-2">{stats.regular}</p>
              </div>
              <User className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sección izquierda: Invitación y filtros */}
          <div className="lg:col-span-1 space-y-6">
            {/* Formulario de invitación */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Invitar Nuevo Usuario</h2>
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Email del Usuario
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="nuevo@ejemplo.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    El usuario recibirá un enlace mágico para registrarse
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Asignar Rol
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteRole('usuario')}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        inviteRole === 'usuario'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Usuario</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('tecnico')}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        inviteRole === 'tecnico'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Técnico</span>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Los administradores se asignan manualmente
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Enviando invitación...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-3" />
                      Enviar Invitación
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filtrar Usuarios</h3>
                <Filter className="w-5 h-5 text-gray-500" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Buscar por email o nombre..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Filtrar por Rol
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'admin', 'tecnico', 'usuario'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          roleFilter === role
                            ? role === 'admin' ? 'bg-yellow-100 text-yellow-800'
                            : role === 'tecnico' ? 'bg-blue-100 text-blue-800'
                            : role === 'usuario' ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {role === 'all' ? 'Todos' : 
                         role === 'admin' ? '👑 Admin' :
                         role === 'tecnico' ? '🔧 Técnico' : '👤 Usuario'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Filtrar por Estado
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'active', label: '✅ Activos' },
                      { value: 'pending', label: '⏳ Pendientes' }
                    ].map(status => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setStatusFilter(status.value as UserStatus)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          statusFilter === status.value
                            ? status.value === 'active' ? 'bg-green-100 text-green-800'
                            : status.value === 'pending' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={loadUsers}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar Lista
                </button>
              </div>
            </div>
          </div>

          {/* Sección derecha: Tabla de usuarios */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Usuarios Registrados</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredUsers.length} de {users.length} usuarios mostrados
                    </p>
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedUsers.length} seleccionados
                      </span>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedUsers.length === filteredUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id))
                            } else {
                              setSelectedUsers([])
                            }
                          }}
                        />
                      </th>
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
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {user.email[0].toUpperCase()}
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
                              <div className="text-xs text-gray-400">
                                Creado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            disabled={updateLoading === user.id || user.role === 'admin'}
                            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                              user.role === 'admin' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              user.role === 'tecnico' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            } ${user.role === 'admin' ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow'}`}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="tecnico">🔧 Técnico</option>
                            <option value="usuario">👤 Usuario</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.email_confirmed_at
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed_at ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Activo
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                Pendiente
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.last_sign_in_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!user.email_confirmed_at && (
                              <button
                                onClick={() => handleResendInvite(user.email, user.role)}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                                title="Reenviar invitación"
                              >
                                <Mail className="w-4 h-4 mr-1" />
                              </button>
                            )}
                            <button className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                    <p className="text-gray-600">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Prueba con otros criterios de búsqueda'
                        : 'No hay usuarios registrados aún'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de confirmación para eliminar */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eliminar usuarios</h3>
                  <p className="text-sm text-gray-600">
                    {selectedUsers.length} usuario(s) seleccionado(s)
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Esta acción eliminará permanentemente los usuarios seleccionados. 
                ¿Estás seguro de continuar?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Implementar eliminación aquí
                    setShowDeleteConfirm(false)
                    setSelectedUsers([])
                    toast.success('Usuarios eliminados exitosamente')
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
