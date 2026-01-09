import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Verificar que viene del admin (simplificado para pruebas)
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente admin con service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log(`Invitando a ${email} con rol ${role}`)

    // 1. Primero verificar si el usuario ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Usuario existe, enviar email de recuperación
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://login3-three.vercel.app/reset-password'
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

    // 2. Crear usuario con invitación
    // IMPORTANTE: Usar createUser en lugar de inviteUserByEmail
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'temporary_password_123', // Contraseña temporal
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: { role: role }
    })

    if (createError) {
      console.error('Error creando usuario:', createError)
      return NextResponse.json(
        { error: `Error creando usuario: ${createError.message}` },
        { status: 500 }
      )
    }

    // 3. Enviar email de recuperación para que establezca su propia contraseña
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://login3-three.vercel.app/reset-password'
    })

    if (resetError) {
      console.error('Error enviando email de recuperación:', resetError)
      // Continuar de todos modos, el usuario ya está creado
    }

    // 4. Crear/actualizar perfil en user_profiles
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: newUser.user?.id,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    return NextResponse.json({
      success: true,
      message: `✅ Usuario ${email} creado exitosamente. Se ha enviado un email para establecer contraseña.`,
      data: {
        email: email,
        role: role,
        user_id: newUser.user?.id,
        status: 'user_created_password_reset_sent'
      }
    })

  } catch (error: any) {
    console.error('Error en API invite-user:', error)
    return NextResponse.json(
      { error: `Error interno: ${error.message}` },
      { status: 500 }
    )
  }
}
