import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
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

    // 1. Exclui o usuário da tabela profiles
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileErr) {
      return NextResponse.json({ error: `Erro ao remover perfil: ${profileErr.message}` }, { status: 400 });
    }

    // 2. Exclui o usuário do Supabase Auth
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteErr) {
      return NextResponse.json({ error: `Erro ao remover autenticação: ${deleteErr.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
