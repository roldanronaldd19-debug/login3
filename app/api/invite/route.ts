import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener token de autorización del header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    // 2. Verificar el token usando Supabase
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // 3. Verificar que el usuario sea admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'admin') {
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

    // 5. Verificar si el email ya existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users?.some(u => u.email === email)

    if (userExists) {
      return NextResponse.json(
        { error: `El usuario ${email} ya está registrado` },
        { status: 400 }
      )
    }

    // 6. Invitar usuario
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
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

    // 7. Crear registro en user_profiles
    await supabaseAdmin
      .from('user_profiles')
      .upsert({
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })

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
