'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getRedirectUrl } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States para recuperação de senha
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');

  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains('dark');
    setIsDark(isDarkTheme);

    const query = new URLSearchParams(window.location.search);
    const msg = query.get('mensagem');
    if (msg) {
      setSucesso(msg);
    }
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

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setSucesso('');

    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar.trim(), {
      redirectTo: getRedirectUrl('/redefinir-senha')
    });

    if (error) {
      setErro(`Erro ao solicitar recuperação: ${error.message}`);
    } else {
      setSucesso(`E-mail de redefinição enviado com sucesso para ${emailRecuperar}! Verifique sua caixa de entrada.`);
      setEmailRecuperar('');
      setModoRecuperar(false);
    }
    setCarregando(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    // Função do Supabase para validar e-mail e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.');
      setCarregando(false);
    } else {
      // Verifica status de acesso através da API segura
      const checkRes = await fetch('/api/auth/check-status', {
        headers: {
          'Authorization': `Bearer ${data.session?.access_token}`
        }
      });
      const statusData = await checkRes.json();

      if (statusData && statusData.active === false) {
        setErro('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        setCarregando(false);
      } else {
        // Se der certo, redireciona o usuário para o Dashboard
        window.location.href = '/swipe';
      }
    }
  };

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
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Swipe<span className="text-blue-600">File</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {modoRecuperar ? 'Recuperar Senha 🔒' : 'Acesse seu catálogo de ofertas validadas'}
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded-r-md">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300 text-sm rounded-r-md">
            {sucesso}
          </div>
        )}

        {!modoRecuperar ? (
          <>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">E-mail</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
                    placeholder="••••••••"
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
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(true);
                      setErro('');
                      setSucesso('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={carregando}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
              >
                {carregando ? 'Entrando...' : 'Entrar no Swipe'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 dark:border-zinc-800 pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleRecuperarSenha} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">E-mail de Cadastro</label>
                <input 
                  type="email" 
                  required 
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
                  placeholder="seu@email.com"
                />
              </div>

              <button 
                type="submit" 
                disabled={carregando}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
              >
                {carregando ? 'Enviando...' : 'Enviar E-mail de Recuperação'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 dark:border-zinc-800 pt-6">
              <button 
                onClick={() => {
                  setModoRecuperar(false);
                  setErro('');
                  setSucesso('');
                }}
                className="text-sm text-gray-500 dark:text-zinc-400 font-bold hover:underline cursor-pointer"
              >
                Voltar para o Login
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}
