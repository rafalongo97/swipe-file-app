import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, newPassword } = await request.json();
    
    // Get Authorization header
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido' }, { status: 401 });
    }

    // Verify token and verify admin email
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token);

    if (authErr || !user || user.email !== 'rafael.longo97@gmail.com') {
      return NextResponse.json({ error: 'Acesso negado: Administrador não autenticado' }, { status: 403 });
    }

    // Check service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Erro de Servidor: SUPABASE_SERVICE_ROLE_KEY não está configurada.' 
      }, { status: 500 });
    }

    // Initialize admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch profile of the user to check is_master status
    const { data: targetProfile, error: getProfileError } = await supabaseAdmin
      .from('profiles')
      .select('is_master')
      .eq('id', userId)
      .single();

    if (getProfileError) {
      return NextResponse.json({ error: `Erro ao buscar dados do perfil: ${getProfileError.message}` }, { status: 400 });
    }

    if (targetProfile && targetProfile.is_master === true) {
      return NextResponse.json({ error: "Ação negada: O usuário Master é intocável" }, { status: 403 });
    }

    // Call Supabase admin API to update user password
    const { data, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
