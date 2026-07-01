'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [formData, setFormData] = useState({
    nome_produto: '', status_ativo: true, nicho: '', subnicho: '', data_primeiro_anuncio: '', tipo_funil: 'DR', link_site: '', link_checkout: '', valor_front: '', valor_upsell_maior: '', valor_desconto: '', qtd_order_bump: 0, nomes_order_bumps: '', formato_entrega: 'Vídeo'
  });
  const [mensagem, setMensagem] = useState('');

  // Verifica se o usuário está logado assim que a página abre
  useEffect(() => {
    async function verificarAcesso() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login'; // Expulsa para o login se não tiver sessão
      } else {
        setCarregandoAuth(false);
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
    setMensagem('Salvando...');

    const { error } = await supabase.from('ofertas_swipe_file').insert([formData]);

    if (error) {
      console.error(error);
      setMensagem('Erro ao salvar.');
    } else {
      setMensagem('Oferta salva com sucesso no Swipe File!');
      setFormData({
        nome_produto: '', status_ativo: true, nicho: '', subnicho: '', data_primeiro_anuncio: '', tipo_funil: 'DR', link_site: '', link_checkout: '', valor_front: '', valor_upsell_maior: '', valor_desconto: '', qtd_order_bump: 0, nomes_order_bumps: '', formato_entrega: 'Vídeo'
      });
    }
  };

  // Mostra uma tela branca rápida enquanto verifica o cadeado
  if (carregandoAuth) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Adicionar ao Swipe File 📁</h1>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="text-sm text-red-600 font-bold hover:underline">
            Sair
          </button>
        </div>
        
        {mensagem && (
          <div className={`mb-4 p-3 rounded ${mensagem.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {mensagem}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
            <input type="text" name="nome_produto" value={formData.nome_produto} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nicho</label>
            <input type="text" name="nicho" value={formData.nicho} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subnicho</label>
            <input type="text" name="subnicho" value={formData.subnicho} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div className="flex items-center mt-6">
            <input type="checkbox" name="status_ativo" checked={formData.status_ativo} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
            <label className="ml-2 block text-sm text-gray-900">Anúncio está Ativo?</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data do Primeiro Anúncio</label>
            <input type="date" name="data_primeiro_anuncio" value={formData.data_primeiro_anuncio} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Link do Site</label>
            <input type="url" name="link_site" value={formData.link_site} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Link do Checkout</label>
            <input type="url" name="link_checkout" value={formData.link_checkout} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Front (R$)</label>
            <input type="number" step="0.01" name="valor_front" value={formData.valor_front} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Produto Maior (R$)</label>
            <input type="number" step="0.01" name="valor_upsell_maior" value={formData.valor_upsell_maior} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Desconto (R$)</label>
            <input type="number" step="0.01" name="valor_desconto" value={formData.valor_desconto} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Qtd. Order Bumps</label>
            <input type="number" name="qtd_order_bump" value={formData.qtd_order_bump} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nomes dos Order Bumps</label>
            <input type="text" placeholder="Ex: Planilha VIP, Grupo Secreto" name="nomes_order_bumps" value={formData.nomes_order_bumps} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Funil</label>
            <select name="tipo_funil" value={formData.tipo_funil} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
              <option value="DR">Direct Response (DR)</option>
              <option value="X1">Um a Um (X1)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Formato de Entrega</label>
            <select name="formato_entrega" value={formData.formato_entrega} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
              <option value="Vídeo">Vídeo</option>
              <option value="PDF">PDF</option>
              <option value="AppWeb">App Web</option>
            </select>
          </div>

          <div className="col-span-2 mt-4 flex gap-4">
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300">
              Salvar Oferta
            </button>
            <a href="/dashboard" className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-900 transition duration-300 text-center flex items-center justify-center">
              Ver Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
