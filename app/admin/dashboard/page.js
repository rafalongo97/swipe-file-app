'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Navbar from '../../components/Navbar';
import { ResponsiveContainer, Tooltip, Legend, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminDashboardPage() {
  const [carregando, setCarregando] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mock data for Admin Dashboard
  const totalOfertas = 142;
  const totalDriveFiles = 87;
  const totalUsers = 12;

  const growthData = [
    { name: 'Jan', ofertas: 20 },
    { name: 'Fev', ofertas: 35 },
    { name: 'Mar', ofertas: 60 },
    { name: 'Abr', ofertas: 90 },
    { name: 'Mai', ofertas: 120 },
    { name: 'Jun', ofertas: 142 }
  ];

  const contributorsData = [
    { name: 'Rafael', ofertas: 75 },
    { name: 'Sócio', ofertas: 67 }
  ];

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
      setCarregando(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Check if user is admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.is_admin !== true) {
        alert('Acesso negado. Esta área é exclusiva para administradores.');
        window.location.href = '/dashboard';
        return;
      }

      const res = await fetch('/api/auth/check-status', {
        headers: { 'Authorization': "Bearer " + session?.access_token }
      });
      const statusData = await res.json();
      if (statusData && statusData.active === false) {
        alert('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }
      setCarregando(false);
    }
    verificarAcesso();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verificando credenciais de administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
      <Navbar activePage="admin-dashboard" isDark={isDark} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            Dashboard Administrativo 🛡️
          </h1>
          <p className="text-sm text-gray-550 dark:text-gray-400 mt-1">
            Visualização privilegiada das métricas operacionais do portfólio.
          </p>
        </div>

        {/* Top Summary Cards with Admin styling (purple/gold accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Total de Ofertas */}
          <div className="bg-white dark:bg-gray-900 border border-purple-500/20 rounded-2xl shadow-xs p-6 flex items-center justify-between transition hover:shadow-md hover:border-purple-500/40">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Total de Ofertas
              </span>
              <span className="text-3xl font-black text-purple-600 dark:text-purple-550 mt-1 block">
                {totalOfertas}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-550 mt-1.5 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                Visão Geral
              </span>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400">
              🚀
            </div>
          </div>

          {/* Card 2: Arquivos no Drive */}
          <div className="bg-white dark:bg-gray-900 border border-amber-500/20 rounded-2xl shadow-xs p-6 flex items-center justify-between transition hover:shadow-md hover:border-amber-500/40">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Arquivos no Drive
              </span>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-1 block">
                {totalDriveFiles}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-550 mt-1.5 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Links de Mídia
              </span>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-2xl text-amber-600 dark:text-amber-400">
              📂
            </div>
          </div>

          {/* Card 3: Usuários Cadastrados */}
          <div className="bg-white dark:bg-gray-900 border border-purple-500/20 rounded-2xl shadow-xs p-6 flex items-center justify-between transition hover:shadow-md hover:border-purple-500/40">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Usuários Cadastrados
              </span>
              <span className="text-3xl font-black text-purple-600 dark:text-purple-550 mt-1 block">
                {totalUsers}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-550 mt-1.5 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                Controle de Perfis
              </span>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400">
              👥
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Evolução / Velocidade de Crescimento (LineChart) */}
          <div className="bg-white dark:bg-gray-900 border border-purple-500/10 rounded-2xl p-6 shadow-xs flex flex-col">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block"></span>
              Velocidade de Crescimento
            </h2>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={isDark ? '#374151' : '#E5E7EB'} strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#4B5563'} fontSize={12} />
                    <YAxis stroke={isDark ? '#9CA3AF' : '#4B5563'} fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '8px',
                        color: isDark ? '#F3F4F6' : '#1F2937'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ofertas" stroke="#8B5CF6" strokeWidth={3} activeDot={{ r: 8 }} name="Ofertas Cadastradas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 animate-pulse text-sm">Carregando gráfico...</div>
              )}
            </div>
          </div>

          {/* Chart 2: Produtividade / Top Contribuidores (BarChart) */}
          <div className="bg-white dark:bg-gray-900 border border-purple-500/10 rounded-2xl p-6 shadow-xs flex flex-col">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
              Top Contribuidores
            </h2>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contributorsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={isDark ? '#374151' : '#E5E7EB'} strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#4B5563'} fontSize={12} />
                    <YAxis stroke={isDark ? '#9CA3AF' : '#4B5563'} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        borderRadius: '8px',
                        color: isDark ? '#F3F4F6' : '#1F2937'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="ofertas" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Ofertas Adicionadas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 animate-pulse text-sm">Carregando gráfico...</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
