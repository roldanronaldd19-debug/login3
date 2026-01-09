import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener cookies de la request
    const cookieHeader = request.headers.get('cookie') || ''
    const accessTokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/)
    
    if (!accessTokenMatch) {
      return NextResponse.json(
        { error: 'Sesión no encontrada. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      )
    }

    const accessToken = decodeURIComponent(accessTokenMatch[1])

    // 2. Verificar el usuario
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      )
    }

    // 3. Verificar que el usuario sea admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    // 4. Obtener datos de la solicitud
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // 5. Verificar si el usuario ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Si existe pero no tiene contraseña (fue invitado)
      if (!existingUser.email_confirmed_at) {
        // Reenviar invitación
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { role },
          redirectTo: 'https://login3-three.vercel.app/register'
        })

        if (inviteError) throw inviteError

        return NextResponse.json({
          success: true,
          message: `✅ Invitación reenviada a ${email}`,
          data: { email, role, status: 'invitation_resent' }
        })
      } else {
        return NextResponse.json(
          { error: `El usuario ${email} ya está registrado y activo` },
          { status: 400 }
        )
      }
    }

    // 6. Crear usuario con invitación
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: 'https://login3-three.vercel.app/register'
    })

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      return NextResponse.json(
        { error: `Error al invitar usuario: ${inviteError.message}` },
        { status: 500 }
      )
    }

    // 7. Crear registro en user_profiles (si no existe)
    if (newUser.user?.id) {
      await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: newUser.user.id,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
    } else {
      // Si no hay ID aún (usuario pendiente), crear sin ID
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
    }

    return NextResponse.json({
      success: true,
      message: `✅ Invitación enviada a ${email}`,
      data: {
        email: email,
        role: role,
        status: 'invited',
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
