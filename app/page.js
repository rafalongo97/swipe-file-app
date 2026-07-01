'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    nome_produto: '', 
    status_ativo: true, 
    nicho: '', 
    subnicho: '', 
    data_primeiro_anuncio: '', 
    tipo_funil: 'DR', 
    link_site: '', 
    link_checkout: '', 
    valor_front: '', 
    valor_upsell_maior: '', 
    valor_desconto: '', 
    qtd_order_bump: 0, 
    nomes_order_bumps: '', 
    formato_entrega: 'Vídeo'
  });
  const [mensagem, setMensagem] = useState({ type: '', text: '' });

  // Verifica se o usuário está logado e busca os dados se estiver em modo de edição
  useEffect(() => {
    async function verificarAcesso() {
      // 1. Verifica sessão
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login'; // Expulsa para o login se não tiver sessão
        return;
      }
      
      setCarregandoAuth(false);

      // 2. Verifica modo de edição
      const params = new URLSearchParams(window.location.search);
      const editParam = params.get('edit');
      
      if (editParam) {
        setEditId(editParam);
        setCarregandoDados(true);
        console.log("Modo de edição ativo para o ID:", editParam);
        
        const { data, error } = await supabase
          .from('ofertas_swipe_file')
          .select('*')
          .eq('id', editParam)
          .single();
          
        if (error) {
          console.error("Erro ao buscar dados da oferta para edição:", error);
          setMensagem({ 
            type: 'error', 
            text: 'Não foi possível carregar a oferta para edição.' 
          });
        } else if (data) {
          // Preenche os campos do formulário (convertendo valores numéricos ou nulos para string controlada)
          setFormData({
            nome_produto: data.nome_produto || '',
            status_ativo: data.status_ativo !== undefined ? data.status_ativo : true,
            nicho: data.nicho || '',
            subnicho: data.subnicho || '',
            data_primeiro_anuncio: data.data_primeiro_anuncio || '',
            tipo_funil: data.tipo_funil || 'DR',
            link_site: data.link_site || '',
            link_checkout: data.link_checkout || '',
            valor_front: data.valor_front !== null && data.valor_front !== undefined ? data.valor_front.toString() : '',
            valor_upsell_maior: data.valor_upsell_maior !== null && data.valor_upsell_maior !== undefined ? data.valor_upsell_maior.toString() : '',
            valor_desconto: data.valor_desconto !== null && data.valor_desconto !== undefined ? data.valor_desconto.toString() : '',
            qtd_order_bump: data.qtd_order_bump !== null && data.qtd_order_bump !== undefined ? data.qtd_order_bump : 0,
            nomes_order_bumps: data.nomes_order_bumps || '',
            formato_entrega: data.formato_entrega || 'Vídeo'
          });
        }
        setCarregandoDados(false);
      }
    }
    verificarAcesso();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem({ type: '', text: '' });

    // 1. Validação de Obrigatoriedade (Campos obrigatórios específicos)
    const camposObrigatorios = [
      { key: 'nome_produto', label: 'Nome do Produto' },
      { key: 'nicho', label: 'Nicho' },
      { key: 'subnicho', label: 'Subnicho' },
      { key: 'data_primeiro_anuncio', label: 'Data do Primeiro Anúncio' },
      { key: 'tipo_funil', label: 'Tipo de Funil' },
      { key: 'formato_entrega', label: 'Formato de Entrega' },
      { key: 'valor_front', label: 'Valor do Front' }
    ];

    for (const campo of camposObrigatorios) {
      const valor = formData[campo.key];
      if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        const mensagemErro = `Por favor, preencha o campo obrigatório: "${campo.label}"`;
        setMensagem({ type: 'error', text: mensagemErro });
        alert(mensagemErro); // Alerta no navegador em Português do Brasil
        setSalvando(false);
        return;
      }
    }

    // 2. LOG CRUCIAL: Verifique no seu F12 (Console) o que aparece aqui
    console.log("Dados do formulário (antes da sanitização):", formData);

    // 3. Correção de Erro Numérico: converter strings vazias ou inválidas para null
    const sanitizeNumber = (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const sanitizeInt = (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? null : parsed;
    };

    const payload = {
      ...formData,
      valor_front: sanitizeNumber(formData.valor_front),
      valor_upsell_maior: sanitizeNumber(formData.valor_upsell_maior),
      valor_desconto: sanitizeNumber(formData.valor_desconto),
      qtd_order_bump: sanitizeInt(formData.qtd_order_bump)
    };

    console.log("Enviando para Supabase (payload sanitizado):", payload);

    // 4. Envio (Condicional: Update se tiver editId, senão Insert)
    let dbError = null;
    if (editId) {
      const { error } = await supabase
        .from('ofertas_swipe_file')
        .update(payload)
        .eq('id', editId);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('ofertas_swipe_file')
        .insert([payload]);
      dbError = error;
    }

    if (dbError) {
      console.error("Erro detalhado do Supabase:", dbError);
      setMensagem({ 
        type: 'error', 
        text: `Erro ao salvar a oferta: ${dbError.message}` 
      });
    } else {
      setMensagem({ 
        type: 'success', 
        text: editId 
          ? 'Oferta atualizada com sucesso no seu Swipe File! 🚀'
          : 'Oferta adicionada ao seu Swipe File com sucesso! 🚀' 
      });
      
      if (!editId) {
        // Limpa o formulário apenas se for um novo cadastro
        setFormData({
          nome_produto: '', 
          status_ativo: true, 
          nicho: '', 
          subnicho: '', 
          data_primeiro_anuncio: '', 
          tipo_funil: 'DR', 
          link_site: '', 
          link_checkout: '', 
          valor_front: '', 
          valor_upsell_maior: '', 
          valor_desconto: '', 
          qtd_order_bump: 0, 
          nomes_order_bumps: '', 
          formato_entrega: 'Vídeo'
        });
      }
    }
    setSalvando(false);
  };

  // Mostra um carregando sutil na validação de login ou busca de dados de edição
  if (carregandoAuth || carregandoDados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando informações...</p>
        </div>
      </div>
    );
  }

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
              <a href="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              {editId ? 'Editar Oferta' : 'Nova Oferta'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {editId 
                ? 'Atualize os elementos de conversão desta oferta já registrada.' 
                : 'Registre e organize os elementos de conversão de uma nova oferta.'}
            </p>
          </div>
          <a 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            ← Voltar para o Dashboard
          </a>
        </div>

        {/* Feedback Messages */}
        {mensagem.text && (
          <div className={`mb-8 p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
            mensagem.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <span className="text-lg">{mensagem.type === 'error' ? '❌' : '⚡'}</span>
            <div className="text-sm font-medium">{mensagem.text}</div>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              {editId ? 'Formulário de Edição' : 'Formulário de Cadastro'}
            </h2>
            {editId && (
              <a href="/" className="text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-md">
                + Criar Nova em vez disso
              </a>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Section 1: Geral */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">1. Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome do Produto <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="nome_produto" 
                    value={formData.nome_produto} 
                    onChange={handleChange} 
                    required 
                    placeholder="Ex: Método Seca Rápido"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nicho <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="nicho" 
                    value={formData.nicho} 
                    onChange={handleChange} 
                    required
                    placeholder="Ex: Emagrecimento"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subnicho <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="subnicho" 
                    value={formData.subnicho} 
                    onChange={handleChange} 
                    required
                    placeholder="Ex: Keto Diet"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Data do Primeiro Anúncio <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="data_primeiro_anuncio" 
                    value={formData.data_primeiro_anuncio} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>

                <div className="flex items-center h-full pt-8 pl-1">
                  <label className="relative flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="status_ativo" 
                      checked={formData.status_ativo} 
                      onChange={handleChange} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-semibold text-gray-900">Anúncio está Ativo?</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Conversão */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">2. Funil & Destinos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Funil <span className="text-red-500">*</span></label>
                  <select 
                    name="tipo_funil" 
                    value={formData.tipo_funil} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium"
                  >
                    <option value="DR">Direct Response (DR)</option>
                    <option value="X1">Um a Um (X1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Formato de Entrega <span className="text-red-500">*</span></label>
                  <select 
                    name="formato_entrega" 
                    value={formData.formato_entrega} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium"
                  >
                    <option value="Vídeo">Vídeo</option>
                    <option value="PDF">PDF</option>
                    <option value="AppWeb">App Web</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Link do Site da Oferta</label>
                  <input 
                    type="url" 
                    name="link_site" 
                    value={formData.link_site} 
                    onChange={handleChange} 
                    placeholder="https://suapagina.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Link do Checkout</label>
                  <input 
                    type="url" 
                    name="link_checkout" 
                    value={formData.link_checkout} 
                    onChange={handleChange} 
                    placeholder="https://checkout.pagamento.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Precificação */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">3. Precificação & Order Bumps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Valor Front (R$) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="valor_front" 
                    value={formData.valor_front} 
                    onChange={handleChange} 
                    required
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Valor com Desconto (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="valor_desconto" 
                    value={formData.valor_desconto} 
                    onChange={handleChange} 
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Valor Maior/Upsell (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="valor_upsell_maior" 
                    value={formData.valor_upsell_maior} 
                    onChange={handleChange} 
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Qtd. Order Bumps</label>
                  <input 
                    type="number" 
                    name="qtd_order_bump" 
                    value={formData.qtd_order_bump} 
                    onChange={handleChange} 
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomes dos Order Bumps</label>
                  <input 
                    type="text" 
                    name="nomes_order_bumps" 
                    value={formData.nomes_order_bumps} 
                    onChange={handleChange} 
                    placeholder="Ex: Planilha VIP, Acesso Vitalício"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button 
                type="submit" 
                disabled={salvando}
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 focus:ring-4 focus:ring-blue-300 transition duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{editId ? 'Atualizando...' : 'Salvando...'}</span>
                  </>
                ) : (
                  <span>{editId ? 'Salvar Alterações' : 'Salvar Oferta'}</span>
                )}
              </button>
              
              <a 
                href="/dashboard" 
                className="w-full sm:w-auto bg-gray-100 text-gray-700 font-bold py-3.5 px-8 rounded-lg hover:bg-gray-200 transition duration-300 text-center flex items-center justify-center border border-gray-200"
              >
                Ver Dashboard
              </a>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
