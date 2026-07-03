'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [permitido, setPermitido] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
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
    // Escuta mudanças de estado de autenticação (detecção do Supabase Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPermitido(true);
      }
    });

    async function validarSessaoRecuperacao() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se houver hash type=recovery na URL ou se o evento disparar
      if (window.location.hash.includes('type=recovery') || (session && session.user)) {
        setPermitido(true);
      }
      setVerificando(false);
    }
    validarSessaoRecuperacao();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRedefinir = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    if (senha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      setErro(`Erro ao atualizar senha: ${error.message}`);
      setCarregando(false);
    } else {
      // Redireciona para o login com a mensagem de sucesso
      window.location.href = `/login?mensagem=${encodeURIComponent('Senha redefinida com sucesso! Acesse sua conta com a nova senha.')}`;
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">Validando token de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-zinc-950 dark:to-zinc-900 p-4 transition-colors duration-300 relative">
      
      {/* Botão de Alternância de Tema */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 shadow-md border border-gray-200 dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all cursor-pointer font-semibold text-sm flex items-center justify-center w-10 h-10"
          title="Alternar Tema"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Nova Senha 🔑
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Defina sua nova credencial de acesso.</p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded-r-md">
            {erro}
          </div>
        )}

        {!permitido ? (
          <div className="text-center p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
            <span className="text-3xl mb-2 block">⚠️</span>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Acesso Expirado ou Inválido</h3>
            <p className="text-xs text-amber-600 dark:text-amber-450 leading-relaxed mb-4">
              Este link de redefinição de senha não é mais válido. Por favor, solicite um novo e-mail de recuperação.
            </p>
            <Link 
              href="/login" 
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded text-xs transition cursor-pointer"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRedefinir} className="space-y-6">
            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
                  placeholder="Repita a nova senha"
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

            <button 
              type="submit" 
              disabled={carregando}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition shadow-lg transform hover:-translate-y-0.5 cursor-pointer flex justify-center items-center gap-2"
            >
              {carregando ? 'Atualizando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
