import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación (usando cookies)
    const cookieHeader = request.headers.get('cookie') || ''
    const accessTokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/)
    
    if (!accessTokenMatch) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión nuevamente.' },
        { status: 401 }
      )
    }

    const accessToken = decodeURIComponent(accessTokenMatch[1])
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      )
    }

    // 2. Verificar que el usuario sea admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden enviar invitaciones' },
        { status: 403 }
      )
    }

    // 3. Obtener datos
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // 4. Verificar si el usuario ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(u => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { error: `El usuario ${email} ya está registrado` },
        { status: 400 }
      )
    }

    // 5. IMPORTANTE: Invitar usuario con el redirectTo CORRECTO
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email, 
      {
        data: { role },
        redirectTo: `${supabaseUrl}/auth/v1/callback` // Este es el callback de Supabase
      }
    )

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      return NextResponse.json(
        { error: `Error al invitar usuario: ${inviteError.message}` },
        { status: 500 }
      )
    }

    // 6. Crear registro en user_profiles
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    return NextResponse.json({
      success: true,
      message: `✅ Invitación enviada a ${email}`,
      note: 'El usuario recibirá un email para establecer su contraseña',
      data: {
        email,
        role,
        invited_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error en API invite:', error)
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    )
  }
}
