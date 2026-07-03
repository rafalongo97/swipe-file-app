'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
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

  const handleCadastro = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ type: '', text: '' });

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setMensagem({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      setCarregando(false);
      return;
    }

    if (senha.length < 6) {
      setMensagem({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      setCarregando(false);
      return;
    }

    // 1. SignUp no Supabase Auth com metadata do nome
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          nome: nome.trim(),
        }
      }
    });

    if (error) {
      setMensagem({ type: 'error', text: `Erro no cadastro: ${error.message}` });
      setCarregando(false);
    } else if (data.user) {
      // 2. Criar registro correspondente na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            status_acesso: true, // Padrão ativo
          }
        ]);

      if (profileError) {
        console.error('Erro ao criar perfil de usuário:', profileError);
      }

      setMensagem({
        type: 'success',
        text: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário. 🚀'
      });
      
      // Limpa os campos
      setNome('');
      setEmail('');
      setSenha('');
      setCarregando(false);
    } else {
      setMensagem({
        type: 'success',
        text: 'Cadastro enviado! Se a verificação de e-mail estiver ativa, confira sua caixa de entrada.'
      });
      setCarregando(false);
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
          <p className="text-sm text-gray-500 dark:text-zinc-400">Crie sua conta para começar</p>
        </div>

        {mensagem.text && (
          <div className={`mb-6 p-4 border-l-4 rounded-r-md text-sm ${
            mensagem.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300'
          }`}>
            {mensagem.text}
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800/80 text-gray-900 dark:text-white"
              placeholder="Seu Nome"
            />
          </div>

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
            <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">Senha (mín. 6 caracteres)</label>
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition shadow-lg transform hover:-translate-y-0.5 cursor-pointer flex justify-center items-center gap-2"
          >
            {carregando ? 'Cadastrando...' : 'Criar minha Conta'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 dark:border-zinc-800 pt-6">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}
