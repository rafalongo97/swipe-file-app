'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getRedirectUrl } from '../../lib/supabase';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    async function verificarAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      if (session.user.email !== 'rafael.longo97@gmail.com') {
        alert('Acesso negado: Rota exclusiva para o administrador.');
        window.location.href = '/dashboard';
        return;
      }

      setIsAdmin(true);
      setCarregandoAuth(false);
      await carregarProfiles();
    }
    verificarAdmin();
  }, []);

  async function carregarProfiles() {
    setCarregandoDados(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar profiles:', error);
      setMensagem({ type: 'error', text: 'Não foi possível carregar a lista de usuários.' });
    } else {
      setProfiles(data || []);
    }
    setCarregandoDados(false);
  }

  const handleToggleAcesso = async (profileId, statusAcessoAtual) => {
    setMensagem({ type: '', text: '' });
    const { error } = await supabase
      .from('profiles')
      .update({ status_acesso: !statusAcessoAtual })
      .eq('id', profileId);

    if (error) {
      alert('Erro ao alterar status de acesso: ' + error.message);
    } else {
      await carregarProfiles();
    }
  };

  const handleExcluirProfile = async (profileId, nomeUser) => {
    if (!confirm(`Deseja realmente excluir o perfil do usuário "${nomeUser}"? Esta ação removerá os dados de perfil dele no banco.`)) {
      return;
    }
    setMensagem({ type: '', text: '' });
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      alert('Erro ao excluir perfil: ' + error.message);
    } else {
      await carregarProfiles();
      setMensagem({ type: 'success', text: `Perfil de "${nomeUser}" excluído com sucesso.` });
    }
  };

  const handleResetarSenha = async (email) => {
    setMensagem({ type: '', text: '' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('/perfil')
    });

    if (error) {
      alert('Erro ao solicitar redefinição: ' + error.message);
    } else {
      alert(`E-mail de redefinição de senha enviado com sucesso para ${email}!`);
      setMensagem({ type: 'success', text: `Instruções de redefinição enviadas para ${email}` });
    }
  };

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Autenticando Administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
              <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/50">
                ADMIN
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-955 dark:text-white tracking-tight">Painel Administrativo 🛡️</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie as contas dos usuários do sistema e defina permissões de acesso.</p>
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

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Usuários Cadastrados</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{profiles.length} usuários</span>
          </div>

          <div className="overflow-x-auto">
            {carregandoDados ? (
              <div className="p-12 text-center flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Buscando perfis...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-12 text-center max-w-md mx-auto">
                <span className="text-3xl mb-3 block">👥</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Nenhum perfil cadastrado</h3>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Nome</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider">E-mail</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Acesso</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150">
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {profile.nome}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">
                        {profile.email}
                      </td>
                      <td className="p-4">
                        {profile.status_acesso !== false ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2.5 py-0.5 text-xs font-bold border border-green-100 dark:border-green-900/50">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2.5 py-0.5 text-xs font-bold border border-red-100 dark:border-red-900/50">
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        {/* Botão de status de acesso */}
                        <button
                          onClick={() => handleToggleAcesso(profile.id, profile.status_acesso !== false)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            profile.status_acesso !== false
                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400'
                              : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400'
                          }`}
                        >
                          {profile.status_acesso !== false ? 'Bloquear' : 'Desbloquear'}
                        </button>

                        {/* Botão de resetar senha */}
                        <button
                          onClick={() => handleResetarSenha(profile.email)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition cursor-pointer flex items-center gap-1"
                        >
                          Resetar Senha
                        </button>

                        {/* Botão de exclusão */}
                        <button
                          onClick={() => handleExcluirProfile(profile.id, profile.nome)}
                          disabled={profile.email === 'rafael.longo97@gmail.com'}
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={profile.email === 'rafael.longo97@gmail.com' ? "Não é possível excluir a conta administrativa master" : "Excluir Usuário"}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

    </div>
  );
}
