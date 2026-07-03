'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Perfil() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [salvando, setSalvando] = useState(false);
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
    async function verificarAcesso() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Verifica status de acesso
      const { data: profile } = await supabase
        .from('profiles')
        .select('status_acesso, nome')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.status_acesso === false) {
        alert('Seu acesso foi desativado pelo administrador.');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      setUsuario({
        id: session.user.id,
        email: session.user.email,
        nome: profile ? profile.nome : 'Usuário'
      });
      setCarregandoAuth(false);
    }
    verificarAcesso();
  }, []);

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem({ type: '', text: '' });

    if (senha.length < 6) {
      setMensagem({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      setSalvando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem({ type: 'error', text: 'As senhas não coincidem.' });
      setSalvando(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      setMensagem({ type: 'error', text: `Erro ao atualizar senha: ${error.message}` });
    } else {
      setMensagem({ type: 'success', text: 'Senha alterada com sucesso! 🚀' });
      setSenha('');
      setConfirmarSenha('');
    }
    setSalvando(false);
  };

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando perfil...</p>
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
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
        
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">Configurações de Perfil ⚙️</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie suas credenciais de acesso.</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800/50 mb-6 text-sm">
            <p className="text-gray-700 dark:text-gray-300"><strong>Nome:</strong> {usuario?.nome}</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1"><strong>E-mail:</strong> {usuario?.email}</p>
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

          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nova Senha</label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link 
                href="/dashboard"
                className="flex-1 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg text-center transition text-sm cursor-pointer border border-gray-200 dark:border-gray-700"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-50 text-sm flex justify-center items-center gap-2"
              >
                {salvando ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>

      </main>

    </div>
  );
}
