import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización básica
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar si el email ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        return NextResponse.json(
          { error: `El usuario ${email} ya está registrado y activo` },
          { status: 400 }
        )
      } else {
        // Usuario existe pero no confirmó email - reenviar invitación
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'}/register?type=recovery`
        })

        if (resetError) {
          return NextResponse.json(
            { error: `El usuario ya existe. Error al reenviar invitación: ${resetError.message}` },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Se ha reenviado un enlace de registro a ${email}`,
          data: { email, role, status: 'invitation_resent' }
        })
      }
    }

    // Crear usuario con invitación - ESTO ENVÍA EL EMAIL AUTOMÁTICAMENTE
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'}/register`
    })

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      
      // Si falla, intentar con resetPasswordForEmail como alternativa
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'}/register?type=recovery`
      })

      if (resetError) {
        return NextResponse.json(
          { error: `Error al enviar invitación: ${inviteError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Se ha enviado un enlace de registro a ${email}`,
        data: { email, role, status: 'recovery_link_sent' }
      })
    }

    // Crear registro en user_profiles (si no existe)
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
