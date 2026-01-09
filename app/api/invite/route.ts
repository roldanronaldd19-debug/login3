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

    // Invitar usuario
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'}/register`
    })

    if (error) {
      console.error('Error invitando usuario:', error)
      
      // Si el usuario ya existe pero no tiene contraseña
      if (error.message.includes('already registered')) {
        // Reenviar invitación para restablecer contraseña
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://login3-three.vercel.app'}/reset-password`
        })

        if (resetError) {
          return NextResponse.json(
            { error: `El usuario ya existe. Error al reenviar invitación: ${resetError.message}` },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `El usuario ${email} ya existe. Se ha enviado un enlace para establecer contraseña.`,
          data: { email, role, status: 'password_reset_sent' }
        })
      }

      return NextResponse.json(
        { error: `Error al invitar usuario: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `✅ Invitación enviada a ${email}`,
      data: {
        email: email,
        role: role,
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
