'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
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

  const [ofertas, setOfertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ofertaSelecionada, setOfertaSelecionada] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estados dos filtros
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'ativos', 'inativos'
  const [selectedFunilStatus, setSelectedFunilStatus] = useState('Todas');
  const [filtroTempoAtivo, setFiltroTempoAtivo] = useState('Todas');
  const [filtroTipoOferta, setFiltroTipoOferta] = useState('Todas');
  const [apenasEscaladas, setApenasEscaladas] = useState(false);
  const [filtroMercado, setFiltroMercado] = useState('Todos');

  // Estados de ordenação
  const [sortField, setSortField] = useState('created_at'); // 'nome_produto', 'tempo_ativo', 'created_at'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'

  // Estados de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [excluindo, setExcluindo] = useState(false);

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

    // 4. Filtro por Status do Funil
    const matchFunilStatus = selectedFunilStatus === 'Todas' || (oferta.status_funil || 'Em análise') === selectedFunilStatus;

    // 5. Filtro por Tempo Ativo (data_primeiro_anuncio)
    let matchTempoAtivo = true;
    if (filtroTempoAtivo !== 'Todas') {
      if (!oferta.data_primeiro_anuncio) {
        matchTempoAtivo = false;
      } else {
        const dataAnuncio = new Date(oferta.data_primeiro_anuncio);
        const dataAtual = new Date();
        
        // Zera horas para focar nos dias calendários
        dataAnuncio.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        
        const diferencaMs = dataAtual.getTime() - dataAnuncio.getTime();
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        
        if (filtroTempoAtivo === '30') {
          matchTempoAtivo = diferencaDias >= 0 && diferencaDias <= 30;
        } else if (filtroTempoAtivo === '60') {
          matchTempoAtivo = diferencaDias >= 0 && diferencaDias <= 60;
        } else if (filtroTempoAtivo === '90') {
          matchTempoAtivo = diferencaDias >= 0 && diferencaDias <= 90;
        } else if (filtroTempoAtivo === '90+') {
          matchTempoAtivo = diferencaDias > 90;
        }
      }
    }

    // 6. Filtro por Tipo de Oferta (com suporte a array e fallback para tipo_funil)
    let matchTipoOferta = true;
    if (filtroTipoOferta !== 'Todas') {
      let tiposOferta = [];
      if (oferta.tipo_oferta && Array.isArray(oferta.tipo_oferta) && oferta.tipo_oferta.length > 0) {
        tiposOferta = oferta.tipo_oferta;
      } else {
        tiposOferta = oferta.tipo_funil === 'X1' ? ['1X1'] : ['DR'];
      }
      matchTipoOferta = tiposOferta.includes(filtroTipoOferta);
    }

    // 7. Filtro por Apenas Escaladas
    const matchEscaladas = !apenasEscaladas || oferta.esta_escalada === true;

    // 8. Filtro por Idioma/Mercado
    const matchMercado = filtroMercado === 'Todos' || (oferta.idioma_mercado || 'BR') === filtroMercado;

    return matchBusca && matchNicho && matchStatus && matchFunilStatus && matchTempoAtivo && matchTipoOferta && matchEscaladas && matchMercado;
  });

  // Ordenação das ofertas filtradas
  const ofertasOrdenadas = [...ofertasFiltradas].sort((a, b) => {
    if (sortField === 'nome_produto') {
      const nomeA = a.nome_produto || '';
      const nomeB = b.nome_produto || '';
      return sortDirection === 'asc' 
        ? nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' })
        : nomeB.localeCompare(nomeA, 'pt-BR', { sensitivity: 'base' });
    }
    
    if (sortField === 'tempo_ativo') {
      const obterDias = (oferta) => {
        if (!oferta.data_primeiro_anuncio) return -1;
        const dataAnuncio = new Date(oferta.data_primeiro_anuncio);
        const dataAtual = new Date();
        dataAnuncio.setHours(0, 0, 0, 0);
        dataAtual.setHours(0, 0, 0, 0);
        const diferencaMs = dataAtual.getTime() - dataAnuncio.getTime();
        return Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
      };

      const diasA = obterDias(a);
      const diasB = obterDias(b);

      if (diasA === diasB) return 0;
      if (diasA === -1) return 1;
      if (diasB === -1) return -1;

      return sortDirection === 'asc' ? diasA - diasB : diasB - diasA;
    }

    return 0; // Fallback: sem ordenação explícita
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <span className="text-gray-300 dark:text-gray-600 ml-1 text-[10px] select-none">
          ↕
        </span>
      );
    }
    return sortDirection === 'asc' ? (
      <span className="text-blue-600 dark:text-blue-400 ml-1 text-[10px] select-none">
        ▲
      </span>
    ) : (
      <span className="text-blue-600 dark:text-blue-400 ml-1 text-[10px] select-none">
        ▼
      </span>
    );
  };

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

  const handleExcluir = async () => {
    if (deleteConfirmText.toLowerCase() !== 'excluir') return;
    setExcluindo(true);
    const { error, data } = await supabase
      .from('ofertas_swipe_file')
      .delete()
      .eq('id', ofertaSelecionada.id)
      .select();
      
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else if (!data || data.length === 0) {
      alert('Erro de permissão (RLS): A exclusão foi bloqueada pelo banco de dados. Para corrigir, execute este SQL no Editor SQL do seu painel do Supabase:\n\nCREATE POLICY "Allow authenticated delete" ON "public"."ofertas_swipe_file" FOR DELETE TO authenticated USING (true);');
    } else {
      setOfertas(prev => prev.filter(o => o.id !== ofertaSelecionada.id));
      setOfertaSelecionada(null);
    }
    setExcluindo(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const renderStatusFunilBadge = (status) => {
    const val = status || 'Em análise';
    let classes = 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    if (val === 'Em análise') {
      classes = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300';
    } else if (val === 'Para modelar') {
      classes = 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
    } else if (val === 'Já testei') {
      classes = 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300';
    } else if (val === 'Descartado') {
      classes = 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>
        {val}
      </span>
    );
  };

  const renderTipoOfertaBadges = (oferta) => {
    // Tenta obter o array tipo_oferta. Se for nulo/vazio, faz o fallback para tipo_funil
    let tipos = [];
    if (oferta.tipo_oferta && Array.isArray(oferta.tipo_oferta) && oferta.tipo_oferta.length > 0) {
      tipos = oferta.tipo_oferta;
    } else {
      tipos = oferta.tipo_funil === 'X1' ? ['1X1'] : ['DR'];
    }

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {tipos.map((tipo) => {
          let classes = 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
          if (tipo === '1X1') {
            classes = 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
          }
          return (
            <span key={tipo} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${classes}`}>
              {tipo}
            </span>
          );
        })}
      </div>
    );
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
              <Link href="/acervo" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Acervo de Drive
              </Link>
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
              >
                Sair
              </button>
            </nav>

            {/* Hamburger Button (Mobile Only) */}
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
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMenuOpen(false)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-64 max-w-xs bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col p-6 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 z-50">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button 
                onClick={() => setMenuOpen(false)}
                className="text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 flex-1">
              <Link 
                href="/dashboard" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-blue-600 transition"
              >
                Dashboard
              </Link>
              <Link 
                href="/acervo" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
              >
                Acervo de Drive
              </Link>
              
              <hr className="border-gray-200 dark:border-gray-800" />
              
              {/* Toggle theme inside mobile drawer */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tema</span>
                <button
                  type="button"
                  onClick={() => { toggleTheme(); }}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
                  aria-label="Alternar Tema"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>

              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="w-full mt-auto bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer text-center text-sm"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header section with title and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Meu Swipe File 🚀</h1>
            <p className="text-sm text-gray-500 mt-1">Veja e filtre as ofertas cadastradas e seus funis de conversão.</p>
          </div>
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 font-bold transition duration-350 gap-2 cursor-pointer"
            >
              <span>+ Nova Oferta</span>
            </Link>
          </div>
        </div>

        {/* Filtros Avançados */}
        {!carregando && ofertas.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Campo de Busca Principal (Ocupa a maior parte no desktop, largura total no mobile) */}
            <div className="w-full lg:flex-1 relative min-w-[280px]">
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

            {/* Grupo de Filtros Selects + Switch (Flex-wrap com gap uniforme) */}
            <div className="w-full lg:w-auto flex flex-wrap gap-3 items-center justify-start lg:justify-end">
              {/* Filtro Nicho */}
              <div className="w-full sm:w-44">
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
              <div className="w-full sm:w-36">
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

              {/* Filtro de Funil */}
              <div className="w-full sm:w-40">
                <select
                  value={selectedFunilStatus}
                  onChange={(e) => setSelectedFunilStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="Todas">Funil: Todas</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Para modelar">Para modelar</option>
                  <option value="Já testei">Já testei</option>
                  <option value="Descartado">Descartado</option>
                </select>
              </div>

              {/* Filtro de Tempo Ativo */}
              <div className="w-full sm:w-48">
                <select
                  value={filtroTempoAtivo}
                  onChange={(e) => setFiltroTempoAtivo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="Todas">Filtrar por Tempo Ativo</option>
                  <option value="30">Até 30 dias</option>
                  <option value="60">Até 60 dias</option>
                  <option value="90">Até 90 dias</option>
                  <option value="90+">Acima de 90 dias</option>
                </select>
              </div>

              {/* Filtro de Tipo de Oferta */}
              <div className="w-full sm:w-36">
                <select
                  value={filtroTipoOferta}
                  onChange={(e) => setFiltroTipoOferta(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="Todas">Tipo: Todas</option>
                  <option value="DR">DR</option>
                  <option value="1X1">1X1</option>
                </select>
              </div>

              {/* Filtro Mercado */}
              <div className="w-full sm:w-36">
                <select
                  value={filtroMercado}
                  onChange={(e) => setFiltroMercado(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-sm cursor-pointer"
                >
                  <option value="Todos">Mercado: Todos</option>
                  <option value="BR">BR</option>
                  <option value="Latam">Latam</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Francês">Francês</option>
                  <option value="Italiano">Italiano</option>
                </select>
              </div>

              {/* Switch Apenas Escaladas (Integrado organicamente) */}
              <div className="w-full sm:w-auto flex items-center shrink-0 bg-gray-50 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 h-[42px] shadow-sm">
                <label className="relative flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={apenasEscaladas} 
                    onChange={(e) => setApenasEscaladas(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Apenas Escaladas <span className="animate-bounce">🚀</span>
                  </span>
                </label>
              </div>

              {/* Botão de Limpar Filtros */}
              {(filtroBusca || filtroNicho || filtroStatus !== 'todos' || selectedFunilStatus !== 'Todas' || filtroTempoAtivo !== 'Todas' || filtroTipoOferta !== 'Todas' || apenasEscaladas || filtroMercado !== 'Todos') && (
                <button
                  onClick={() => {
                    setFiltroBusca('');
                    setFiltroNicho('');
                    setFiltroStatus('todos');
                    setSelectedFunilStatus('Todas');
                    setFiltroTempoAtivo('Todas');
                    setFiltroTipoOferta('Todas');
                    setApenasEscaladas(false);
                    setFiltroMercado('Todos');
                  }}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition text-sm whitespace-nowrap cursor-pointer shadow-sm h-[42px]"
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
            <Link 
              href="/" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow hover:bg-blue-700 font-bold transition text-sm"
            >
              Criar primeira oferta
            </Link>
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
                setSelectedFunilStatus('Todas');
                setFiltroTempoAtivo('Todas');
                setFiltroTipoOferta('Todas');
                setApenasEscaladas(false);
                setFiltroMercado('Todos');
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
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs text-left">Tipo</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs text-left">Idioma</th>
                    <th className="p-4 text-left">
                      <button 
                        type="button"
                        onClick={() => handleSort('nome_produto')}
                        className="flex items-center gap-1 font-bold text-gray-700 uppercase tracking-wider text-xs hover:text-blue-600 transition duration-200 cursor-pointer outline-none select-none animate-none"
                      >
                        Nome da Oferta {renderSortIcon('nome_produto')}
                      </button>
                    </th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs text-left">Status do Funil</th>
                    <th className="p-4 text-left">
                      <button 
                        type="button"
                        onClick={() => handleSort('tempo_ativo')}
                        className="flex items-center gap-1 font-bold text-gray-700 uppercase tracking-wider text-xs hover:text-blue-600 transition duration-200 cursor-pointer outline-none select-none animate-none"
                      >
                        Tempo Ativo {renderSortIcon('tempo_ativo')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ofertasOrdenadas.map((oferta) => (
                    <tr 
                      key={oferta.id} 
                      onClick={() => setOfertaSelecionada(oferta)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-all duration-200"
                    >
                      {/* Tipo de Oferta */}
                      <td className="p-4">
                        {renderTipoOfertaBadges(oferta)}
                      </td>
                      {/* Idioma/Mercado */}
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2.5 py-0.5 text-xs font-semibold border border-gray-200 dark:border-gray-700/50 shadow-sm">
                          {oferta.idioma_mercado || 'BR'}
                        </span>
                      </td>
                      {/* Produto */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-base">📁</span> {oferta.nome_produto}
                          {oferta.esta_escalada && (
                            <span className="ml-1.5 text-sm" title="Oferta Escalada">🚀</span>
                          )}
                        </div>
                        {oferta.tags && (
                          <div className="flex flex-wrap gap-1 mt-1 pl-7">
                            {oferta.tags.split(',').map((tag, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium border border-gray-200/50 dark:border-gray-700/50">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status do Funil */}
                      <td className="p-4">
                        {renderStatusFunilBadge(oferta.status_funil)}
                      </td>

                      {/* Tempo Ativo */}
                      <td className="p-4 text-gray-600 dark:text-gray-400 font-semibold">
                        {oferta.status_ativo === false ? (
                          <span className="text-red-500 dark:text-red-400 font-bold">Oferta inativa</span>
                        ) : (
                          obterTempoAtivo(oferta.data_primeiro_anuncio)
                        )}
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
        <div 
          onClick={() => setOfertaSelecionada(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
          >
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  {ofertaSelecionada.nome_produto}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Detalhes completos do Swipe File</p>
              </div>
              <div className="flex items-center gap-3">
                {renderTipoOfertaBadges(ofertaSelecionada)}
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
                    {ofertaSelecionada.status_ativo === false ? (
                      <span className="text-red-500 dark:text-red-400 font-bold">Oferta inativa</span>
                    ) : (
                      <>
                        {obterTempoAtivo(ofertaSelecionada.data_primeiro_anuncio)} 
                        {ofertaSelecionada.data_primeiro_anuncio && ` (desde ${ofertaSelecionada.data_primeiro_anuncio.split('-').reverse().join('/')})`}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Funnel, Delivery & Language/Market */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 col-span-2 lg:col-span-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Idioma / Mercado</span>
                  <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-800 px-2.5 py-0.5 text-xs font-bold border border-gray-300">
                    {ofertaSelecionada.idioma_mercado || 'BR'}
                  </span>
                </div>
              </div>

              {/* Funnel Status & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 flex flex-col justify-center items-start">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Status do Funil</span>
                  {renderStatusFunilBadge(ofertaSelecionada.status_funil)}
                </div>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {ofertaSelecionada.tags ? (
                      ofertaSelecionada.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium border border-gray-200/50 dark:border-gray-700/50">
                          {tag.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">Nenhuma tag registrada</span>
                    )}
                  </div>
                </div>
              </div>


              {/* Pricing Cards */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informações de Precificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider block">Preço Front</span>
                    <span className="text-sm font-bold text-blue-700 mt-1 block">
                      {formatarPreco(ofertaSelecionada.valor_front)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Bumps Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Order Bumps</span>
                {renderOrderBumpsModal()}
              </div>

              {/* Notas de Modelagem Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Notas de Modelagem</span>
                {ofertaSelecionada.notas_modelagem ? (
                  <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {ofertaSelecionada.notas_modelagem}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhuma nota registrada para esta oferta.</p>
                )}
              </div>
            </div>

            {/* Footer with links */}
            <div className="border-t border-gray-100 bg-gray-50">
              {/* Linha secundária: Editar e Excluir */}
              <div className="px-6 pt-3 pb-2 flex items-center gap-4">
                <a 
                  href={`/?edit=${ofertaSelecionada.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition"
                >
                  ✏️ Editar oferta
                </a>
                <button
                  onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition"
                >
                  🗑️ Excluir oferta
                </button>
              </div>
              {/* Linha principal: links de acesso rápido */}
              <div className="px-4 pb-4 flex flex-wrap gap-2">
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
                {ofertaSelecionada.link_biblioteca_anuncios && (
                  <a 
                    href={ofertaSelecionada.link_biblioteca_anuncios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold py-2.5 px-4 rounded-lg text-sm transition"
                  >
                    📢 Biblioteca de Anúncios ↗
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && ofertaSelecionada && (
        <div 
          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-red-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-xl">🗑️</div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Excluir oferta</h3>
                <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Você está prestes a excluir permanentemente <strong>{ofertaSelecionada.nome_produto}</strong>.
            </p>
            <p className="text-xs text-gray-500 mb-2">Para confirmar, digite <strong className="text-red-600">excluir</strong> abaixo:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="excluir"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium mb-4 transition"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                disabled={deleteConfirmText.toLowerCase() !== 'excluir' || excluindo}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
