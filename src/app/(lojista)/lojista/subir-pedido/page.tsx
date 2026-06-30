'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Upload, Package, ShoppingCart, 
  Plus, Minus, Search, Loader2, ArrowLeft, FileText, X 
} from 'lucide-react';

interface ProdutoCatalogo {
  sku: string;
  nome: string;
  categoria: string;
  precoLojista: number;
}

interface ItemPedido {
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  precoUnitario: number;
}

export default function PaginaSubirPedidoLojista() {
  const router = useRouter();

  const [montado, setMontado] = useState(false);
  const [lojistaId, setLojistaId] = useState<string | null>(null);
  const [lojistaNome, setLojistaNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  const [aba, setAba] = useState<"manual" | "importar">("manual");
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [skuDigitado, setSkuDigitado] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [enviando, setEnviando] = useState(false);

  // Estado do PDF
  const [pdfArquivo, setPdfArquivo] = useState<File | null>(null);
  const [pdfProcessando, setPdfProcessando] = useState(false);
  const [pdfItensExtraidos, setPdfItensExtraidos] = useState<any[]>([]);

  useEffect(() => {
    setMontado(true);
    const authData = localStorage.getItem('portal_auth');
    if (!authData) {
      router.replace('/login');
      return;
    }
    try {
      const { id, nome } = JSON.parse(authData);
      setLojistaId(id);
      setLojistaNome(nome || '');
    } catch (e) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!montado || !lojistaId) return;

    async function carregarDados() {
      try {
        setCarregando(true);

        // 1. Busca produtos da API (A API já filtra por lojistaId e Lista de Preços no Banco)
        const resProd = await fetch(`/api/produtos?lojistaId=${lojistaId}`);
        const dadosProd = await resProd.json();
        
        // 2. Mapeia os dados garantindo que a vitrine entenda os campos da API
        const listaFinal = Array.isArray(dadosProd) ? dadosProd.map((p: any) => ({
          sku: p.sku || p.codigo,
          nome: p.nome,
          categoria: p.categoria || 'Sem Categoria',
          precoLojista: p.precoLojista || p.preco || 0
        })) : [];

        setCatalogo(listaFinal);

        // 3. Define categorias disponíveis baseadas no que a API retornou
        const cats = Array.from(new Set(listaFinal.map((p: any) => p.categoria))).filter(Boolean) as string[];
        setCategoriasDisponiveis(cats.sort());

      } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [lojistaId, montado]);

  const produtosFiltrados = useMemo(() => {
    return catalogo.filter(p => {
      const bateCategoria = !categoriaSelecionada || p.categoria === categoriaSelecionada;
      const bateBusca = !skuDigitado || 
        p.sku?.toLowerCase().includes(skuDigitado.toLowerCase()) || 
        p.nome?.toLowerCase().includes(skuDigitado.toLowerCase());
      return bateCategoria && bateBusca;
    });
  }, [catalogo, categoriaSelecionada, skuDigitado]);

  function obterPreco(produto: ProdutoCatalogo): number {
    return produto.precoLojista;
  }

  function adicionarItem(produto: ProdutoCatalogo) {
    const preco = obterPreco(produto);
    setItens((prev) => {
      const existente = prev.find((i) => i.sku === produto.sku);
      if (existente) {
        return prev.map((i) =>
          i.sku === produto.sku ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1, precoUnitario: preco }];
    });
  }

  function alterarQuantidade(sku: string, delta: number) {
    setItens(prev =>
      prev
        .map(i =>
          i.sku === sku
            ? { ...i, quantidade: Math.max(0, i.quantidade + delta) }
            : i
        )
        .filter(i => i.quantidade > 0)
    );
  }

  function adicionarItensExtraidos() {
    for (const item of pdfItensExtraidos) {
      const produto = catalogo.find(p => p.sku === item.sku);
      if (produto) {
        const preco = obterPreco(produto);
        setItens((prev) => {
          const existente = prev.find((i) => i.sku === produto.sku);
          if (existente) {
            return prev.map((i) =>
              i.sku === produto.sku
                ? { ...i, quantidade: i.quantidade + (item.quantidade || 1) }
                : i
            );
          }
          return [...prev, { ...produto, quantidade: item.quantidade || 1, precoUnitario: preco }];
        });
      }
    }
    setPdfArquivo(null);
    setPdfItensExtraidos([]);
  }

  async function processarPDF(file: File) {
    if (!lojistaId) {
      alert('Erro: ID do lojista não encontrado. Faça login novamente.');
      return;
    }

    setPdfProcessando(true);
    setPdfArquivo(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lojistaId', lojistaId);

      const res = await fetch('/api/pedidos/importar-pdf', {
        method: 'POST',
        body: formData,
      });

      const errorBody = await res.text();

      if (!res.ok) {
        throw new Error('Erro ao processar PDF: ' + errorBody);
      }

      const dados = JSON.parse(errorBody);
      const itensExtraidos = dados.itens || [];

      const itensValidos = itensExtraidos
        .filter((item: any) => catalogo.find(p => p.sku === item.sku))
        .map((item: any) => ({
          sku: item.sku,
          nome: catalogo.find(p => p.sku === item.sku)?.nome || item.sku,
          quantidade: item.quantidade || 1,
        }));

      setPdfItensExtraidos(itensValidos);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      alert('Erro ao processar o PDF. Verifique se o arquivo é válido.');
      setPdfArquivo(null);
    } finally {
      setPdfProcessando(false);
    }
  }

  function removerPDF() {
    setPdfArquivo(null);
    setPdfItensExtraidos([]);
  }

  async function enviarPedido() {
    if (itens.length === 0 || !lojistaId) return;

    setEnviando(true);
    try {
      const res = await fetch('/api/pedidos/criar-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojistaId,
          itens: itens.map(i => ({
            codigo: i.sku,
            nome: i.nome,
            quantidade: i.quantidade,
            preco: i.precoUnitario,
          })),
          observacao: '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao enviar pedido');
        return;
      }

      alert('✅ Pedido enviado com sucesso!');
      setItens([]);
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('Erro de conexão ao enviar pedido');
    } finally {
      setEnviando(false);
    }
  }

  const totalPedido = itens.reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitario,
    0
  );

  if (!montado || carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-2">
        <Link
          href="/lojista/dashboard"
          className="flex items-center gap-3 p-3 mb-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar ao Dashboard</span>
        </Link>
        <button
          onClick={() => setAba("manual")}
          className={`flex items-center gap-3 p-3 rounded-xl transition ${
            aba === 'manual'
              ? 'bg-blue-600 shadow-lg'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Plus size={20} /> Digitação Manual
        </button>
        <button
          onClick={() => setAba("importar")}
          className={`flex items-center gap-3 p-3 rounded-xl transition ${
            aba === 'importar'
              ? 'bg-blue-600 shadow-lg'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Upload size={20} /> Importar PDF
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {aba === 'manual' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      className="w-full border border-gray-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={skuDigitado}
                      onChange={(e) => setSkuDigitado(e.target.value)}
                    />
                  </div>
                  <select
                    className="border border-gray-200 p-3 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  >
                    <option value="">Todas as Pastas</option>
                    {categoriasDisponiveis.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {aba === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {produtosFiltrados.length === 0 ? (
                  <div className="col-span-2 py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <Package className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-500">Nenhum produto nesta pasta.</p>
                  </div>
                ) : (
                  produtosFiltrados.map((prod) => {
                    const preco = obterPreco(prod);
                    return (
                      <div key={prod.sku} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">{prod.categoria}</span>
                          <span className="text-xs text-gray-400 font-mono">{prod.sku}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 leading-tight mb-4 group-hover:text-blue-600 transition">{prod.nome}</h3>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                          <span className="text-slate-900 font-black text-xl">R$ {preco.toFixed(2)}</span>
                          <button onClick={() => adicionarItem(prod)} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-blue-600 transition shadow-lg"><Plus size={20} /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {aba === 'importar' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Importar Pedido via PDF</h2>
                  <p className="text-gray-500 text-sm mb-6">Selecione um arquivo PDF com a lista de itens do pedido para importar automaticamente.</p>

                  {!pdfArquivo ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                      <Upload size={40} className="text-gray-300 mb-4" />
                      <span className="font-medium text-gray-600">Clique para selecionar o PDF</span>
                      <span className="text-xs text-gray-400 mt-1">ou arraste o arquivo aqui</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) processarPDF(file); }} />
                    </label>
                  ) : (
                    <div className="border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-blue-600" />
                          <div>
                            <p className="font-medium text-slate-800">{pdfArquivo.name}</p>
                            <p className="text-xs text-gray-400">{(pdfArquivo.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={removerPDF} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} className="text-gray-400" /></button>
                      </div>

                      {pdfProcessando ? (
                        <div className="flex items-center justify-center gap-3 py-8">
                          <Loader2 size={20} className="animate-spin text-blue-600" />
                          <span className="text-gray-500">Processando PDF...</span>
                        </div>
                      ) : pdfItensExtraidos.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-green-600">{pdfItensExtraidos.length} itens encontrados:</p>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {pdfItensExtraidos.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-800">{item.nome}</span>
                                  <span className="text-xs text-blue-600 font-mono mt-0.5">SKU: {item.sku}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">Qtd: {item.quantidade}</span>
                              </div>
                            ))}
                          </div>
                          <button onClick={adicionarItensExtraidos} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition mt-4">
                            Adicionar {pdfItensExtraidos.length} itens ao pedido
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-400">Nenhum item reconhecido no PDF.</p>
                          <p className="text-xs text-gray-300 mt-1">Verifique se os SKUs no PDF correspondem aos produtos do catálogo.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit sticky top-8">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6"><ShoppingCart size={22} className="text-blue-600" /> Seu Pedido</h2>
            <div className="space-y-4 mb-8 max-h-[450px] overflow-y-auto pr-2">
              {itens.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Nenhum item adicionado ainda.</p>}
              {itens.map((item) => (
                <div key={item.sku} className="border-b border-gray-50 pb-4">
                  <p className="text-sm font-bold text-slate-800 truncate mb-2">{item.nome}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg">
                      <button onClick={() => alterarQuantidade(item.sku, -1)} className="p-1 hover:bg-white rounded-md transition"><Minus size={14} /></button>
                      <span className="text-sm font-black w-4 text-center">{item.quantidade}</span>
                      <button onClick={() => alterarQuantidade(item.sku, 1)} className="p-1 hover:bg-white rounded-md transition"><Plus size={14} /></button>
                    </div>
                    <span className="text-sm font-bold text-slate-900">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-end mb-6">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="text-3xl font-black text-blue-600">R$ {totalPedido.toFixed(2)}</span>
              </div>
              <button onClick={enviarPedido} disabled={itens.length === 0 || enviando} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">
                {enviando ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}