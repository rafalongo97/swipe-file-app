'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Navbar from '../components/Navbar';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
  const [isDark, setIsDark] = useState(false);

  // Modal actions states
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
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

      // Check if user is Rafael or is_admin profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (session.user.email !== 'rafael.longo97@gmail.com' && (!profile || profile.is_admin !== true)) {
        alert('Acesso negado: Rota exclusiva para administradores.');
        window.location.href = '/swipe';
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

  const handleToggleRole = async (profileId, isCurrentlyAdmin, isMaster) => {
    if (isMaster) {
      alert('Ação negada: O usuário Master é intocável');
      return;
    }
    setMensagem({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', profileId);

      if (error) {
        alert('Erro ao alterar cargo: ' + error.message);
        return;
      }

      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_admin: !isCurrentlyAdmin } : p));
      if (usuarioSelecionado && usuarioSelecionado.id === profileId) {
        setUsuarioSelecionado(prev => prev ? { ...prev, is_admin: !isCurrentlyAdmin } : prev);
      }
      setMensagem({ type: 'success', text: 'Cargo do usuário atualizado com sucesso!' });
    } catch (err) {
      alert('Erro inesperado: ' + err.message);
    }
  };

  const handleToggleAcesso = async (profileId, statusAcessoAtual, isMaster) => {
    if (isMaster) {
      alert('Ação negada: O usuário Master é intocável');
      return;
    }
    setMensagem({ type: '', text: '' });
    try {
      const novoStatus = !statusAcessoAtual;
      const { error } = await supabase
        .from('profiles')
        .update({ status_acesso: novoStatus })
        .eq('id', profileId);

      if (error) {
        alert('Erro ao alterar status de acesso: ' + error.message);
        return;
      }

      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status_acesso: novoStatus } : p));
      if (usuarioSelecionado && usuarioSelecionado.id === profileId) {
        setUsuarioSelecionado(prev => prev ? { ...prev, status_acesso: novoStatus } : prev);
      }
      setMensagem({ type: 'success', text: novoStatus ? 'Acesso do usuário reativado com sucesso!' : 'Acesso do usuário bloqueado com sucesso!' });
    } catch (err) {
      alert('Erro inesperado: ' + err.message);
    }
  };

  const handleAlterarSenhaAdmin = async (e) => {
    e?.preventDefault();
    if (!usuarioSelecionado) return;
    if (usuarioSelecionado.is_master) {
      alert('Ação negada: O usuário Master é intocável');
      return;
    }
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
        throw new Error(data.error || 'Erro ao alterar senha');
      }

      alert('Senha alterada com sucesso! 🔑');
      setNovaSenha('');
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-955 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-550 dark:text-gray-450 font-medium">Autenticando Administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-955 flex flex-col transition-colors duration-300">
      <Navbar activePage="admin-panel" isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-1 md:ml-64 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-955 dark:text-white tracking-tight">Painel Administrativo 🛡️</h1>
          <p className="text-sm text-gray-550 dark:text-gray-450 mt-1">Gerencie as contas dos usuários do sistema, alterne cargos e defina permissões de acesso.</p>
        </div>

        {mensagem.text && (
          <div className={`p-4 rounded-lg mb-6 border text-sm font-semibold ${
            mensagem.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-955/20 dark:text-green-300 dark:border-green-900/50' 
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-955/20 dark:text-red-300 dark:border-red-900/50'
          }`}>
            {mensagem.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Usuários Cadastrados</h2>
            <span className="text-xs text-gray-555 dark:text-gray-450 font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">{profiles.length} usuários</span>
          </div>

          <div className="overflow-x-auto">
            {carregandoDados ? (
              <div className="p-12 text-center flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-555 dark:text-gray-450 font-medium">Buscando perfis...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-12 text-center max-w-md mx-auto">
                <span className="text-3xl mb-3 block">👥</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Nenhum perfil cadastrado</h3>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Cargo</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {profiles.map((profile) => (
                    <tr 
                      key={profile.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150"
                    >
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {profile.nome || 'Sem nome'}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">
                        {profile.email}
                      </td>
                      <td className="p-4">
                        {profile.is_master ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-955/40 dark:text-purple-300 px-3 py-1 text-xs font-bold border border-purple-200 dark:border-purple-900/50 shadow-sm animate-pulse">
                            👑 Proprietário
                          </span>
                        ) : profile.is_admin ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-350 px-3 py-1 text-xs font-bold border border-amber-200 dark:border-amber-900/50">
                            🛡️ Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-105 text-blue-800 dark:bg-blue-955/40 dark:text-blue-300 px-3 py-1 text-xs font-bold border border-blue-200 dark:border-blue-900/50">
                            👥 Membro
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {profile.status_acesso !== false ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-bold border border-green-105 dark:border-green-900/40 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-955/40 text-red-700 dark:text-red-300 px-2.5 py-1 text-xs font-bold border border-red-105 dark:border-red-900/40 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {profile.is_master ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-750 dark:bg-purple-955/20 dark:text-purple-400 px-3 py-1 text-xs font-bold border border-purple-150 dark:border-purple-900/40">
                            Master
                          </span>
                        ) : (
                          <div className="flex justify-center items-center gap-2">
                            {/* Toggle Admin Button */}
                            {profile.is_admin ? (
                              <button
                                onClick={() => handleToggleRole(profile.id, true, false)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs transition cursor-pointer"
                              >
                                Remover Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleRole(profile.id, false, false)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                              >
                                Tornar Admin
                              </button>
                            )}

                            {/* Toggle Access Block/Unblock Button */}
                            {profile.status_acesso !== false ? (
                              <button
                                onClick={() => handleToggleAcesso(profile.id, true, false)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:bg-red-955/25 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-xs transition cursor-pointer"
                              >
                                Bloquear
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleAcesso(profile.id, false, false)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                              >
                                Desbloquear
                              </button>
                            )}

                            {/* Edit password & details */}
                            <button
                              onClick={() => setUsuarioSelecionado(profile)}
                              className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs transition cursor-pointer"
                            >
                              Editar / Senha
                            </button>
                          </div>
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
                  setNovaSenha('');
                }}
                className="text-gray-400 hover:text-gray-650 dark:text-zinc-500 dark:hover:text-zinc-350 bg-gray-200/50 dark:bg-zinc-800 p-2 rounded-full transition cursor-pointer"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Informações */}
              <div className="bg-gray-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 space-y-2 text-left">
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  <strong>Nome:</strong> {usuarioSelecionado.nome || 'Sem nome'}
                </p>
                <p className="text-sm text-gray-700 dark:text-zinc-300">
                  <strong>E-mail:</strong> {usuarioSelecionado.email}
                </p>
                <p className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <strong>Cargo atual:</strong>
                  {usuarioSelecionado.is_master ? (
                    <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 dark:bg-purple-955/40 dark:text-purple-300 px-2.5 py-0.5 text-xs font-bold border border-purple-100 dark:border-purple-900/50">
                      Master
                    </span>
                  ) : usuarioSelecionado.is_admin ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300 px-2.5 py-0.5 text-xs font-bold border border-amber-100 dark:border-amber-900/50">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-blue-105 text-blue-800 dark:bg-blue-955/40 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold border border-blue-105 dark:border-blue-900/50">
                      Membro
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <strong>Status:</strong>
                  {usuarioSelecionado.status_acesso !== false ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-300 px-2.5 py-0.5 text-xs font-bold border border-green-100 dark:border-green-900/50">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-300 px-2.5 py-0.5 text-xs font-bold border border-red-100 dark:border-red-900/50">
                      Bloqueado
                    </span>
                  )}
                </p>
              </div>

              {/* Botão de Toggle Status */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 text-left">Controle de Acesso</h4>
                <button
                  onClick={() => handleToggleAcesso(usuarioSelecionado.id, usuarioSelecionado.status_acesso !== false, usuarioSelecionado.is_master)}
                  disabled={usuarioSelecionado.is_master}
                  className={`w-full text-sm font-bold py-2.5 px-4 rounded-lg border transition flex justify-center items-center gap-1.5 ${
                    usuarioSelecionado.is_master
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500'
                      : usuarioSelecionado.status_acesso !== false
                      ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-705 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400 cursor-pointer'
                      : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-955/20 dark:border-green-900/50 dark:text-green-400 cursor-pointer'
                  }`}
                >
                  {usuarioSelecionado.is_master 
                    ? '🔒 Conta Proprietária Protegida'
                    : usuarioSelecionado.status_acesso !== false 
                    ? '🚫 Bloquear Acesso' 
                    : '✅ Desbloquear Acesso'}
                </button>
              </div>

              {/* Formulário Alterar Senha */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 text-left">
                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Alterar Senha</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder={usuarioSelecionado.is_master ? "Senha do Master é inalterável" : "Defina a nova senha"}
                      required
                      disabled={usuarioSelecionado.is_master}
                      autoComplete="new-password"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition disabled:opacity-50"
                    />
                    {!usuarioSelecionado.is_master && (
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
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAlterarSenhaAdmin}
                    disabled={salvandoSenha || usuarioSelecionado.is_master}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {salvandoSenha ? 'Alterando...' : 'Salvar Nova Senha'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
