'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getRedirectUrl } from '../../lib/supabase';

export default function Configuracoes() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [emailOriginal, setEmailOriginal] = useState('');

  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
  const [isDark, setIsDark] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains('dark');
    setIsDark(isDarkTheme);
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    async function verificarAcesso() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Verifica status de acesso
      const { data: profile } = await supabase
        .from('profiles')
        .select('status_acesso, nome, email')
        .eq('id', session.user.id)
        .single();

      if (profile && (profile.status_acesso === false || profile.status_acesso === 'inativo')) {
        alert('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      if (session.user.email === 'rafael.longo97@gmail.com') {
        setIsAdmin(true);
      }

      const nomeUser = profile ? profile.nome : (session.user.user_metadata?.nome || '');
      const emailUser = profile ? profile.email : session.user.email;

      setUsuario({
        id: session.user.id,
        email: session.user.email
      });

      setNome(nomeUser);
      setEmail(emailUser);
      setNomeOriginal(nomeUser);
      setEmailOriginal(emailUser);
      
      setCarregandoAuth(false);
    }
    verificarAcesso();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem({ type: '', text: '' });

    const updates = {};
    let alterouPerfil = false;
    let alterouEmail = false;
    let alterouSenha = false;

    // 1. Validar Nome
    if (nome.trim() !== nomeOriginal.trim()) {
      if (!nome.trim()) {
        setMensagem({ type: 'error', text: 'O nome não pode ficar vazio.' });
        setSalvando(false);
        return;
      }
      alterouPerfil = true;
    }

    // 2. Validar E-mail
    if (email.trim().toLowerCase() !== emailOriginal.trim().toLowerCase()) {
      if (!email.trim()) {
        setMensagem({ type: 'error', text: 'O e-mail não pode ficar vazio.' });
        setSalvando(false);
        return;
      }
      alterouEmail = true;
    }

    // 3. Validar Senha
    if (senha) {
      if (senha.length < 6) {
        setMensagem({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
        setSalvando(false);
        return;
      }
      if (senha !== confirmarSenha) {
        setMensagem({ type: 'error', text: 'As senhas não coincidem.' });
        setSalvando(false);
        return;
      }
      alterouSenha = true;
    }

    try {
      // Executar update do Nome/Perfil no Supabase
      if (alterouPerfil) {
        const { error } = await supabase
          .from('profiles')
          .update({ nome: nome.trim() })
          .eq('id', usuario.id);
        
        if (error) throw new Error(`Erro ao atualizar nome: ${error.message}`);
        setNomeOriginal(nome.trim());
      }

      // Executar update do E-mail no Supabase Auth e Profiles
      if (alterouEmail) {
        const { error: authErr } = await supabase.auth.updateUser({
          email: email.trim()
        }, {
          emailRedirectTo: getRedirectUrl('/configuracoes')
        });
        
        if (authErr) throw new Error(`Erro ao atualizar e-mail de autenticação: ${authErr.message}`);

        const { error: profErr } = await supabase
          .from('profiles')
          .update({ email: email.trim().toLowerCase() })
          .eq('id', usuario.id);

        if (profErr) {
          console.error('Erro ao atualizar e-mail na tabela profiles:', profErr);
        }
        
        setEmailOriginal(email.trim());
      }

      // Executar update de Senha no Supabase Auth
      if (alterouSenha) {
        const { error } = await supabase.auth.updateUser({
          password: senha
        });
        
        if (error) throw new Error(`Erro ao atualizar senha: ${error.message}`);
        setSenha('');
        setConfirmarSenha('');
      }

      // Definir mensagem de sucesso
      let msg = 'Configurações atualizadas com sucesso! 🚀';
      if (alterouEmail) {
        msg += ' Um link de confirmação foi enviado para os seus e-mails (antigo e novo) para validar a mudança.';
      }
      setMensagem({ type: 'success', text: msg });

    } catch (err) {
      setMensagem({ type: 'error', text: err.message });
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      
      {/* Top Navbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Swipe<span className="text-blue-600">File</span>
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                PRO
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
                title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
                aria-label="Alternar Tema"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link href="/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/acervo" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Acervo de Drive
              </Link>
              <Link href="/configuracoes" className="text-sm font-semibold text-blue-600 transition">
                Configurações
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-semibold text-red-600 hover:text-red-700 transition">
                  Painel Admin
                </Link>
              )}
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
              >
                Sair
              </button>
            </nav>

            {/* Hamburger Button (Mobile Only) */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
                aria-label="Abrir Menu"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
          ></div>
          
          <div className="relative w-64 max-w-xs bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 z-50">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button 
                onClick={() => setMenuOpen(false)}
                className="text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 flex-1">
              <Link 
                href="/dashboard" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
              >
                Dashboard
              </Link>
              <Link 
                href="/acervo" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
              >
                Acervo de Drive
              </Link>
              <Link 
                href="/configuracoes" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-blue-600 transition"
              >
                Configurações
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-semibold text-red-600 hover:text-red-700 transition"
                >
                  Painel Admin
                </Link>
              )}
              
              <hr className="border-gray-200 dark:border-gray-800" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tema</span>
                <button
                  type="button"
                  onClick={() => { toggleTheme(); }}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
                  aria-label="Alternar Tema"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>

              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="w-full mt-auto bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer text-center text-sm"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">Configurações de Conta ⚙️</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seu nome, e-mail e credenciais do Swipe File.</p>
          </div>

          {mensagem.text && (
            <div className={`p-4 rounded-lg mb-6 border text-sm font-semibold ${
              mensagem.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50' 
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50'
            }`}>
              {mensagem.text}
            </div>
          )}

          <form onSubmit={handleSalvar} className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nome Completo</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu Nome Completo"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
              />
            </div>

            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
              />
            </div>

            <hr className="border-gray-100 dark:border-gray-800 my-6" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Alterar Senha (Opcional)</h3>

            {/* Nova Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres (Deixe em branco para manter)"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer"
                  title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Link 
                href="/dashboard"
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg text-center transition text-sm cursor-pointer border border-gray-200 dark:border-gray-700"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-50 text-sm flex justify-center items-center gap-2"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

      </main>

    </div>
  );
}
