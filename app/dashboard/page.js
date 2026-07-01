'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [ofertas, setOfertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ofertaSelecionada, setOfertaSelecionada] = useState(null);

  // Estados dos filtros
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'ativos', 'inativos'

  useEffect(() => {
    async function carregarDados() {
      // Verifica o cadeado primeiro
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return; // Para a execução se não estiver logado
      }

      // Se passou pelo cadeado, busca as ofertas
      const { data, error } = await supabase
        .from('ofertas_swipe_file')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setOfertas(data);
      }
      setCarregando(false);
    }
    
    carregarDados();
  }, []);

  // Extrai dinamicamente todos os nichos únicos existentes
  const nichosDisponiveis = Array.from(
    new Set(ofertas.map(o => o.nicho).filter(Boolean))
  ).sort();

  // Filtra as ofertas na memória em tempo real
  const ofertasFiltradas = ofertas.filter(oferta => {
    // 1. Busca por nome do produto
    const matchBusca = oferta.nome_produto
      ?.toLowerCase()
      .includes(filtroBusca.toLowerCase());

    // 2. Filtro por Nicho
    const matchNicho = filtroNicho === '' || oferta.nicho === filtroNicho;

    // 3. Filtro por Status (Ativo / Inativo)
    let matchStatus = true;
    if (filtroStatus === 'ativos') {
      matchStatus = oferta.status_ativo === true;
    } else if (filtroStatus === 'inativos') {
      matchStatus = oferta.status_ativo === false;
    }

    return matchBusca && matchNicho && matchStatus;
  });

  const obterTempoAtivo = (dataPrimeiroAnuncio) => {
    if (!dataPrimeiroAnuncio) return 'Sem registro';
    const dataAnuncio = new Date(dataPrimeiroAnuncio);
    const dataAtual = new Date();
    
    // Zera horas para focar nos dias calendários
    dataAnuncio.setHours(0, 0, 0, 0);
    dataAtual.setHours(0, 0, 0, 0);
    
    const diferencaMs = dataAtual.getTime() - dataAnuncio.getTime();
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
    if (diferencaDias < 0) return 'Data futura';
    if (diferencaDias === 0) return 'Ativo hoje';
    if (diferencaDias === 1) return 'Ativo há 1 dia';
    return `Ativo há ${diferencaDias} dias`;
  };

  const formatarPreco = (valor) => {
    if (valor === null || valor === undefined || valor === "") return '-';
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const renderOrderBumpsModal = () => {
    if (!ofertaSelecionada.nomes_order_bumps) {
      return <p className="text-xs text-gray-500 italic mt-1">Nenhum order bump registrado para esta oferta.</p>;
    }
    try {
      const parsed = JSON.parse(ofertaSelecionada.nomes_order_bumps);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (
          <div className="flex flex-col gap-2 mt-2">
            {parsed.map((bump, idx) => (
              <div key={idx} className="bg-white border border-gray-200 text-gray-700 text-xs px-3.5 py-2 rounded-lg font-medium shadow-2xs flex justify-between items-center">
                <span>{bump.nome}</span>
                {bump.valor !== null && bump.valor !== undefined && bump.valor !== "" && (
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {formatarPreco(bump.valor)}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Fallback
    }
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {ofertaSelecionada.nomes_order_bumps.split(',').map((bump, idx) => (
          <span key={idx} className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium shadow-2xs">
            {bump.trim()}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Swipe<span className="text-blue-600">File</span>
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                PRO
              </span>
            </div>
            
            <nav className="flex items-center gap-6">
              <a href="/dashboard" className="text-sm font-semibold text-blue-600 transition">
                Dashboard
              </a>
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header section with title and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Meu Swipe File 🚀</h1>
            <p className="text-sm text-gray-500 mt-1">Veja e filtre as ofertas cadastradas e seus funis de conversão.</p>
          </div>
          <div>
            <a 
              href="/" 
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 font-bold transition duration-350 gap-2 cursor-pointer"
            >
              <span>+ Nova Oferta</span>
            </a>
          </div>
        </div>

        {/* Filtros Avançados */}
        {!carregando && ofertas.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Campo de Busca */}
            <div className="w-full md:flex-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                🔍
              </span>
              <input
                type="text"
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar por produto..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm"
              />
              {filtroBusca && (
                <button 
                  onClick={() => setFiltroBusca('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              {/* Filtro Nicho */}
              <div className="w-full sm:w-48">
                <select
                  value={filtroNicho}
                  onChange={(e) => setFiltroNicho(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="">Todos os Nichos</option>
                  {nichosDisponiveis.map(nicho => (
                    <option key={nicho} value={nicho}>{nicho}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Status */}
              <div className="w-full sm:w-40">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="ativos">Ativo</option>
                  <option value="inativos">Inativo (Off)</option>
                </select>
              </div>

              {/* Botão de Limpar Filtros */}
              {(filtroBusca || filtroNicho || filtroStatus !== 'todos') && (
                <button
                  onClick={() => {
                    setFiltroBusca('');
                    setFiltroNicho('');
                    setFiltroStatus('todos');
                  }}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition text-sm whitespace-nowrap cursor-pointer shadow-sm"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dashboard table / content */}
        {carregando ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Buscando suas ofertas salvas...</p>
          </div>
        ) : ofertas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm max-w-xl mx-auto mt-8">
            <span className="text-4xl mb-4 block">📂</span>
            <h3 className="text-lg font-bold text-gray-950 mb-2">Nenhuma oferta salva ainda</h3>
            <p className="text-gray-500 mb-6 text-sm">Comece a construir seu arquivo de referências adicionando a sua primeira oferta activa.</p>
            <a 
              href="/" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow hover:bg-blue-700 font-bold transition text-sm"
            >
              Criar primeira oferta
            </a>
          </div>
        ) : ofertasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm max-w-xl mx-auto mt-4">
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-lg font-bold text-gray-950 mb-2">Nenhuma oferta encontrada</h3>
            <p className="text-gray-500 mb-6 text-sm">Nenhuma oferta encontrada com esses critérios. Tente mudar o texto da busca ou selecionar outros filtros.</p>
            <button 
              onClick={() => {
                setFiltroBusca('');
                setFiltroNicho('');
                setFiltroStatus('todos');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md font-bold transition text-sm cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Nome da Oferta</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Tempo Ativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ofertasFiltradas.map((oferta) => (
                    <tr 
                      key={oferta.id} 
                      onClick={() => setOfertaSelecionada(oferta)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-all duration-200"
                    >
                      {/* Produto */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-base">📁</span> {oferta.nome_produto}
                        </div>
                      </td>

                      {/* Tempo Ativo */}
                      <td className="p-4 text-gray-600 font-semibold">
                        {obterTempoAtivo(oferta.data_primeiro_anuncio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE DETALHES DA OFERTA */}
      {ofertaSelecionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  {ofertaSelecionada.nome_produto}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Detalhes completos do Swipe File</p>
              </div>
              <div className="flex items-center gap-3">
                {ofertaSelecionada.status_ativo ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                    Inativo
                  </span>
                )}
                <button 
                  onClick={() => setOfertaSelecionada(null)}
                  className="text-gray-400 hover:text-gray-600 bg-gray-200/50 hover:bg-gray-200 p-2 rounded-full transition"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nicho / Subnicho</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {ofertaSelecionada.nicho || 'Não informado'} 
                    {ofertaSelecionada.subnicho && ` › ${ofertaSelecionada.subnicho}`}
                  </span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tempo Ativo</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {obterTempoAtivo(ofertaSelecionada.data_primeiro_anuncio)} 
                    {ofertaSelecionada.data_primeiro_anuncio && ` (desde ${ofertaSelecionada.data_primeiro_anuncio.split('-').reverse().join('/')})`}
                  </span>
                </div>
              </div>

              {/* Funnel & Delivery format */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tipo de Funil</span>
                  <span className="text-sm font-bold text-blue-600">
                    {ofertaSelecionada.tipo_funil === 'DR' ? 'Direct Response (DR)' : ofertaSelecionada.tipo_funil === 'X1' ? 'Um a Um (X1)' : ofertaSelecionada.tipo_funil}
                  </span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Formato de Entrega</span>
                  <span className="text-sm font-semibold text-gray-800">{ofertaSelecionada.formato_entrega}</span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informações de Precificação</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider block">Front-end</span>
                    <span className="text-sm font-bold text-blue-700 mt-1 block">
                      {formatarPreco(ofertaSelecionada.valor_front)}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Principal</span>
                    <span className="text-sm font-bold text-gray-700 mt-1 block">
                      {formatarPreco(ofertaSelecionada.valor_principal)}
                    </span>
                  </div>
                  <div className="bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                    <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider block">Com Desconto</span>
                    <span className="text-sm font-bold text-red-700 mt-1 block">
                      {formatarPreco(ofertaSelecionada.valor_desconto)}
                    </span>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                    <span className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider block">Upsell</span>
                    <span className="text-sm font-bold text-purple-700 mt-1 block">
                      {formatarPreco(ofertaSelecionada.valor_upsell || ofertaSelecionada.valor_upsell_maior)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Bumps Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Order Bumps</span>
                {renderOrderBumpsModal()}
              </div>
            </div>

            {/* Footer with links */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap sm:flex-nowrap gap-3">
              <a 
                href={`/?edit=${ofertaSelecionada.id}`}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 text-center font-bold py-2.5 px-6 rounded-lg text-sm transition"
              >
                ✏️ Editar Oferta
              </a>
              {ofertaSelecionada.link_site && (
                <a 
                  href={ofertaSelecionada.link_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-center font-bold py-2.5 px-4 rounded-lg text-sm transition"
                >
                  🔗 Ver Site / LP
                </a>
              )}
              {ofertaSelecionada.link_checkout && (
                <a 
                  href={ofertaSelecionada.link_checkout}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-2.5 px-4 rounded-lg text-sm transition"
                >
                  💳 Checkout Principal ↗
                </a>
              )}
              {ofertaSelecionada.link_checkout_upsell && (
                <a 
                  href={ofertaSelecionada.link_checkout_upsell}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold py-2.5 px-4 rounded-lg text-sm transition"
                >
                  💳 Checkout Upsell ↗
                </a>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
