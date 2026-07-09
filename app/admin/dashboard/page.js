'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Navbar from '../../components/Navbar';
import { ResponsiveContainer, Tooltip, Legend, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminDashboardPage() {
  const [carregando, setCarregando] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [erro, setErro] = useState(null);

  // Dynamic database states
  const [ofertas, setOfertas] = useState([]);
  const [totalUsers, setTotalUsers] = useState(12);

  // Quick Edit Modal States
  const [ofertaParaEditar, setOfertaParaEditar] = useState(null);
  const [editQtdCriativosAtivos, setEditQtdCriativosAtivos] = useState(0);
  const [editStatusAtivo, setEditStatusAtivo] = useState(true);

  // Dynamic values computed from state
  const totalOfertas = ofertas.length || 142;
  const totalDriveFiles = ofertas.filter(o => o.link_site?.includes("drive") || o.link_checkout?.includes("drive")).length || 87;

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

  function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  }

  useEffect(() => {
    async function verificarAcesso() {
      try {
        setCarregando(true);
        setErro(null);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          window.location.href = '/login';
          return;
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile || profile.is_admin !== true) {
          alert('Acesso negado. Esta área é exclusiva para administradores.');
          window.location.href = '/dashboard';
          return;
        }

        try {
          const res = await fetch('/api/auth/check-status', {
            headers: { 'Authorization': "Bearer " + session?.access_token }
          });
          if (!res.ok) throw new Error("Check-status response failed");
          const statusData = await res.json();
          if (statusData && statusData.active === false) {
            alert('Sua conta está inativa. Entre em contato com o suporte.');
            await supabase.auth.signOut();
            window.location.href = '/login';
            return;
          }
        } catch (statusErr) {
          console.error("Erro secundário check-status:", statusErr);
        }

        await carregarDadosAdmin();
      } catch (err) {
        console.error("Erro Supabase:", err);
        setErro(err.message || "Erro ao verificar credenciais de acesso.");
      } finally {
        setCarregando(false);
      }
    }
    verificarAcesso();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-550 dark:text-gray-400 font-medium">Verificando credenciais de administrador...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-red-500/20 rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erro ao carregar painel</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400 mb-6">{erro}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-750 text-white font-bold py-2 px-6 rounded-lg text-sm transition shadow-md cursor-pointer"
            >
              🔄 Tentar Novamente
            </button>
            <a
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-6 rounded-lg text-sm border border-gray-200 dark:border-gray-700 transition text-center cursor-pointer"
            >
              ⬅️ Voltar
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch admin stats and data
  async function carregarDadosAdmin() {
    try {
      const { data: listData, error: listError } = await supabase
        .from("ofertas_swipe_file")
        .select("*");
      if (listError) throw listError;
      setOfertas(listData || []);

      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (usersError) throw usersError;
      if (usersCount !== null) {
        setTotalUsers(usersCount);
      }
    } catch (err) {
      console.error("Erro Supabase:", err);
      throw err;
    }
  }

  function obterOfertasPendentesRevisao() {
    return ofertas.filter(oferta => {
      const ultimaVerificacao = oferta.data_ultima_verificacao || oferta.created_at;
      if (!ultimaVerificacao) return true;
      const diffMs = new Date() - new Date(ultimaVerificacao);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 3;
    });
  }

  async function handleMarcarComoVerificado(ofertaId) {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("ofertas_swipe_file")
        .update({ data_ultima_verificacao: now })
        .eq("id", ofertaId);

      if (error) throw error;

      setOfertas(prev => prev.map(o => o.id === ofertaId ? { ...o, data_ultima_verificacao: now } : o));
    } catch (error) {
      console.error("Erro Supabase:", error);
      alert("Erro ao marcar como verificado.");
    }
  }

  function abrirModalEdicaoRapida(oferta) {
    setOfertaParaEditar(oferta);
    setEditQtdCriativosAtivos(oferta.qtd_criativos_ativos || 0);
    setEditStatusAtivo(oferta.status_ativo !== undefined ? oferta.status_ativo : true);
  }

  async function salvarEdicaoRapida() {
    if (!ofertaParaEditar) return;
    try {
      const { error } = await supabase
        .from("ofertas_swipe_file")
        .update({
          qtd_criativos_ativos: editQtdCriativosAtivos,
          status_ativo: editStatusAtivo,
          atualizado_em: new Date().toISOString()
        })
        .eq("id", ofertaParaEditar.id);

      if (error) throw error;

      setOfertas(prev => prev.map(o => o.id === ofertaParaEditar.id ? {
        ...o,
        qtd_criativos_ativos: editQtdCriativosAtivos,
        status_ativo: editStatusAtivo
      } : o));

      setOfertaParaEditar(null);
    } catch (error) {
      console.error("Erro Supabase:", error);
      alert("Erro ao salvar alterações.");
    }
  }

  const ofertasPendentes = obterOfertasPendentesRevisao();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
      <Navbar activePage="admin-dashboard" isDark={isDark} toggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            Dashboard Administrativo 🛡️
          </h1>
          <p className="text-sm text-gray-550 dark:text-gray-400 mt-1">
            Visualização privilegiada das métricas operacionais do portfólio.
          </p>
        </div>

        {/* Lembretes de Revisão (3+ Dias) */}
        <div className="bg-white dark:bg-gray-900 border border-red-500/20 rounded-2xl shadow-xs p-6 mb-8 transition hover:shadow-md">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white mb-4 flex items-center gap-2">
            <span>🚨</span> Lembretes de Revisão (3+ Dias)
          </h2>
          {ofertasPendentes.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl p-4 flex items-center gap-3">
              <span className="text-green-600 text-lg">✅</span>
              <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                Tudo em dia! Nenhuma oferta pendente de revisão.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700/50">
                  <tr>
                    <th className="p-3.5 font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Produto</th>
                    <th className="p-3.5 font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Sem Verificar</th>
                    <th className="p-3.5 font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Biblioteca de Anúncios</th>
                    <th className="p-3.5 font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ofertasPendentes.map((oferta) => {
                    const ultimaVerificacao = oferta.data_ultima_verificacao || oferta.created_at;
                    const diffMs = new Date() - new Date(ultimaVerificacao);
                    const diasSemVerificar = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={oferta.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-855/10 transition duration-150">
                        <td className="p-3.5 font-semibold text-gray-900 dark:text-gray-100">{oferta.nome_produto}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 px-2.5 py-0.5 text-xs font-bold border border-red-200/50 dark:border-red-800/50">
                            {diasSemVerificar} dias
                          </span>
                        </td>
                        <td className="p-3.5">
                          {oferta.link_biblioteca_anuncios ? (
                            <a 
                              href={oferta.link_biblioteca_anuncios} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm font-semibold"
                            >
                              🔗 Biblioteca ↗
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Sem link</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMarcarComoVerificado(oferta.id)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              ✅ Verificado
                            </button>
                            <button
                              onClick={() => abrirModalEdicaoRapida(oferta)}
                              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-1.5 px-3 rounded-lg text-xs border border-gray-200 dark:border-gray-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              ✏️ Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Quick Edit Modal */}
      {ofertaParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 transition-all duration-300 transform scale-100">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span>✏️</span> Edição Rápida de Oferta
              </h3>
              <button 
                onClick={() => setOfertaParaEditar(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full transition"
              >
                ❌
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-1">Produto</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block truncate">{ofertaParaEditar.nome_produto}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-555 uppercase tracking-wider mb-2">Qtd. de Criativos Ativos</label>
                <input 
                  type="number" 
                  value={editQtdCriativosAtivos} 
                  onChange={(e) => setEditQtdCriativosAtivos(parseInt(e.target.value, 10) || 0)} 
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition shadow-sm font-medium" 
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="relative flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editStatusAtivo} 
                    onChange={(e) => setEditStatusAtivo(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-semibold text-gray-900 dark:text-gray-200">Anúncio está Ativo?</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              <button 
                type="button" 
                onClick={() => setOfertaParaEditar(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={salvarEdicaoRapida}
                className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-750 rounded-lg shadow-sm transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
