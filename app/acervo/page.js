'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const NICHOS_LIST = [
  'Ganhar Dinheiro',
  'Saúde & Bem-estar',
  'Relacionamentos',
  'Desenvolvimento Pessoal',
  'Hobbies & Profissões',
  'Religioso',
  'Educação e Desenvolvimento'
];

const NICHO_COLORS = {
  'Ganhar Dinheiro': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50',
  'Saúde & Bem-estar': 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50',
  'Relacionamentos': 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900/50',
  'Desenvolvimento Pessoal': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50',
  'Hobbies & Profissões': 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50',
  'Religioso': 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50',
  'Educação e Desenvolvimento': 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900/50'
};

function getNichoColorClass(nicho) {
  return NICHO_COLORS[nicho] || 'bg-gray-50 dark:bg-gray-950/40 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-900/50';
}

export default function AcervoPage() {
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

  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [acervos, setAcervos] = useState([]);
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [acervoDetalhes, setAcervoDetalhes] = useState(null);
  const [historicoNomes, setHistoricoNomes] = useState({ criadoPor: 'Carregando...', editadoPor: 'Carregando...', atualizadoEm: null });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function carregarHistoricoNomes() {
      if (!acervoDetalhes) return;
      setHistoricoNomes({ criadoPor: 'Carregando...', editadoPor: 'Carregando...' });
      const createdBy = acervoDetalhes.created_by;
      const updatedBy = acervoDetalhes.atualizado_por;
      const updatedAt = acervoDetalhes.atualizado_em;
      
      const ids = [];
      if (createdBy) ids.push(createdBy);
      if (updatedBy && !ids.includes(updatedBy)) ids.push(updatedBy);
      
      if (ids.length === 0) {
        setHistoricoNomes({ criadoPor: 'Desconhecido', editadoPor: 'Desconhecido', atualizadoEm: updatedAt ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null });
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', ids);
        
      if (!error && data) {
        const map = {};
        data.forEach(p => { map[p.id] = p.nome; });
        const dataFormatada = updatedAt ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
        setHistoricoNomes({
          criadoPor: map[createdBy] || 'Desconhecido',
          editadoPor: map[updatedBy] || map[createdBy] || 'Desconhecido',
          atualizadoEm: dataFormatada
        });
      } else {
        setHistoricoNomes({ criadoPor: 'Desconhecido', editadoPor: 'Desconhecido', atualizadoEm: null });
      }
    }
    carregarHistoricoNomes();
  }, [acervoDetalhes]);

  const [formData, setFormData] = useState({
    nome_acervo: '',
    url_drive: '',
    nicho: 'Ganhar Dinheiro'
  });

  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState('Todos');

  // Estados de edição de acervo
  const [acervoEmEdicao, setAcervoEmEdicao] = useState(null);
  const [formDataEdicao, setFormDataEdicao] = useState({
    nome_acervo: '',
    url_drive: '',
    nicho: ''
  });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Filtragem local combinada dos acervos
  const acervosFiltrados = acervos.filter((acervo) => {
    const matchBusca = acervo.nome_acervo ? acervo.nome_acervo.toLowerCase().includes(filtroBusca.toLowerCase()) : true;
    const matchNicho = filtroNicho === 'Todos' || acervo.nicho === filtroNicho;
    return matchBusca && matchNicho;
  });

  const handleRowClick = (e, acervo) => {
    if (e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    if (window.innerWidth < 768) {
      setAcervoDetalhes(acervo);
    }
  };

  const abrirEdicao = (acervo) => {
    setAcervoEmEdicao(acervo);
    setFormDataEdicao({
      nome_acervo: acervo.nome_acervo,
      url_drive: acervo.url_drive,
      nicho: acervo.nicho
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formDataEdicao.nome_acervo.trim() || !formDataEdicao.url_drive.trim()) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setSalvandoEdicao(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('acervos_drive')
      .update({
        nome_acervo: formDataEdicao.nome_acervo.trim(),
        url_drive: formDataEdicao.url_drive.trim(),
        nicho: formDataEdicao.nicho,
        atualizado_por: user ? user.id : null,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', acervoEmEdicao.id);

    if (error) {
      console.error('Erro ao atualizar acervo:', error);
      alert('Erro ao salvar alterações: ' + error.message);
    } else {
      setAcervoEmEdicao(null);
      await carregarAcervos();
    }
    setSalvandoEdicao(false);
  };

  // Verifica acesso e carrega dados
  useEffect(() => {
    async function verificarAcessoAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      if (session.user.email === 'rafael.longo97@gmail.com') {
        setIsAdmin(true);
      }

      // Verifica status de acesso através da API segura
      const res = await fetch('/api/auth/check-status', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const statusData = await res.json();

      console.log('Verificação de Acesso (Acervo):', statusData);

      if (statusData && statusData.active === false) {
        alert('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }

      setCarregandoAuth(false);
      await carregarAcervos();
    }
    verificarAcessoAndLoad();
  }, []);

  async function carregarAcervos() {
    setCarregandoDados(true);
    const { data, error } = await supabase
      .from('acervos_drive')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar acervos:', error);
      setMensagem({ type: 'error', text: 'Não foi possível carregar os acervos.' });
    } else {
      setAcervos(data || []);
    }
    setCarregandoDados(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_acervo.trim() || !formData.url_drive.trim()) {
      setMensagem({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setSalvando(true);
    setMensagem({ type: '', text: '' });

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      nome_acervo: formData.nome_acervo.trim(),
      url_drive: formData.url_drive.trim(),
      nicho: formData.nicho,
      user_id: user ? user.id : null,
      created_by: user ? user.id : null,
      atualizado_por: user ? user.id : null,
      atualizado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from('acervos_drive')
      .insert([payload]);

    if (error) {
      console.error('Erro ao cadastrar acervo:', error);
      setMensagem({ type: 'error', text: `Erro ao salvar: ${error.message}` });
    } else {
      setMensagem({ type: 'success', text: 'Acervo cadastrado com sucesso! 🚀' });
      setFormData({
        nome_acervo: '',
        url_drive: '',
        nicho: 'Ganhar Dinheiro'
      });
      await carregarAcervos();
    }
    setSalvando(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este acervo?')) return;

    const { error } = await supabase
      .from('acervos_drive')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir acervo:', error);
      alert('Erro ao excluir acervo: ' + error.message);
    } else {
      await carregarAcervos();
    }
  };

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Autenticando...</p>
        </div>
      </div>
    );
  }

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
              <Link href="/swipe" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Swipe File
              </Link>
              <Link href="/acervo" className="text-sm font-semibold text-blue-600 transition">
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
                href="/swipe" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
              >
                Swipe File
              </Link>
              <Link 
                href="/acervo" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-blue-600 transition"
              >
                Acervo de Drive
              </Link>
              <Link 
                href="/configuracoes" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
              >
                Configurações
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-semibold text-red-600 hover:text-red-700 transition"
                >
                  Painel Admin
                </Link>
              )}
              
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">Acervo de Drives 📁</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie e acesse de forma rápida as pastas compartilhadas do Google Drive.</p>
        </div>

        {mensagem.text && (
          <div className={`p-4 rounded-lg mb-6 border ${
            mensagem.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/50' 
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50'
          }`}>
            <span className="font-bold text-sm">{mensagem.text}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Cadastro Form */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Adicionar Novo Acervo</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nome do Acervo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="nome_acervo"
                  value={formData.nome_acervo}
                  onChange={handleChange}
                  placeholder="Ex: Biblioteca de PLRs de Emagrecimento"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-xs"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">URL do Drive <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  name="url_drive"
                  value={formData.url_drive}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nicho <span className="text-red-500">*</span></label>
                <select 
                  name="nicho"
                  value={formData.nicho}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition shadow-xs cursor-pointer"
                >
                  {NICHOS_LIST.map(nicho => (
                    <option key={nicho} value={nicho}>{nicho}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer disabled:opacity-50 text-sm flex justify-center items-center gap-2 h-[42px]"
                >
                  {salvando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Cadastrar Drive</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Listagem */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Drives Compartilhados</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{acervos.length} cadastrados</span>
            </div>

            {/* Filtros da Listagem */}
            {!carregandoDados && acervos.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/20 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center">
                {/* Busca por Nome */}
                <div className="w-full sm:flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    placeholder="Buscar acervo por nome..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-medium transition shadow-xs"
                  />
                  {filtroBusca && (
                    <button 
                      onClick={() => setFiltroBusca('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Filtro por Nicho */}
                <div className="w-full sm:w-48">
                  <select
                    value={filtroNicho}
                    onChange={(e) => setFiltroNicho(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-medium transition shadow-xs cursor-pointer"
                  >
                    <option value="Todos">Filtrar por Nicho</option>
                    {NICHOS_LIST.map(nicho => (
                      <option key={nicho} value={nicho}>{nicho}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-x-auto">
              {carregandoDados ? (
                <div className="p-12 text-center flex flex-col justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Buscando acervos salvos...</p>
                </div>
              ) : acervos.length === 0 ? (
                <div className="p-12 text-center max-w-md mx-auto">
                  <span className="text-3xl mb-3 block">📁</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Nenhum acervo de drive cadastrado</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Use o formulário ao lado para registrar o seu primeiro acervo de arquivos compartilhado do Google Drive.</p>
                </div>
              ) : acervosFiltrados.length === 0 ? (
                <div className="p-12 text-center max-w-md mx-auto flex flex-col items-center">
                  <span className="text-3xl mb-3 block">🔍</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Nenhum acervo encontrado</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum acervo encontrado com esses critérios. Tente mudar o texto de busca ou selecionar outro filtro.</p>
                  <button
                    onClick={() => {
                      setFiltroBusca('');
                      setFiltroNicho('Todos');
                    }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="p-4 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Nicho</th>
                      <th className="p-4 font-bold text-xs uppercase tracking-wider">Nome do Acervo</th>
                      <th className="p-4 font-bold text-xs uppercase tracking-wider text-right hidden md:table-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {acervosFiltrados.map((acervo) => (
                      <tr 
                        key={acervo.id} 
                        onClick={(e) => handleRowClick(e, acervo)}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150 cursor-pointer md:cursor-default"
                      >
                        {/* Nicho Badge */}
                        <td className="p-4 hidden md:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${getNichoColorClass(acervo.nicho)}`}>
                            {acervo.nicho}
                          </span>
                        </td>
                        {/* Nome do Acervo */}
                        <td className="p-4 font-bold text-gray-900 dark:text-white max-w-xs truncate" title={acervo.nome_acervo}>
                          {acervo.nome_acervo}
                        </td>
                        {/* Ações */}
                        <td className="p-4 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={acervo.url_drive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Abrir Link</span>
                              <span>↗</span>
                            </a>
                            <button
                              onClick={() => abrirEdicao(acervo)}
                              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 transition cursor-pointer flex items-center gap-1"
                              title="Editar Acervo"
                            >
                              <span>✏️</span>
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(acervo.id)}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer flex items-center gap-1"
                              title="Excluir Acervo"
                            >
                              <span>🗑️</span>
                              <span className="hidden sm:inline">Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Modal de Edição */}
      {acervoEmEdicao && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-250 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Editar Acervo</h3>
              <button 
                onClick={() => setAcervoEmEdicao(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nome do Acervo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formDataEdicao.nome_acervo}
                  onChange={(e) => setFormDataEdicao(prev => ({ ...prev, nome_acervo: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-905 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">URL do Drive <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  value={formDataEdicao.url_drive}
                  onChange={(e) => setFormDataEdicao(prev => ({ ...prev, url_drive: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-905 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Nicho <span className="text-red-500">*</span></label>
                <select 
                  value={formDataEdicao.nicho}
                  onChange={(e) => setFormDataEdicao(prev => ({ ...prev, nicho: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium transition cursor-pointer"
                >
                  {NICHOS_LIST.map(nicho => (
                    <option key={nicho} value={nicho}>{nicho}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setAcervoEmEdicao(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {salvandoEdicao ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes (Mobile Only) */}
      {acervoDetalhes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 md:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Detalhes do Acervo</h3>
              <button 
                onClick={() => setAcervoDetalhes(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-semibold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Nicho */}
              <div>
                <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Nicho</span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${getNichoColorClass(acervoDetalhes.nicho)}`}>
                  {acervoDetalhes.nicho}
                </span>
              </div>

              {/* Nome */}
              <div>
                <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Nome do Acervo</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white break-words">{acervoDetalhes.nome_acervo}</span>
              </div>

              {/* URL */}
              <div>
                <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">URL do Google Drive</span>
                <a 
                  href={acervoDetalhes.url_drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all block"
                >
                  {acervoDetalhes.url_drive}
                </a>
              </div>

              {/* Data de Cadastro */}
              {acervoDetalhes.created_at && (
                <div>
                  <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Cadastrado em</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(acervoDetalhes.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {/* Histórico de Edição */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Histórico</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Criado por: <span className="font-semibold">{historicoNomes.criadoPor}</span>
                </span>
                {historicoNomes.atualizadoEm && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Última atualização por{' '}
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{historicoNomes.editadoPor}</span>
                    {' '}em{' '}
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{historicoNomes.atualizadoEm}</span>
                  </p>
                )}
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <a 
                  href={acervoDetalhes.url_drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm text-sm text-center flex items-center justify-center gap-2 cursor-pointer h-[46px]"
                >
                  <span>Abrir Link no Google Drive</span>
                  <span>↗</span>
                </a>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const item = acervoDetalhes;
                      setAcervoDetalhes(null);
                      abrirEdicao(item);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg border border-gray-200 dark:border-gray-700 transition cursor-pointer flex items-center justify-center gap-2 text-sm h-[46px]"
                  >
                    <span>✏️ Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      const id = acervoDetalhes.id;
                      setAcervoDetalhes(null);
                      handleDelete(id);
                    }}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold py-3 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer flex items-center justify-center gap-2 text-sm h-[46px]"
                  >
                    <span>🗑️ Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
