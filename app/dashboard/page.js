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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Meu Swipe File 🚀</h1>
          <div className="flex gap-4">
            <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 font-bold transition">
              + Nova Oferta
            </a>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="text-red-600 font-bold hover:underline px-4 py-2">
              Sair
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-600 text-lg">Verificando acesso e buscando dados...</p>
          </div>
        ) : ofertas.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Nenhuma oferta salva ainda. Volte e adicione a sua primeira!</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-200 border-b">
                <tr>
                  <th className="p-4 font-bold text-gray-700">Produto</th>
                  <th className="p-4 font-bold text-gray-700">Nicho</th>
                  <th className="p-4 font-bold text-gray-700">Funil</th>
                  <th className="p-4 font-bold text-gray-700">Front (R$)</th>
                  <th className="p-4 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((oferta) => (
                  <tr key={oferta.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{oferta.nome_produto}</td>
                    <td className="p-4 text-gray-600">
                      {oferta.nicho} {oferta.subnicho && `/ ${oferta.subnicho}`}
                    </td>
                    <td className="p-4 text-gray-600">{oferta.tipo_funil}</td>
                    <td className="p-4 text-gray-600">
                      {oferta.valor_front ? `R$ ${oferta.valor_front}` : '-'}
                    </td>
                    <td className="p-4">
                      {oferta.status_ativo ? (
                        <span className="text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full text-xs">Ativo</span>
                      ) : (
                        <span className="text-red-700 font-bold bg-red-100 px-3 py-1 rounded-full text-xs">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
