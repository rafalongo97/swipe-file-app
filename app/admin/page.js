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

  // States para o Popup de Ações
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [excluindoUser, setExcluindoUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleAlterarSenhaAdmin = async (e) => {
    e.preventDefault();
    if (!usuarioSelecionado) return;
    if (novaSenha.length < 6) {
      alert('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setSalvandoSenha(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId: usuarioSelecionado.id, newPassword: novaSenha })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido ao alterar senha');
      }

      alert('Senha updated com sucesso! 🚀');
      setNovaSenha('');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleConfirmExcluirAdmin = async () => {
    if (!usuarioSelecionado) return;
    if (confirmDeleteInput !== 'excluir') {
      alert("Por favor, digite 'excluir' para confirmar.");
      return;
    }

    setExcluindoUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId: usuarioSelecionado.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido ao excluir usuário');
      }

      alert('Usuário excluído com sucesso!');
      setUsuarioSelecionado(null);
      setShowDeleteConfirm(false);
      setConfirmDeleteInput('');
      await carregarProfiles();
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setExcluindoUser(false);
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
                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {profiles.map((profile) => (
                    <tr 
                      key={profile.id} 
                      onClick={() => setUsuarioSelecionado(profile)}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150 cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {profile.nome || 'Sem nome'}
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
                            Inativo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* POPUP DE AÇÕES DO USUÁRIO */}
      {usuarioSelecionado && (
        <div 
          onClick={() => {
            setUsuarioSelecionado(null);
            setShowDeleteConfirm(false);
            setConfirmDeleteInput('');
            setNovaSenha('');
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                  Ações do Usuário
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Gerencie a conta selecionada</p>
              </div>
              <button 
                onClick={() => {
                  setUsuarioSelecionado(null);
                  setShowDeleteConfirm(false);
                  setConfirmDeleteInput('');
                  setNovaSenha('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 bg-gray-200/50 dark:bg-zinc-800 p-2 rounded-full transition cursor-pointer"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Informações */}
              <div className="bg-gray-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 space-y-2">
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  <strong>Nome:</strong> {usuarioSelecionado.nome || 'Sem nome'}
                </p>
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  <strong>E-mail:</strong> {usuarioSelecionado.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <strong>Status:</strong>
                  {usuarioSelecionado.status_acesso !== false ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2.5 py-0.5 text-xs font-bold border border-green-100 dark:border-green-900/50">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2.5 py-0.5 text-xs font-bold border border-red-100 dark:border-red-900/50">
                      Inativo
                    </span>
                  )}
                </p>
              </div>

              {/* Botão de Toggle Status */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Controle de Acesso</h4>
                <button
                  onClick={async () => {
                    await handleToggleAcesso(usuarioSelecionado.id, usuarioSelecionado.status_acesso !== false);
                    setUsuarioSelecionado({
                      ...usuarioSelecionado,
                      status_acesso: !usuarioSelecionado.status_acesso
                    });
                  }}
                  className={`w-full text-sm font-bold py-2.5 px-4 rounded-lg border transition cursor-pointer flex justify-center items-center gap-1.5 ${
                    usuarioSelecionado.status_acesso !== false
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400'
                      : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400'
                  }`}
                >
                  {usuarioSelecionado.status_acesso !== false ? '🚫 Bloquear Acesso' : '✅ Desbloquear Acesso'}
                </button>
              </div>

              {/* Formulário Alterar Senha */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Alterar Senha</h4>
                <form onSubmit={handleAlterarSenhaAdmin} className="space-y-3">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Defina a nova senha"
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {salvandoSenha ? 'Alterando...' : 'Salvar Nova Senha'}
                  </button>
                </form>
              </div>

              {/* Botão de Exclusão */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4">
                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Excluir Conta</h4>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={usuarioSelecionado.email === 'rafael.longo97@gmail.com'}
                    className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold py-2 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={usuarioSelecionado.email === 'rafael.longo97@gmail.com' ? "Não é possível excluir o administrador" : "Excluir Usuário"}
                  >
                    🗑️ Excluir Usuário
                  </button>
                ) : (
                  <div className="space-y-3 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-lg border border-red-100 dark:border-red-950/30">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      Esta ação é irreversível! Digite <strong>excluir</strong> abaixo para confirmar:
                    </p>
                    <input 
                      type="text"
                      value={confirmDeleteInput}
                      onChange={(e) => setConfirmDeleteInput(e.target.value)}
                      placeholder="Digite excluir"
                      className="w-full px-3 py-1.5 rounded border border-red-300 dark:border-red-900/50 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setConfirmDeleteInput(''); }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold py-1.5 rounded text-xs transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmExcluirAdmin}
                        disabled={confirmDeleteInput !== 'excluir' || excluindoUser}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded text-xs transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {excluindoUser ? 'Excluindo...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
