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
    const userExists = existingUsers?.users?.some(u => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { error: `El usuario ${email} ya está registrado` },
        { status: 400 }
      )
    }

    // Generar un token único para la invitación (no crear usuario aún)
    const invitationToken = generateInvitationToken()
    
    // Guardar la invitación en una tabla temporal
    await supabaseAdmin
      .from('pending_invitations')
      .upsert({
        email: email,
        role: role,
        token: invitationToken,
        invited_by: authHeader.replace('Bearer ', ''),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    // NOTA: No estamos usando inviteUserByEmail porque crea el usuario automáticamente
    // En su lugar, enviaremos un email personalizado con nuestro propio enlace
    
    return NextResponse.json({
      success: true,
      message: `✅ Invitación generada para ${email}`,
      data: {
        email: email,
        role: role,
        invitation_link: `https://login3-three.vercel.app/register?token=${invitationToken}&email=${encodeURIComponent(email)}`,
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

function generateInvitationToken() {
  return 'invite_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}
