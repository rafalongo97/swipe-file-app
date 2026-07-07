'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
      if (session.user.email === 'rafael.longo97@gmail.com') {
        setIsAdmin(true);
      }
      const res = await fetch('/api/auth/check-status', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const statusData = await res.json();
      if (statusData && statusData.active === false) {
        alert('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    verificarAcesso();
  }, []);

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

            {/* Desktop Nav */}
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
              <Link href="/dashboard" className="text-sm font-semibold text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/swipe" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Swipe File
              </Link>
              <Link href="/acervo" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Acervo de Drive
              </Link>
              <Link href="/configuracoes" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
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

            {/* Hamburger (Mobile) */}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMenuOpen(false)}></div>
          <div className="relative w-64 max-w-xs bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6 border-l border-gray-200 dark:border-gray-800 z-50">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500 hover:text-gray-750 dark:text-gray-400 cursor-pointer">✕</button>
            </div>
            <nav className="flex flex-col gap-6 flex-1">
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/swipe" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
                Swipe File
              </Link>
              <Link href="/acervo" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
                Acervo de Drive
              </Link>
              <Link href="/configuracoes" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
                Configurações
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-red-600 hover:text-red-700 transition">
                  Painel Admin
                </Link>
              )}
              <hr className="border-gray-200 dark:border-gray-800" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tema</span>
                <button type="button" onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer border border-gray-200 dark:border-gray-700">
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                className="w-full mt-auto bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 font-bold py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer text-center text-sm"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-4xl mb-6 border border-blue-100 dark:border-blue-900/50">
            📊
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            Dashboard Geral
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-md">
            Métricas e gráficos em desenvolvimento.
          </p>
          <div className="mt-8">
            <Link
              href="/swipe"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition text-sm"
            >
              📂 Ir para o Swipe File
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
