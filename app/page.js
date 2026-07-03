'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const NICHOS_CONFIG = {
  'Ganhar Dinheiro': ['Marketing Digital', 'Renda Extra', 'Trade', 'Investimentos', 'Criptomoedas', 'Afiliados'],
  'Saúde & Bem-estar': ['Emagrecimento', 'Fitness / Musculação', 'Dietas / Nutrição', 'Saúde Mental', 'Suplementos'],
  'Relacionamentos': ['Sedução / Conquista', 'Casamento / Família', 'Amizades / Networking'],
  'Desenvolvimento Pessoal': ['Produtividade', 'Autoajuda', 'Oratória / Inteligência Emocional', 'Espiritualidade'],
  'Hobbies & Profissões': ['Culinária / Gastronomia', 'Idiomas / Inglês', 'Música / Instrumentos', 'Estética / Beleza', 'Programação / TI', 'Profissões Industriais (Metalúrgica, Elétrica, Solda, etc.)', 'Segurança e Capacitação Técnica'],
  'Religioso': ['Devocionais / Estudos Bíblicos', 'Teologia', 'Orações & Mensagens', 'Família & Relacionamento Cristão', 'Música / Ministério de Louvor', 'Mentalidade / Fé'],
  'Educação e Desenvolvimento': ['Atividades Pedagógicas', 'Educação Inclusiva (Autismo)', 'Treinamento Esportivo', 'Material Didático']
}; // Configuração de Nichos e Subnichos do Swipe File

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
    link_biblioteca_anuncios: '',
    valor_front: '', 
    qtd_order_bump: 0, 
    nomes_order_bumps: '', 
    formato_entrega: 'Vídeo',
    status_funil: 'Em análise',
    tags: '',
    notas_modelagem: '',
    esta_escalada: false,
    tipo_oferta: ['DR'],
    idioma_mercado: 'BR'
  });
  const [orderBumps, setOrderBumps] = useState([]); // [{ nome: '', valor: '' }]
  const [mensagem, setMensagem] = useState({ type: '', text: '' });
  const [menuOpen, setMenuOpen] = useState(false);

  // Verifica se o usuário está logado e busca os dados se estiver em modo de edição
  useEffect(() => {
    async function verificarAcesso() {
      // 1. Verifica sessão
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login'; // Expulsa para o login se não tiver sessão
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

      console.log('Verificação de Acesso (Home):', statusData);

      if (statusData && statusData.active === false) {
        alert('Sua conta está inativa. Entre em contato com o suporte.');
        await supabase.auth.signOut();
        window.location.href = '/login';
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
          let arrayTipoOferta = ['DR'];
          if (data.tipo_oferta && Array.isArray(data.tipo_oferta) && data.tipo_oferta.length > 0) {
            arrayTipoOferta = data.tipo_oferta;
          } else if (data.tipo_funil) {
            arrayTipoOferta = data.tipo_funil === 'X1' ? ['1X1'] : ['DR'];
          }

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
            link_biblioteca_anuncios: data.link_biblioteca_anuncios || '',
            valor_front: data.valor_front !== null && data.valor_front !== undefined ? parseFloat(data.valor_front).toFixed(2).replace('.', ',') : '',
            qtd_order_bump: data.qtd_order_bump !== null && data.qtd_order_bump !== undefined ? data.qtd_order_bump : 0,
            nomes_order_bumps: data.nomes_order_bumps || '',
            formato_entrega: data.formato_entrega || 'Vídeo',
            status_funil: data.status_funil || 'Em análise',
            tags: data.tags || '',
            notas_modelagem: data.notas_modelagem || '',
            esta_escalada: data.esta_escalada !== undefined ? data.esta_escalada : false,
            tipo_oferta: arrayTipoOferta,
            idioma_mercado: data.idioma_mercado || 'BR'
          });

          // Reconstrói o array de order bumps a partir do campo nomes_order_bumps
          let parsedBumps = [];
          const targetQtd = data.qtd_order_bump || 0;
          
          if (data.nomes_order_bumps) {
            try {
              const parsed = JSON.parse(data.nomes_order_bumps);
              if (Array.isArray(parsed)) {
                parsedBumps = parsed.map(bump => ({
                  nome: bump.nome,
                  valor: bump.valor !== null && bump.valor !== undefined && bump.valor !== ''
                    ? parseFloat(bump.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : ''
                }));
              }
            } catch (e) {
              // Formato antigo/legado (texto simples separado por vírgula)
              const nomes = data.nomes_order_bumps.split(',').map(n => n.trim());
              parsedBumps = nomes.map(nome => ({ nome, valor: '' }));
            }
          }

          // Ajusta tamanho para bater com a quantidade de order bumps registrada
          if (parsedBumps.length < targetQtd) {
            const diff = targetQtd - parsedBumps.length;
            for (let i = 0; i < diff; i++) {
              parsedBumps.push({ nome: '', valor: '' });
            }
          } else if (parsedBumps.length > targetQtd && targetQtd > 0) {
            parsedBumps = parsedBumps.slice(0, targetQtd);
          }

          setOrderBumps(parsedBumps);
        }
        setCarregandoDados(false);
      }
    }
    verificarAcesso();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nicho') {
      setFormData({
        ...formData,
        nicho: value,
        subnicho: '' // Zera o subnicho se o nicho for alterado
      });
    } else if (name === 'valor_front') {
      const digits = value.replace(/\D/g, '');
      if (!digits) {
        setFormData({
          ...formData,
          valor_front: ''
        });
        return;
      }
      const num = parseInt(digits, 10) / 100;
      const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setFormData({
        ...formData,
        valor_front: formatted
      });
      return;
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleQtdBumpsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    const cleanValue = Math.max(0, value);
    
    setFormData(prev => ({
      ...prev,
      qtd_order_bump: cleanValue
    }));

    setOrderBumps(prev => {
      const currentLength = prev.length;
      if (cleanValue > currentLength) {
        const diff = cleanValue - currentLength;
        const newBumps = Array.from({ length: diff }, () => ({ nome: '', valor: '' }));
        return [...prev, ...newBumps];
      } else {
        return prev.slice(0, cleanValue);
      }
    });
  };

  const handleBumpFieldChange = (index, field, value) => {
    if (field === 'valor') {
      const digits = value.replace(/\D/g, '');
      if (!digits) {
        setOrderBumps(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], valor: '' };
          return updated;
        });
        return;
      }
      const num = parseInt(digits, 10) / 100;
      const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setOrderBumps(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], valor: formatted };
        return updated;
      });
      return;
    }
    setOrderBumps(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Auto-formata o preço para X,XX ao sair do campo
  const handleValorFrontBlur = () => {
    if (formData.valor_front) {
      const num = parseFloat(formData.valor_front.replace(',', '.'));
      if (!isNaN(num)) {
        setFormData(prev => ({ ...prev, valor_front: num.toFixed(2).replace('.', ',') }));
      }
    }
  };

  const handleBumpValorBlur = (index) => {
    const bump = orderBumps[index];
    if (bump && bump.valor !== '' && bump.valor !== undefined) {
      const num = parseFloat(bump.valor.toString().replace(',', '.'));
      if (!isNaN(num)) {
        setOrderBumps(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], valor: num.toFixed(2).replace('.', ',') };
          return updated;
        });
      }
    }
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
      { key: 'valor_front', label: 'Preço Front' }
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

    // Validação extra para os Order Bumps dinâmicos que foram ativados
    if (formData.qtd_order_bump > 0) {
      for (let i = 0; i < orderBumps.length; i++) {
        if (!orderBumps[i].nome || orderBumps[i].nome.trim() === '') {
          const mensagemErro = `Por favor, preencha o Nome do Order Bump #${i + 1}`;
          setMensagem({ type: 'error', text: mensagemErro });
          alert(mensagemErro);
          setSalvando(false);
          return;
        }
      }
    }

    // 2. LOG CRUCIAL: Verifique no seu F12 (Console) o que aparece aqui
    console.log("Dados do formulário (antes da sanitização):", formData);

    // 3. Correção de Erro Numérico: converter strings vazias ou inválidas para null
    const sanitizeNumber = (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const valStr = typeof val === 'string' 
        ? val.replace(/\./g, '').replace(',', '.') 
        : val.toString();
      const parsed = parseFloat(valStr);
      return isNaN(parsed) ? null : parsed;
    };

    const sanitizeInt = (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? null : parsed;
    };

    // Sanitiza valores dos Order Bumps dinâmicos
    const sanitizedBumps = orderBumps.map(bump => ({
      nome: bump.nome ? bump.nome.trim() : '',
      valor: sanitizeNumber(bump.valor)
    }));

    // Valida se selecionou pelo menos um tipo de oferta
    if (!formData.tipo_oferta || formData.tipo_oferta.length === 0) {
      const msg = 'Selecione pelo menos um Tipo de Oferta (DR ou 1X1).';
      setMensagem({ type: 'error', text: msg });
      alert(msg);
      setSalvando(false);
      return;
    }

    // Mapeia tipo_funil a partir de tipo_oferta para compatibilidade
    const tipoFunilCalculado = formData.tipo_oferta.includes('X1') || formData.tipo_oferta.includes('1X1')
      ? 'X1'
      : 'DR';

    // Remove campos legados/inexistentes da tabela atual
    const { valor_upsell_maior, valor_desconto, valor_principal, valor_upsell, link_checkout_upsell, ...cleanFormData } = formData;

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...cleanFormData,
      tipo_funil: tipoFunilCalculado,
      valor_front: sanitizeNumber(formData.valor_front),
      qtd_order_bump: sanitizeInt(formData.qtd_order_bump),
      nomes_order_bumps: formData.qtd_order_bump > 0 ? JSON.stringify(sanitizedBumps) : '',
      updated_by: user ? user.id : null
    };

    if (!editId) {
      payload.created_by = user ? user.id : null;
    }

    console.log("Enviando para Supabase (payload sanitizado):", payload);

    // 4. Envio (Condicional: Update se tiver editId, senão Insert)
    let dbError = null;
    let rowsAffected = 0;
    if (editId) {
      const { error, data: updateData } = await supabase
        .from('ofertas_swipe_file')
        .update(payload)
        .eq('id', editId)
        .select();
      dbError = error;
      rowsAffected = updateData ? updateData.length : 0;
    } else {
      const { error, data: insertData } = await supabase
        .from('ofertas_swipe_file')
        .insert([payload])
        .select();
      dbError = error;
      rowsAffected = insertData ? insertData.length : 0;
    }

    if (dbError) {
      console.error("Erro detalhado do Supabase:", dbError);
      setMensagem({ 
        type: 'error', 
        text: `Erro ao salvar a oferta: ${dbError.message}` 
      });
    } else if (editId && rowsAffected === 0) {
      console.error("Update bloqueado pelo RLS - 0 linhas afetadas");
      setMensagem({ 
        type: 'error', 
        text: 'Erro de permissão: não foi possível salvar as alterações. Por favor, entre em contato com o suporte.' 
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
          link_biblioteca_anuncios: '',
          valor_front: '', 
          qtd_order_bump: 0, 
          nomes_order_bumps: '', 
          formato_entrega: 'Vídeo',
          status_funil: 'Em análise',
          tags: '',
          notas_modelagem: '',
          esta_escalada: false,
          tipo_oferta: ['DR'],
          idioma_mercado: 'BR'
        });
        setOrderBumps([]);
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
              <Link href="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/acervo" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
                Acervo de Drive
              </Link>
              <Link href="/configuracoes" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
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
                href="/dashboard" 
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition"
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-955 tracking-tight">
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
              <Link href="/" className="text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-md">
                + Criar Nova em vez disso
              </Link>
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
                  <select
                    name="nicho"
                    value={formData.nicho}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium"
                  >
                    <option value="">Selecione um nicho</option>
                    {Object.keys(NICHOS_CONFIG).map((nichoKey) => (
                      <option key={nichoKey} value={nichoKey}>
                        {nichoKey}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subnicho <span className="text-red-500">*</span></label>
                  <select
                    name="subnicho"
                    value={formData.subnicho}
                    onChange={handleChange}
                    required
                    disabled={!formData.nicho}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um subnicho</option>
                    {formData.nicho && NICHOS_CONFIG[formData.nicho] && NICHOS_CONFIG[formData.nicho].map((subnichoName) => (
                      <option key={subnichoName} value={subnichoName}>
                        {subnichoName}
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Oferta <span className="text-red-500">*</span></label>
                  <div className="flex gap-6 items-center bg-gray-50 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 h-[48px] shadow-sm">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="tipo_oferta" 
                        value="DR"
                        checked={formData.tipo_oferta ? formData.tipo_oferta.includes('DR') : false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            const atual = prev.tipo_oferta || [];
                            const nova = checked ? [...atual, 'DR'] : atual.filter(v => v !== 'DR');
                            return { ...prev, tipo_oferta: nova };
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      DR
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-200 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="tipo_oferta" 
                        value="1X1"
                        checked={formData.tipo_oferta ? formData.tipo_oferta.includes('1X1') : false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            const atual = prev.tipo_oferta || [];
                            const nova = checked ? [...atual, '1X1'] : atual.filter(v => v !== '1X1');
                            return { ...prev, tipo_oferta: nova };
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      1X1
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Idioma/Mercado <span className="text-red-500">*</span></label>
                  <select 
                    name="idioma_mercado" 
                    value={formData.idioma_mercado} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium cursor-pointer"
                  >
                    <option value="BR">BR</option>
                    <option value="Latam">Latam</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Francês">Francês</option>
                    <option value="Italiano">Italiano</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-4 pl-1 col-span-1 md:col-span-2">
                  <div className="flex items-center h-full">
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

                  <div className="flex items-center h-full">
                    <label className="relative flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="esta_escalada" 
                        checked={formData.esta_escalada} 
                        onChange={handleChange} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ml-3 text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        Oferta Escalada <span className="animate-pulse">🚀</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Estrutura do Funil & Entrega */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">2. Estrutura do Funil & Entrega</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Formato de Entrega <span className="text-red-500">*</span></label>
                  <select 
                    name="formato_entrega" 
                    value={formData.formato_entrega} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium cursor-pointer"
                  >
                    <option value="Vídeo">Vídeo</option>
                    <option value="PDF">PDF</option>
                    <option value="AppWeb">App Web</option>
                    <option value="Drive">Drive</option>
                    <option value="Comunidade WhatsApp">Comunidade WhatsApp</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Link do Site da Oferta / LP</label>
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
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Link da Biblioteca de Anúncios</label>
                  <input 
                    type="url" 
                    name="link_biblioteca_anuncios" 
                    value={formData.link_biblioteca_anuncios} 
                    onChange={handleChange} 
                    placeholder="https://www.facebook.com/ads/library/..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status do Funil <span className="text-red-500">*</span></label>
                  <select 
                    name="status_funil" 
                    value={formData.status_funil} 
                    onChange={handleChange} 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium"
                  >
                    <option value="Em análise">Em análise</option>
                    <option value="Para modelar">Para modelar</option>
                    <option value="Já testei">Já testei</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tags</label>
                  <input 
                    type="text" 
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleChange} 
                    placeholder="Ex: low-ticket, vsl, lancamento"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Precificação e Checkout */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">3. Precificação e Checkout</h3>
              <div className="space-y-6">
                {/* Preço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Preço Front <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="valor_front" 
                      value={formData.valor_front} 
                      onChange={handleChange} 
                      onBlur={handleValorFrontBlur}
                      required
                      placeholder="0,00"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Link do Checkout Principal</label>
                    <input 
                      type="url" 
                      name="link_checkout" 
                      value={formData.link_checkout} 
                      onChange={handleChange} 
                      placeholder="https://checkout.principal.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Configuração de Order Bumps */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">4. Configuração de Order Bumps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Qtd. Order Bumps</label>
                  <input 
                    type="number" 
                    name="qtd_order_bump" 
                    value={formData.qtd_order_bump} 
                    onChange={handleQtdBumpsChange} 
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Order Bumps sub-form */}
            {formData.qtd_order_bump > 0 && (
              <div className="pt-6 border-t border-gray-100 bg-gray-50/40 p-5 rounded-xl border border-gray-200/60 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuração dos Order Bumps</h4>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {formData.qtd_order_bump} {formData.qtd_order_bump === 1 ? 'Item' : 'Itens'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {orderBumps.map((bump, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 transition">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Nome do Bump #{index + 1} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text"
                          value={bump.nome}
                          onChange={(e) => handleBumpFieldChange(index, 'nome', e.target.value)}
                          placeholder="Ex: Planilha VIP"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Valor do Bump #{index + 1} (R$)
                        </label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={bump.valor}
                          onChange={(e) => handleBumpFieldChange(index, 'valor', e.target.value)}
                          onBlur={() => handleBumpValorBlur(index)}
                          placeholder="0,00"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Notas de Modelagem */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">5. Notas de Modelagem</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Notas de Modelagem</label>
                  <textarea 
                    name="notas_modelagem" 
                    value={formData.notas_modelagem} 
                    onChange={handleChange} 
                    rows="5"
                    placeholder="Escreva insights, observações e a estratégia por trás dessa oferta para modelagem futura..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm font-medium resize-y" 
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
