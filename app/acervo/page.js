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

  const [formData, setFormData] = useState({
    nome_acervo: '',
    url_drive: '',
    nicho: 'Ganhar Dinheiro'
  });

  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState('Todos');

  // Filtragem local combinada dos acervos
  const acervosFiltrados = acervos.filter((acervo) => {
    const matchBusca = acervo.nome_acervo ? acervo.nome_acervo.toLowerCase().includes(filtroBusca.toLowerCase()) : true;
    const matchNicho = filtroNicho === 'Todos' || acervo.nicho === filtroNicho;
    return matchBusca && matchNicho;
  });

  // Verifica acesso e carrega dados
  useEffect(() => {
    async function verificarAcessoAndLoad() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
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
      user_id: user ? user.id : null
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
            
            <nav className="flex items-center gap-6">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 cursor-pointer flex items-center justify-center border border-gray-200 dark:border-gray-700"
                title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
                aria-label="Alternar Tema"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link href="/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/acervo" className="text-sm font-semibold text-blue-600 transition">
                Acervo de Drive
              </Link>
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
                className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      </header>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cadastro Form */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Adicionar Novo Acervo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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

              <div>
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

              <div>
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

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer disabled:opacity-50 text-sm flex justify-center items-center gap-2"
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
            </form>
          </div>

          {/* Listagem */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
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
                      <th className="p-4 font-bold text-xs uppercase tracking-wider">Nicho</th>
                      <th className="p-4 font-bold text-xs uppercase tracking-wider">Nome do Acervo</th>
                      <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {acervosFiltrados.map((acervo) => (
                      <tr key={acervo.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150">
                        {/* Nicho Badge */}
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                            {acervo.nicho}
                          </span>
                        </td>
                        {/* Nome do Acervo */}
                        <td className="p-4 font-bold text-gray-900 dark:text-white max-w-xs truncate" title={acervo.nome_acervo}>
                          {acervo.nome_acervo}
                        </td>
                        {/* Ações */}
                        <td className="p-4 text-right flex items-center justify-end gap-2">
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
                            onClick={() => handleDelete(acervo.id)}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition cursor-pointer"
                            title="Excluir Acervo"
                          >
                            Excluir
                          </button>
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
    </div>
  );
}
