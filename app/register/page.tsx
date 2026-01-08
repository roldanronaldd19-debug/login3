import AuthForm from '../../components/AuthForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Completar Registro</h2>
          <p className="mt-2 text-center text-gray-600">
            Completa tu registro usando el enlace de invitación
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
            <p>⚠️ Esta página solo es accesible mediante invitación del administrador.</p>
          </div>
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  )
}
