'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// Mock Data
const MOCK_DATA = [
  {
    id: '1',
    nome_produto: 'Método Renda Automática',
    nicho: 'Ganhar Dinheiro',
    subnicho: 'Marketing Digital',
    tempo_ativo: 45,
    qtd_criativos: 18,
    mercado: 'BR',
    tipo_funil: 'DR',
    formato_entrega: 'Vídeo',
    esta_escalada: true,
    status_ativo: true,
  },
  {
    id: '2',
    nome_produto: 'Protocolo Zero Barriga',
    nicho: 'Saúde & Bem-estar',
    subnicho: 'Emagrecimento',
    tempo_ativo: 32,
    qtd_criativos: 24,
    mercado: 'BR',
    tipo_funil: 'DR',
    formato_entrega: 'Ebook',
    esta_escalada: true,
    status_ativo: true,
  },
  {
    id: '3',
    nome_produto: 'Segredos da Conquista',
    nicho: 'Relacionamentos',
    subnicho: 'Sedução / Conquista',
    tempo_ativo: 15,
    qtd_criativos: 8,
    mercado: 'LATAM',
    tipo_funil: 'X1',
    formato_entrega: 'Vídeo',
    esta_escalada: false,
    status_ativo: true,
  },
  {
    id: '4',
    nome_produto: 'Inglês em 90 Dias',
    nicho: 'Hobbies & Profissões',
    subnicho: 'Idiomas',
    tempo_ativo: 60,
    qtd_criativos: 35,
    mercado: 'BR',
    tipo_funil: 'DR',
    formato_entrega: 'Vídeo',
    esta_escalada: true,
    status_ativo: true,
  },
  {
    id: '5',
    nome_produto: 'Planner Financeiro 2026',
    nicho: 'Ganhar Dinheiro',
    subnicho: 'Investimentos',
    tempo_ativo: 10,
    qtd_criativos: 5,
    mercado: 'US',
    tipo_funil: 'DR',
    formato_entrega: 'SaaS',
    esta_escalada: false,
    status_ativo: true,
  },
  {
    id: '6',
    nome_produto: 'Copywriter High-Ticket',
    nicho: 'Desenvolvimento Pessoal',
    subnicho: 'Autoajuda',
    tempo_ativo: 40,
    qtd_criativos: 14,
    mercado: 'BR',
    tipo_funil: 'X1',
    formato_entrega: 'Mentoria',
    esta_escalada: true,
    status_ativo: true,
  },
  {
    id: '7',
    nome_produto: 'SaaS Builder Pro',
    nicho: 'Hobbies & Profissões',
    subnicho: 'Programação / TI',
    tempo_ativo: 28,
    qtd_criativos: 12,
    mercado: 'US',
    tipo_funil: 'DR',
    formato_entrega: 'SaaS',
    esta_escalada: false,
    status_ativo: true,
  },
  {
    id: '8',
    nome_produto: 'Meditação Mindfulness',
    nicho: 'Saúde & Bem-estar',
    subnicho: 'Saúde Mental',
    tempo_ativo: 50,
    qtd_criativos: 20,
    mercado: 'BR',
    tipo_funil: 'DR',
    formato_entrega: 'Áudio',
    esta_escalada: true,
    status_ativo: true,
  }
];

// Color Palettes
const COLORS_FORMAT = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#64748B'];
const COLORS_NICHO = ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        headers: { 'Authorization': "Bearer " + session?.access_token }
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

  // Summary Metrics calculations
  const totalEscaladas = MOCK_DATA.filter(item => item.esta_escalada).length;
  const totalMais30Dias = MOCK_DATA.filter(item => item.tempo_ativo >= 30).length;

  // Format Distribution calculations
  const formatMap = {};
  MOCK_DATA.forEach(item => {
    formatMap[item.formato_entrega] = (formatMap[item.formato_entrega] || 0) + 1;
  });
  const dataFormat = Object.keys(formatMap).map(key => ({
    name: key,
    value: formatMap[key]
  }));

  // Niche Distribution calculations
  const nicheMap = {};
  MOCK_DATA.forEach(item => {
    nicheMap[item.nicho] = (nicheMap[item.nicho] || 0) + 1;
  });
  const dataNiche = Object.keys(nicheMap).map(key => ({
    name: key,
    value: nicheMap[key]
  }));

  // Top 5 sorted by active creatives descending
  const top5 = MOCK_DATA.filter(item => item.esta_escalada)
    .sort((a, b) => b.qtd_criativos - a.qtd_criativos)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Client Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Análise geral do seu portfólio de ofertas e criativos ativos.
          </p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Total de Ofertas Escaladas */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-xs p-6 flex items-center justify-between transition hover:shadow-md">
            <div>
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Total de Ofertas Escaladas
              </span>
              <span className="text-3xl font-black text-blue-600 dark:text-blue-500 mt-1 block">
                {totalEscaladas}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 block">
                Ofertas marcadas como escaladas no Swipe File
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400">
              🚀
            </div>
          </div>

          {/* Card 2: Ofertas Rodando há +30 Dias */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-xs p-6 flex items-center justify-between transition hover:shadow-md">
            <div>
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Ofertas Rodando há +30 Dias
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-1 block">
                {totalMais30Dias}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 block">
                Tempo mínimo recomendado para validação sólida
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-2xl text-emerald-600 dark:text-emerald-400">
              📅
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Distribuição por Formato */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 shadow-xs flex flex-col">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
              Distribuição por Formato
            </h2>
            <div className="h-64 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataFormat}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataFormat.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={COLORS_FORMAT[index % COLORS_FORMAT.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '8px',
                        color: isDark ? '#F3F4F6' : '#1F2937'
                      }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 animate-pulse text-sm">Carregando gráfico...</div>
              )}
            </div>
          </div>

          {/* Chart 2: Distribuição por Nicho */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 shadow-xs flex flex-col">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 block"></span>
              Distribuição por Nicho
            </h2>
            <div className="h-64 flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataNiche}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataNiche.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={COLORS_NICHO[index % COLORS_NICHO.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '8px',
                        color: isDark ? '#F3F4F6' : '#1F2937'
                      }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 animate-pulse text-sm">Carregando gráfico...</div>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🏆 Top 5 Ofertas Mais Escaladas
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ordenadas pelo maior número de criativos ativos rodando.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Nome / Produto</th>
                  <th className="p-4">Nicho</th>
                  <th className="p-4">Mercado</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 text-center">Tempo Ativo</th>
                  <th className="p-4 text-center">Criativos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {top5.map((item) => (
                  <tr 
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-850/40 transition duration-150"
                  >
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      {item.nome_produto}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                        {item.nicho}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/30">
                        {item.mercado}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-600 dark:text-gray-400">
                      {item.tipo_funil}
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                      {item.tempo_ativo} dias
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 rounded-full text-xs border border-emerald-100 dark:border-emerald-900/30">
                        {item.qtd_criativos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
