'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConfirmacaoSucesso() {
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

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-800 transition-colors duration-300 text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 dark:border-green-900/50 shadow-sm">
          {/* Big Checkmark Icon */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
          E-mail Confirmado! 🚀
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Seu cadastro foi confirmado com sucesso. Agora sua conta está totalmente ativa e você já pode acessar o sistema.
        </p>

        <Link 
          href="/login" 
          className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition shadow-lg transform hover:-translate-y-0.5 cursor-pointer text-sm"
        >
          Ir para o Login
        </Link>
      </div>
    </div>
  );
}
