'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Probando...')
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Verificar autenticación
        const { data: { session } } = await supabase.auth.getSession()
        setConnectionStatus(prev => `${prev}\nSesión: ${session ? 'OK' : 'No session'}`)
        
        if (session) {
          // Test 2: Obtener perfil del usuario actual
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            setConnectionStatus(prev => `${prev}\nError perfil: ${profileError.message}`)
          } else {
            setConnectionStatus(prev => `${prev}\nPerfil: ${JSON.stringify(profile)}`)
          }
          
          // Test 3: Obtener todos los usuarios (solo admin)
          const { data: allUsers, error: usersError } = await supabase
            .from('user_profiles')
            .select('*')
          
          if (usersError) {
            setConnectionStatus(prev => `${prev}\nError usuarios: ${usersError.message}`)
          } else {
            setUsers(allUsers || [])
            setConnectionStatus(prev => `${prev}\nTotal usuarios: ${allUsers?.length}`)
          }
        }
      } catch (error: any) {
        setConnectionStatus(`Error: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Prueba de Conexión</h3>
      <pre className="text-sm whitespace-pre-wrap bg-black text-green-400 p-4 rounded">
        {connectionStatus}
      </pre>
      
      {users.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Usuarios en la base de datos:</h4>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Rol</th>
                <th className="px-4 py-2 border">ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                      user.role === 'tecnico' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-xs font-mono">{user.id.substring(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
