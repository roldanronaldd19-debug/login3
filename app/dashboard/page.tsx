'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setDebugInfo(`Error al obtener sesión: ${error.message}`)
          throw error
        }

        if (!session) {
          setDebugInfo('No hay sesión activa')
          router.push('/login')
          return
        }

        setUser(session.user)
        setDebugInfo(`Usuario autenticado: ${session.user.email}`)

        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          setDebugInfo(`Error al obtener perfil: ${profileError.message}`)
          console.error('Error fetching profile:', profileError)
        } else {
          setUserProfile(profile)
          setDebugInfo(`Perfil obtenido: ${JSON.stringify(profile)}`)
        }
        
      } catch (error: any) {
        console.error('Error en checkAuth:', error)
        setDebugInfo(`Error general: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
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
            
            {/* Menú de usuario */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
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
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      Rol: <span className="font-semibold capitalize">{userProfile?.role || 'No asignado'}</span>
                    </div>
                    
                    {(userProfile?.role === 'admin') && (
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        🔧 Gestión de Cuentas
                      </Link>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información de depuración (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-sm">
            <p className="font-semibold mb-2">Info de Depuración:</p>
            <pre className="text-xs overflow-auto">{debugInfo}</pre>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.email}</h2>
          
          <div className="mb-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              userProfile?.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 
              userProfile?.role === 'tecnico' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {userProfile?.role === 'admin' ? '👑 Administrador' : 
               userProfile?.role === 'tecnico' ? '🔧 Técnico' : 
               userProfile?.role ? `👤 ${userProfile.role}` : '⏳ Rol no asignado'}
            </div>
            
            {!userProfile && (
              <p className="mt-2 text-red-600 text-sm">
                ⚠️ No se pudo cargar tu perfil. Contacta al administrador.
              </p>
            )}
          </div>
          
          <p className="text-gray-600 mb-6">
            {userProfile?.role === 'admin' 
              ? 'Tienes acceso completo al sistema, incluyendo la gestión de usuarios.'
              : userProfile?.role === 'tecnico'
              ? 'Puedes gestionar tickets y realizar asignaciones técnicas.'
              : 'Puedes crear y seguir el estado de tus tickets.'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Estado de Cuenta</h3>
              <p className="text-gray-600">
                Email: {user?.email_verified ? '✓ Verificado' : '⏳ Pendiente'}
              </p>
              <p className="text-gray-600 mt-1">
                ID: <span className="text-xs font-mono">{user?.id?.substring(0, 8)}...</span>
              </p>
            </div>
            
            {userProfile?.role === 'admin' && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Acciones de Admin</h3>
                <p className="text-gray-600 mb-2">
                  Gestiona usuarios y permisos desde el menú desplegable.
                </p>
                <Link
                  href="/admin/users"
                  className="text-green-700 hover:text-green-900 font-medium"
                >
                  Ir a gestión de usuarios →
                </Link>
              </div>
            )}
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Soporte</h3>
              <p className="text-gray-600">
                Para problemas técnicos, contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
