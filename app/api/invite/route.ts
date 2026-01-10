import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización
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
    const supabaseAdmin = createAdminClient()

    // Obtener URL base desde headers o entorno
    const origin = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_SITE_URL || 
                   'https://login3-three.vercel.app'

    // Verificar si el email ya existe
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listando usuarios:', listError)
      return NextResponse.json(
        { error: 'Error al verificar usuarios existentes' },
        { status: 500 }
      )
    }

    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        return NextResponse.json(
          { 
            error: 'Usuario ya registrado',
            details: `El usuario ${email} ya tiene una cuenta activa.`
          },
          { status: 400 }
        )
      } else {
        // Usuario existe pero no confirmó email - reenviar invitación
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/reset-password?type=invite`
        })

        if (resetError) {
          console.error('Error reenviando invitación:', resetError)
          return NextResponse.json(
            { 
              error: 'Error al reenviar invitación',
              details: resetError.message
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Se ha reenviado un enlace de registro a ${email}`,
          data: { 
            email, 
            role, 
            status: 'invitation_resent',
            action: 'resent'
          }
        })
      }
    }

    // Crear usuario con invitación
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${origin}/register`
    })

    if (inviteError) {
      console.error('Error invitando usuario:', inviteError)
      
      // Intento alternativo con resetPasswordForEmail
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/register?type=invite`
      })

      if (resetError) {
        return NextResponse.json(
          { 
            error: 'Error al enviar invitación',
            details: `invite: ${inviteError.message}, reset: ${resetError.message}`
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Se ha enviado un enlace de registro a ${email}`,
        data: { 
          email, 
          role, 
          status: 'recovery_link_sent',
          action: 'fallback_sent'
        }
      })
    }

    // Crear registro en user_profiles
    const profileData = {
      email: email.toLowerCase(),
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(newUser.user?.id && { id: newUser.user.id })
    }

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'email',
        ignoreDuplicates: false
      })

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      // No fallar la operación completa si solo el perfil falla
    }

    return NextResponse.json({
      success: true,
      message: `✅ Invitación enviada exitosamente a ${email}`,
      data: {
        email: email,
        role: role,
        status: 'invited',
        invited_at: new Date().toISOString(),
        action: 'new_invite',
        user_id: newUser.user?.id || null
      }
    })

  } catch (error: any) {
    console.error('Error en API invite:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Por favor contacte al administrador'
      },
      { status: 500 }
    )
  }
}

// Método GET para verificar el estado del endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    message: 'API de invitaciones funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
}
