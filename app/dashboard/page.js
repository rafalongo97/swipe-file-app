'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [ofertas, setOfertas] = useState([]);
  const [carregando, setCarregando] = useState(true);

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

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const parts = dataStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dataStr;
  };

  const formatarPreco = (valor) => {
    if (valor === null || valor === undefined || valor === "") return '-';
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Produto & Data</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Nicho</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Funil / Entrega</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Precificação (R$)</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Order Bumps</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs">Links</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs text-center">Status</th>
                    <th className="p-4 font-bold text-gray-700 uppercase tracking-wider text-xs text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ofertas.map((oferta) => (
                    <tr key={oferta.id} className="hover:bg-gray-50/70 transition">
                      {/* Produto & Data */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{oferta.nome_produto}</div>
                        <div className="text-gray-400 text-xs mt-0.5">Anúncio: {formatarData(oferta.data_primeiro_anuncio)}</div>
                      </td>

                      {/* Nicho / Subnicho */}
                      <td className="p-4">
                        <div className="text-gray-900 font-bold">{oferta.nicho}</div>
                        {oferta.subnicho && (
                          <div className="text-gray-400 text-xs mt-0.5">{oferta.subnicho}</div>
                        )}
                      </td>

                      {/* Funil & Entrega */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                            oferta.tipo_funil === 'DR' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {oferta.tipo_funil === 'DR' ? 'Direct Response (DR)' : 'Um a Um (X1)'}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border bg-gray-50 text-gray-600 border-gray-100">
                            Entrega: {oferta.formato_entrega}
                          </span>
                        </div>
                      </td>

                      {/* Precificação */}
                      <td className="p-4">
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-900">Front:</span> {formatarPreco(oferta.valor_front)}
                        </div>
                        {oferta.valor_desconto && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-900">Desc:</span> {formatarPreco(oferta.valor_desconto)}
                          </div>
                        )}
                        {oferta.valor_upsell_maior && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-900">Upsell:</span> {formatarPreco(oferta.valor_upsell_maior)}
                          </div>
                        )}
                      </td>

                      {/* Order Bumps */}
                      <td className="p-4">
                        <div className="text-xs font-bold text-gray-900">Qtd: {oferta.qtd_order_bump || 0}</div>
                        {oferta.nomes_order_bumps && (
                          <div className="text-gray-400 text-xs max-w-[150px] truncate mt-0.5" title={oferta.nomes_order_bumps}>
                            {oferta.nomes_order_bumps}
                          </div>
                        )}
                      </td>

                      {/* Links */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          {oferta.link_site ? (
                            <a 
                              href={oferta.link_site} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 underline font-semibold transition"
                            >
                              Site da Oferta ↗
                            </a>
                          ) : (
                            <span className="text-gray-400">Sem site</span>
                          )}
                          {oferta.link_checkout ? (
                            <a 
                              href={oferta.link_checkout} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 underline font-semibold transition"
                            >
                              Checkout ↗
                            </a>
                          ) : (
                            <span className="text-gray-400">Sem checkout</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {oferta.status_ativo ? (
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
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-center">
                        <a 
                          href={`/?edit=${oferta.id}`} 
                          className="inline-flex items-center justify-center bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-bold px-3.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 transition text-xs cursor-pointer shadow-sm"
                        >
                          Editar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


