'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, CheckCircle2, Eye, 
  BrainCircuit, Loader2, RefreshCw, Search 
} from 'lucide-react';

// --- TIPAGENS ---
interface PedidoUpload {
  id: string;
  arquivoUrl: string;
  status: 'pendente' | 'processado' | 'aprovado';
  createdAt: string;
  lojista: {
    nome: string;
    cnpj: string;
  };
}

export default function AdminPedidosPdfPage() {
  const [uploads, setUploads] = useState<PedidoUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  // 1. BUSCA OS PEDIDOS ENVIADOS PELOS LOJISTAS
  const fetchUploads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pedidos-upload');
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      console.error('Erro ao carregar uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // 2. FILTRO DE BUSCA
  const uploadsFiltrados = uploads.filter(u => 
    u.lojista.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.lojista.cnpj.includes(filtro)
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* CABEÇALHO LIMPO */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pedidos via PDF</h1>
          <p className="text-slate-500 text-sm">Gerencie os arquivos enviados pelos lojistas</p>
        </div>
        <button 
          onClick={fetchUploads}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar Lista
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por lojista ou CNPJ..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* TABELA DE PEDIDOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
            <p className="font-medium">Sincronizando pedidos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Lojista</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data de Envio</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {uploadsFiltrados.map((upload) => (
                  <tr key={upload.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{upload.lojista.nome}</div>
                      <div className="text-xs font-mono text-slate-400">{upload.lojista.cnpj}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                      {new Date(upload.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        upload.status === 'pendente' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        upload.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {upload.status === 'pendente' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        <a 
                          href={upload.arquivoUrl} 
                          target="_blank" 
                          className="p-2.5 bg-gray-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Visualizar PDF"
                        >
                          <Eye size={20} />
                        </a>
                        <button 
                          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                        >
                          <BrainCircuit size={16} />
                          Processar IA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {uploadsFiltrados.length === 0 && !loading && (
          <div className="p-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-medium">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}