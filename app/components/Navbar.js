'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Navbar({ activePage, isDark, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nome, setNome] = useState('');

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin, nome')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          setIsAdmin(data.is_admin === true);
          setNome(data.nome || '');
        }
      }
    }
    carregarPerfil();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const inicial = nome ? nome.charAt(0).toUpperCase() : 'U';

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight hover:opacity-90 transition">
              Swipe<span className="text-blue-600">File</span>
            </Link>
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-750 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
              PRO
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`text-sm font-semibold transition ${
                activePage === 'dashboard' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/swipe" 
              className={`text-sm font-semibold transition ${
                activePage === 'swipe' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500'
              }`}
            >
              Swipe File
            </Link>

            {/* Toggle Theme Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-250 transition duration-200 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
              title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              aria-label="Alternar Tema"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer hover:bg-blue-700 transition"
              >
                {inicial}
              </button>

              {dropdownOpen && (
                <>
                  {/* Invisible Backdrop Click Trigger to Close */}
                  <button 
                    type="button"
                    onClick={() => setDropdownOpen(false)} 
                    className="fixed inset-0 h-full w-full bg-transparent cursor-default outline-none z-20"
                  ></button>

                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl py-2 z-30 transform origin-top-right transition duration-250">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 font-medium">Logado como</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{nome || 'Usuário'}</p>
                    </div>

                    {/* Admin Specific Links */}
                    {isAdmin && (
                      <div className="border-b border-gray-100 dark:border-gray-700 py-1.5">
                        <Link 
                          href="/admin/dashboard" 
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 ${
                            activePage === 'admin-dashboard' ? 'text-purple-650 font-bold' : 'text-purple-500'
                          }`}
                        >
                          🛡️ Dashboard Admin
                        </Link>
                        <Link 
                          href="/acervo" 
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 ${
                            activePage === 'acervo' ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          📂 Acervo de Drive
                        </Link>
                        <Link 
                          href="/admin" 
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 ${
                            activePage === 'admin-panel' ? 'text-red-650' : 'text-red-500 hover:text-red-600'
                          }`}
                        >
                          ⚙️ Painel Admin
                        </Link>
                      </div>
                    )}

                    {/* General Links */}
                    <div className="py-1">
                      <Link 
                        href="/configuracoes" 
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 ${
                          activePage === 'configuracoes' ? 'text-blue-600' : 'text-gray-750 dark:text-gray-300'
                        }`}
                      >
                        🔧 Configurações
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition cursor-pointer"
                      >
                        🚪 Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Hamburger (Mobile) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Toggle Theme Button Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-255 transition border border-gray-200 dark:border-gray-700"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-755 dark:text-gray-400 focus:outline-none transition border border-gray-200 dark:border-gray-700"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMenuOpen(false)}></div>
          <div className="relative w-64 max-w-xs bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6 border-l border-gray-200 dark:border-gray-800 z-50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500 hover:text-gray-755 dark:text-gray-400">✕</button>
            </div>
            <nav className="flex flex-col gap-5 flex-1">
              <div className="pb-4 border-b border-gray-150 dark:border-gray-800">
                <p className="text-xs text-gray-400 font-medium">Logado como</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{nome || 'Usuário'}</p>
              </div>

              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'dashboard' ? 'text-blue-600' : 'text-gray-750 dark:text-gray-200'}`}>
                Dashboard
              </Link>
              <Link href="/swipe" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'swipe' ? 'text-blue-650' : 'text-gray-755 dark:text-gray-200'}`}>
                Swipe File
              </Link>

              {isAdmin && (
                <>
                  <hr className="border-gray-150 dark:border-gray-800" />
                  <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'admin-dashboard' ? 'text-purple-650 font-bold' : 'text-purple-500'}`}>
                    🛡️ Dashboard Admin
                  </Link>
                  <Link href="/acervo" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'acervo' ? 'text-blue-600' : 'text-gray-755 dark:text-gray-200'}`}>
                    📂 Acervo de Drive
                  </Link>
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'admin-panel' ? 'text-red-650' : 'text-red-500'}`}>
                    ⚙️ Painel Admin
                  </Link>
                </>
              )}

              <hr className="border-gray-150 dark:border-gray-800" />
              <Link href="/configuracoes" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'configuracoes' ? 'text-blue-600' : 'text-gray-750 dark:text-gray-205'}`}>
                🔧 Configurações
              </Link>

              <button
                onClick={handleLogout}
                className="w-full mt-auto bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 font-bold py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer text-center text-sm"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
