'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
      // Verifica o status_acesso na tabela profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('status_acesso')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.status_acesso === false) {
        setErro('Seu acesso foi desativado pelo administrador.');
        await supabase.auth.signOut();
        setCarregando(false);
      } else {
        // Se der certo, redireciona o usuário para o Dashboard
        window.location.href = '/dashboard';
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
          <p className="text-sm text-gray-500 dark:text-zinc-400">Acesse seu catálogo de ofertas validadas</p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded-r-md">
            {erro}
          </div>
        )}

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
            <input 
              type="password" 
              required 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
              placeholder="••••••••"
            />
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
        
      </div>
    </div>
  );
}
