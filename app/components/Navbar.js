'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Navbar({ activePage, isDark, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nome, setNome] = useState('');
  const [revisoesPendentes, setRevisoesPendentes] = useState([]);
  const [painelOpen, setPainelOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email || '');
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin, nome')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          const adminCheck = data.is_admin === true;
          setIsAdmin(adminCheck);
          setNome(data.nome || '');
          if (adminCheck) {
            carregarLembretesRevisao();
          }
        }
      }
    }
    carregarPerfil();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  async function carregarLembretesRevisao() {
    try {
      const { data: listData, error: listError } = await supabase
        .from('ofertas_swipe_file')
        .select('id, nome_produto, nicho, data_ultima_verificacao, created_at, link_biblioteca_anuncios');
      if (listError) throw listError;
      
      if (listData) {
        const pendentes = listData.filter(oferta => {
          const ultimaVerificacao = oferta.data_ultima_verificacao || oferta.created_at;
          if (!ultimaVerificacao) return true;
          const diffMs = new Date() - new Date(ultimaVerificacao);
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays >= 3;
        });
        setRevisoesPendentes(pendentes);
      }
    } catch (err) {
      console.error("Erro Supabase:", err);
    }
  }

  async function marcarComoVerificadoNavbar(ofertaId) {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ofertas_swipe_file')
        .update({ data_ultima_verificacao: now })
        .eq('id', ofertaId);
      if (error) throw error;
      
      setRevisoesPendentes(prev => prev.filter(o => o.id !== ofertaId));
    } catch (err) {
      console.error("Erro Supabase:", err);
      alert("Erro ao marcar como verificado.");
    }
  }

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
                  ? 'text-blue-600 font-bold' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/swipe" 
              className={`text-sm font-semibold transition ${
                activePage === 'swipe' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500'
              }`}
            >
              Swipe File
            </Link>
            <Link 
              href="/acervo" 
              className={`text-sm font-semibold transition ${
                activePage === 'acervo' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500'
              }`}
            >
              Acervo Drive
            </Link>

            {/* Notification Bell */}
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPainelOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition cursor-pointer relative"
                  aria-label="Notificações"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {revisoesPendentes.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                      {revisoesPendentes.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-blue-650 text-white font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer hover:bg-blue-700 transition"
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

                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl py-2 z-30 transform origin-top-right transition duration-250 text-left">
                    {/* 1. Logged in user info */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 font-medium">Logado como</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{nome || 'Usuário'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{email}</p>
                    </div>

                    {/* 2 & 3. Admin Links */}
                    {isAdmin && (
                      <div className="py-1">
                        <Link 
                          href="/admin/dashboard" 
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 transition ${
                            activePage === 'admin-dashboard' ? 'text-purple-600 font-bold' : 'text-purple-500 hover:text-purple-650'
                          }`}
                        >
                          🛡️ Dashboard Adm
                        </Link>
                        <Link 
                          href="/admin" 
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 transition ${
                            activePage === 'admin-panel' ? 'text-red-650 font-bold' : 'text-red-500 hover:text-red-600'
                          }`}
                        >
                          ⚙️ Painel Admin
                        </Link>
                      </div>
                    )}

                    {/* 4. Subtle divider */}
                    {isAdmin && <hr className="border-gray-100 dark:border-gray-700 my-1" />}

                    {/* 5, 6 & 7. General Items */}
                    <div className="py-1">
                      {/* Theme Switcher Button */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition cursor-pointer text-left"
                      >
                        <span>{isDark ? '☀️' : '🌙'}</span>
                        <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
                      </button>

                      <Link 
                        href="/configuracoes" 
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700/60 transition ${
                          activePage === 'configuracoes' ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>🔧</span>
                        <span>Configurações</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition cursor-pointer text-left"
                      >
                        <span>🚪</span>
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Hamburger (Mobile) */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPainelOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition cursor-pointer relative"
                  aria-label="Notificações"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {revisoesPendentes.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                      {revisoesPendentes.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          
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
          <div className="relative w-64 max-w-xs bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6 border-l border-gray-200 dark:border-gray-800 z-50 text-left">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500 hover:text-gray-755 dark:text-gray-400">✕</button>
            </div>
            <nav className="flex flex-col gap-5 flex-1">
              <div className="pb-4 border-b border-gray-150 dark:border-gray-800">
                <p className="text-xs text-gray-400 font-medium">Logado como</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{nome || 'Usuário'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
              </div>

              {/* Main Links */}
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'dashboard' ? 'text-blue-600 font-bold' : 'text-gray-750 dark:text-gray-200'}`}>
                Dashboard
              </Link>
              <Link href="/swipe" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'swipe' ? 'text-blue-600 font-bold' : 'text-gray-755 dark:text-gray-200'}`}>
                Swipe File
              </Link>
              <Link href="/acervo" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'acervo' ? 'text-blue-600 font-bold' : 'text-gray-755 dark:text-gray-200'}`}>
                Acervo Drive
              </Link>

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <hr className="border-gray-150 dark:border-gray-800" />
                  <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'admin-dashboard' ? 'text-purple-650 font-bold' : 'text-purple-500'}`}>
                    🛡️ Dashboard Adm
                  </Link>
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'admin-panel' ? 'text-red-650' : 'text-red-500'}`}>
                    ⚙️ Painel Admin
                  </Link>
                </>
              )}

              <hr className="border-gray-150 dark:border-gray-800" />

              {/* Theme toggle in mobile */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 text-base font-semibold text-gray-750 dark:text-gray-200 transition text-left cursor-pointer"
              >
                <span>{isDark ? '☀️' : '🌙'}</span>
                <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>

              <Link href="/configuracoes" onClick={() => setMenuOpen(false)} className={`text-base font-semibold transition ${activePage === 'configuracoes' ? 'text-blue-600' : 'text-gray-750 dark:text-gray-200'}`}>
                <span>🔧</span> Configurações
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
      {/* Slide-over de Triagem */}
      {painelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setPainelOpen(false)}
            ></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out sm:duration-400">
                <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                      <span>🚨</span> Revisão Necessária
                    </h2>
                    <button 
                      onClick={() => setPainelOpen(false)}
                      className="text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800 p-2 rounded-full transition cursor-pointer"
                      aria-label="Fechar painel"
                    >
                      ❌
                    </button>
                  </div>

                  {/* Content */}
                  <div className="relative flex-1 p-6 space-y-4">
                    {revisoesPendentes.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="text-4xl block mb-3">🎉</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Tudo em dia!</p>
                        <p className="text-xs text-gray-550 mt-1">Nenhuma oferta pendente de revisão.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">
                          Ofertas não verificadas há mais de 3 dias
                        </p>
                        {revisoesPendentes.map((oferta) => {
                          const ultimaVer = oferta.data_ultima_verificacao || oferta.created_at;
                          const diffMs = new Date() - new Date(ultimaVer);
                          const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          return (
                            <div 
                              key={oferta.id} 
                              className="bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-3 shadow-xs"
                            >
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white block truncate">
                                  {oferta.nome_produto}
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-200/50 dark:border-blue-800/30">
                                    📁 {oferta.nicho}
                                  </span>
                                  <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 px-2 py-0.5 rounded font-bold border border-red-200/50 dark:border-red-800/50 animate-pulse">
                                    ⚠️ {diasAtraso} dias sem rever
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2.5 pt-2 border-t border-gray-150/60 dark:border-gray-800/60">
                                {oferta.link_biblioteca_anuncios ? (
                                  <a 
                                    href={oferta.link_biblioteca_anuncios} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-3 rounded-lg text-xs border border-gray-200 dark:border-gray-700 text-center transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    🔗 Ver Anúncios
                                  </a>
                                ) : (
                                  <span className="flex-1 text-gray-400 text-[10px] italic flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    Sem link cadastrado
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => marcarComoVerificadoNavbar(oferta.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  ✅ Verificado
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
