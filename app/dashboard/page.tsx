'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import AccountManagement from '../../components/AccountManagement'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAccountManagement, setShowAccountManagement] = useState(false)
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
            
            {/* Menú desplegable del usuario */}
            <div className="flex items-center relative">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <span>{user?.email}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setShowAccountManagement(true)
                        setShowDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📧 Gestionar Cuentas
                    </button>
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
        {/* Modal de Gestión de Cuentas */}
        {showAccountManagement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Gestión de Cuentas</h3>
                  <button
                    onClick={() => setShowAccountManagement(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <AccountManagement />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Bienvenido, {user?.email}</h2>
          <p className="text-gray-600 mb-6">
            Sistema de autenticación privado. Solo usuarios invitados pueden registrarse.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Tu Cuenta
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Email: {user?.email}</li>
                <li>• Verificado: {user?.email_verified ? '✅ Sí' : '❌ No'}</li>
                <li>• Último acceso: {new Date(user?.last_sign_in_at).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
                Invitar Usuarios
              </h3>
              <p className="text-gray-600 mb-3">
                Invita a nuevos usuarios al sistema enviándoles un enlace de registro.
              </p>
              <button
                onClick={() => setShowAccountManagement(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Invitar Usuario
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Instrucciones</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Haz clic en tu email en la esquina superior derecha para desplegar el menú</li>
              <li>Selecciona "Gestionar Cuentas" para invitar nuevos usuarios</li>
              <li>Los usuarios invitados recibirán un email con enlace de registro</li>
              <li>Para cerrar sesión, usa la opción "Cerrar Sesión" en el menú</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
