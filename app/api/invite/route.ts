import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuración para backend (usa service_role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación del usuario que hace la solicitud
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Verificar que el usuario sea admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden enviar invitaciones' },
        { status: 403 }
      )
    }

    // 3. Obtener datos de la solicitud
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // 4. Crear cliente con service_role para admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 5. Invitar usuario usando el servicio admin
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: 'https://login3-three.vercel.app/register'
    })

    if (error) {
      console.error('Error invitando usuario:', error)
      return NextResponse.json(
        { error: `Error al invitar usuario: ${error.message}` },
        { status: 500 }
      )
    }

    // 6. Crear registro en user_profiles (si no existe)
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: data.user?.id || null,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${email}`,
      data
    })

  } catch (error: any) {
    console.error('Error en API invite:', error)
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    )
  }
}