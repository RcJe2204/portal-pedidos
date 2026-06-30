'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, User, Layers } from 'lucide-react';

interface ItemPedido {
  codigo: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

interface Pedido {
  id: string;
  lojistaId: string;
  lojista: { nome: string };
  itens: string;
  total: number;
  status: string;
  plataforma: string | null;
  formaPagamento: string | null;
  observacao: string | null;
  pedidoBlingId: string | null;
  createdAt: string;
}

export default function DetalhesPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarPedido = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pedidos/${params.id}`);
        if (!res.ok) throw new Error('Pedido não encontrado');
        const data = await res.json();
        setPedido(data);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) carregarPedido();
  }, [params.id]);

  // Trata itens: pode vir como JSON string OU já como array
  const itens: ItemPedido[] = Array.isArray(pedido?.itens)
    ? pedido.itens
    : pedido?.itens
      ? JSON.parse(pedido.itens)
      : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Carregando detalhes do pedido...</div>
      </div>
    );
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <div className="text-red-500 font-semibold mb-4">{erro || 'Pedido não encontrado'}</div>
        <button onClick={() => router.push('/admin/pedidos')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Voltar para Pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <button
          onClick={() => router.push('/admin/pedidos')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Pedidos
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Pedido</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                {pedido.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Criado em {new Date(pedido.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            Itens do Pedido
          </h2>
          <div className="divide-y divide-gray-100">
            {itens.length > 0 ? (
              itens.map((item, index) => (
                <div key={index} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
                    <p className="text-xs text-gray-500">Código: {item.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantidade}x de R$ {item.precoUnitario.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4">Nenhum item encontrado para este pedido.</p>
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Valor Total do Pedido</span>
            <span className="text-lg font-bold text-indigo-600">R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Lojista */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-4 w-4" />
            Lojista
          </h2>
          <p className="text-sm font-semibold text-gray-900">{pedido.lojista?.nome}</p>
        </div>

        {/* Plataforma */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
          <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            Plataforma
          </h2>
          <p className="text-sm font-semibold text-gray-900">{pedido.plataforma || 'Sem plataforma'}</p>
        </div>

        {/* Observação */}
        {pedido.observacao && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Observação</h2>
            <p className="text-sm text-gray-700">{pedido.observacao}</p>
          </div>
        )}

      </div>
    </div>
  );
}