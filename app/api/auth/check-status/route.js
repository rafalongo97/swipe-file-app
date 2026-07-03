import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ active: false, error: 'Token não fornecido' });
    }

    // Verify token and get user ID
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json({ active: false, error: 'Usuário não autenticado' });
    }

    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      // Fallback fallback: tenta usar anon key se service role nao estiver definida
      const { data: profile, error: RlsErr } = await supabaseAnon
        .from('profiles')
        .select('status_acesso, nome, email')
        .eq('id', user.id)
        .single();
        
      if (RlsErr) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY não configurada. RLS select falhou:', RlsErr.message);
        // Retorna active: true para evitar lockouts acidentais por falta de variáveis de servidor local
        return NextResponse.json({ active: true, warning: 'RLS select error', nome: user.user_metadata?.nome || '', email: user.email });
      }
      
      const active = profile && profile.status_acesso !== false && profile.status_acesso !== 'inativo';
      return NextResponse.json({ active, nome: profile?.nome || '', email: profile?.email || '' });
    }

    // Initialize admin client with service role key to bypass RLS
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

    const { data: profile, error: dbErr } = await supabaseAdmin
      .from('profiles')
      .select('status_acesso, nome, email')
      .eq('id', user.id)
      .single();

    if (dbErr || !profile) {
      // Se não achar o profile por algum motivo, assume true por padrão para não travar o admin
      return NextResponse.json({ active: true, nome: user.user_metadata?.nome || '', email: user.email });
    }

    const active = profile.status_acesso !== false && profile.status_acesso !== 'inativo';
    return NextResponse.json({ active, nome: profile.nome, email: profile.email });

  } catch (err) {
    return NextResponse.json({ active: false, error: err.message });
  }
}
