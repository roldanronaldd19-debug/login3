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
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 1. Obtener sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Error de sesión: ${sessionError.message}`)
          throw sessionError
        }

        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)
        console.log('Usuario autenticado:', session.user)

        // 2. Intentar obtener perfil de user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.log('Error al obtener perfil:', profileError)
          setError(`No se pudo cargar el perfil: ${profileError.message}`)
          
          // 3. Si no existe el perfil, CREARLO automáticamente
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              role: 'usuario', // Rol por defecto
              nombre: session.user.user_metadata?.nombre || null
            })
            .select()
            .single()

          if (createError) {
            console.error('Error al crear perfil:', createError)
            setError(prev => `${prev}. Error al crear perfil: ${createError.message}`)
          } else {
            console.log('Perfil creado automáticamente:', newProfile)
            setUserProfile(newProfile)
          }
        } else {
          console.log('Perfil obtenido:', profile)
          setUserProfile(profile)
        }

      } catch (err: any) {
        console.error('Error general:', err)
        setError(`Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
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
                    
                    {userProfile?.role === 'admin' && (
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
        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">⚠️ Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Recargar página
            </button>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.email}</h2>
          
          <div className="mb-6">
            {userProfile ? (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                userProfile.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 
                userProfile.role === 'tecnico' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {userProfile.role === 'admin' ? '👑 Administrador' : 
                 userProfile.role === 'tecnico' ? '🔧 Técnico' : 
                 '👤 Usuario'}
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                ⏳ Rol no asignado
              </div>
            )}
            
            {!userProfile && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">
                  <strong>⚠️ Atención:</strong> Tu cuenta no tiene un perfil configurado. 
                  Esto puede deberse a:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>El perfil no se creó automáticamente al registrarte</li>
                  <li>Problemas de conexión con la base de datos</li>
                  <li>Políticas de seguridad (RLS) bloqueando el acceso</li>
                </ul>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Información de Cuenta</h3>
              <p className="text-gray-600">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-gray-600 mt-1">
                <strong>Verificado:</strong> {user?.email_verified ? '✅ Sí' : '❌ No'}
              </p>
              <p className="text-gray-600 mt-1">
                <strong>ID:</strong> <span className="text-xs font-mono">{user?.id?.substring(0, 10)}...</span>
              </p>
            </div>
            
            {userProfile?.role === 'admin' && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Acciones de Administrador</h3>
                <p className="text-gray-600 mb-3">
                  Como administrador, puedes gestionar todos los usuarios del sistema.
                </p>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  🔧 Ir a Gestión de Usuarios
                </Link>
              </div>
            )}
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Soporte Técnico</h3>
              <p className="text-gray-600">
                Si tienes problemas con tu cuenta o necesitas asistencia, contacta al administrador del sistema.
              </p>
              {!userProfile && (
                <div className="mt-3 p-3 bg-purple-100 rounded">
                  <p className="text-sm text-purple-800">
                    <strong>Solución:</strong> El administrador debe asignarte un rol en la base de datos.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Panel de diagnóstico (solo visible si hay problemas) */}
          {!userProfile && (
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h3 className="font-bold text-lg mb-3">🩺 Diagnóstico del Problema</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Paso 1: Verificar en Supabase</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Ve al panel de Supabase y ejecuta:
                  </p>
                  <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
{`SELECT * FROM user_profiles WHERE email = '${user?.email}';`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Paso 2: Crear perfil manualmente</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Si no existe, ejecuta este SQL:
                  </p>
                  <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
{`INSERT INTO user_profiles (id, email, role, nombre)
SELECT 
  id, 
  email, 
  'admin' as role,
  'Roldan' as nombre
FROM auth.users 
WHERE email = '${user?.email}'
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Paso 3: Recargar la página</h4>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    🔄 Recargar Ahora
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
