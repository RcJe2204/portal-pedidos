'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  descricao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
}

interface AdminProdutosState {
  produtos: Produto[];
  categorias: Categoria[];
}

const STORAGE_KEY = 'admin-produtos-state';
const SYNC_EVENT = 'admin-produtos-sync';

const STORAGE_VERSION = '1.0.0';

const categoriasIniciais: Categoria[] = [
  { id: 'cat-1', nome: 'Eletrônicos', descricao: 'Produtos eletrônicos em geral', cor: '#3b82f6' },
  { id: 'cat-2', nome: 'Acessórios', descricao: 'Acessórios e complementos', cor: '#10b981' },
  { id: 'cat-3', nome: 'Casa e Decoração', descricao: 'Itens para casa e decoração', cor: '#f59e0b' },
  { id: 'cat-4', nome: 'Vestuário', descricao: 'Roupas e vestuário', cor: '#ef4444' },
];

const produtosIniciais: Produto[] = [
  {
    id: 'prod-1',
    nome: 'Smartphone Galaxy X',
    categoria: 'Eletrônicos',
    preco: 2499.9,
    estoque: 15,
    descricao: 'Smartphone de última geração com tela AMOLED',
    ativo: true,
    criadoEm: new Date(Date.now() - 86400000 * 5).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'prod-2',
    nome: 'Fone Bluetooth Pro',
    categoria: 'Acessórios',
    preco: 399.0,
    estoque: 32,
    descricao: 'Fone sem fio com cancelamento de ruído',
    ativo: true,
    criadoEm: new Date(Date.now() - 86400000 * 3).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-3',
    nome: 'Luminária LED Moderna',
    categoria: 'Casa e Decoração',
    preco: 159.5,
    estoque: 8,
    descricao: 'Luminária de mesa com iluminação ajustável',
    ativo: false,
    criadoEm: new Date(Date.now() - 86400000 * 10).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'prod-4',
    nome: 'Camiseta Algodão Premium',
    categoria: 'Vestuário',
    preco: 89.9,
    estoque: 50,
    descricao: 'Camiseta 100% algodão com corte premium',
    ativo: true,
    criadoEm: new Date(Date.now() - 86400000 * 7).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

function carregarEstado(): AdminProdutosState {
  if (typeof window === 'undefined') {
    return { produtos: produtosIniciais, categorias: categoriasIniciais };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const estadoInicial: AdminProdutosState = {
        produtos: produtosIniciais,
        categorias: categoriasIniciais,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoInicial));
      return estadoInicial;
    }
    const parsed = JSON.parse(raw) as AdminProdutosState;
    if (!parsed.produtos || !parsed.categorias) {
      return { produtos: produtosIniciais, categorias: categoriasIniciais };
    }
    return parsed;
  } catch (err) {
    console.error('Erro ao carregar estado do localStorage:', err);
    return { produtos: produtosIniciais, categorias: categoriasIniciais };
  }
}

function salvarEstado(estado: AdminProdutosState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: estado }));
  } catch (err) {
    console.error('Erro ao salvar estado no localStorage:', err);
  }
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export default function AdminProdutosPage() {
  const [estado, setEstado] = useState<AdminProdutosState>({
    produtos: [],
    categorias: [],
  });
  const [carregado, setCarregado] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');

  const [formProduto, setFormProduto] = useState<Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>>({
    nome: '',
    categoria: '',
    preco: 0,
    estoque: 0,
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    const estadoInicial = carregarEstado();
    setEstado(estadoInicial);
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    salvarEstado(estado);
  }, [estado, carregado]);

  useEffect(() => {
    function handleSync(event: Event) {
      const customEvent = event as CustomEvent<AdminProdutosState>;
      if (customEvent.detail) {
        setEstado(customEvent.detail);
      }
    }
    window.addEventListener(SYNC_EVENT, handleSync as EventListener);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as AdminProdutosState;
          setEstado(parsed);
        } catch (err) {
          console.error('Erro ao sincronizar via storage event:', err);
        }
      }
    });
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync as EventListener);
    };
  }, []);

  const produtosFiltrados = useMemo(() => {
    return estado.produtos.filter((p) => {
      const matchBusca =
        busca.trim() === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria =
        filtroCategoria === 'todas' || p.categoria === filtroCategoria;
      return matchBusca && matchCategoria;
    });
  }, [estado.produtos, busca, filtroCategoria]);

  const totalProdutos = estado.produtos.length;
  const produtosAtivos = estado.produtos.filter((p) => p.ativo).length;
  const valorEstoque = estado.produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0);
  const totalCategorias = estado.categorias.length;

  const abrirModalNovo = useCallback(() => {
    setProdutoEditando(null);
    setFormProduto({
      nome: '',
      categoria: estado.categorias[0]?.nome ?? '',
      preco: 0,
      estoque: 0,
      descricao: '',
      ativo: true,
    });
    setModalAberto(true);
  }, [estado.categorias]);

  const abrirModalEditar = useCallback((produto: Produto) => {
    setProdutoEditando(produto);
    setFormProduto({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      estoque: produto.estoque,
      descricao: produto.descricao,
      ativo: produto.ativo,
    });
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setProdutoEditando(null);
  }, []);

  const salvarProduto = useCallback(() => {
    if (!formProduto.nome.trim()) {
      alert('O nome do produto é obrigatório.');
      return;
    }
    if (formProduto.preco < 0 || formProduto.estoque < 0) {
      alert('Preço e estoque não podem ser negativos.');
      return;
    }
    const agora = new Date().toISOString();
    if (produtoEditando) {
      setEstado((prev) => ({
        ...prev,
        produtos: prev.produtos.map((p) =>
          p.id === produtoEditando.id
            ? { ...p, ...formProduto, atualizadoEm: agora }
            : p
        ),
      }));
    } else {
      const novoProduto: Produto = {
        id: gerarId('prod'),
        ...formProduto,
        criadoEm: agora,
        atualizadoEm: agora,
      };
      setEstado((prev) => ({
        ...prev,
        produtos: [novoProduto, ...prev.produtos],
      }));
    }
    fecharModal();
  }, [formProduto, produtoEditando, fecharModal]);

  const excluirProduto = useCallback((id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setEstado((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((p) => p.id !== id),
    }));
  }, []);

  const toggleAtivo = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) =>
        p.id === id
          ? { ...p, ativo: !p.ativo, atualizadoEm: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const obterCorCategoria = (nome: string): string => {
    const cat = estado.categorias.find((c) => c.nome === nome);
    return cat?.cor ?? '#6b7280';
  };

  if (!carregado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administração de Produtos</h1>
          <p className="text-gray-500 mt-1">
            Gerencie produtos e categorias da loja. Versão {STORAGE_VERSION}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 font-medium">Total de Produtos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalProdutos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 font-medium">Produtos Ativos</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{produtosAtivos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 font-medium">Valor em Estoque</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatarMoeda(valorEstoque)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500 font-medium">Categorias</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totalCategorias}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="text-sm text-gray-500 font-medium">Buscar Produtos</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou descrição..."
              className="w-full mt-1 text-2xl font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="text-sm text-gray-500 font-medium">Filtrar por Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full mt-1 text-2xl font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
            >
              <option value="todas">Todas as categorias</option>
              {estado.categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="text-sm text-gray-500 font-medium">Categorias</label>
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              className="w-full mt-1 text-2xl font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
            >
              <option value="todas">Todas as categorias</option>
              {estado.categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Produtos</h2>
              <p className="text-sm text-gray-500 mt-1">
                {produtosFiltrados.length} de {totalProdutos} produtos
              </p>
            </div>
            <button
              onClick={abrirModalNovo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Novo Produto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Atualizado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {produtosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                          style={{ backgroundColor: obterCorCategoria(produto.categoria) }}
                        >
                          {produto.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{produto.nome}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{produto.descricao}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${obterCorCategoria(produto.categoria)}20`,
                          color: obterCorCategoria(produto.categoria),
                        }}
                      >
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatarMoeda(produto.preco)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          produto.estoque > 10
                            ? 'text-gray-900'
                            : produto.estoque > 0
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {produto.estoque}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAtivo(produto.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          produto.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatarData(produto.atualizadoEm)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(produto)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirProduto(produto.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formProduto.nome}
                    onChange={(e) => setFormProduto((f) => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formProduto.categoria}
                    onChange={(e) => setFormProduto((f) => ({ ...f, categoria: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {estado.categorias.map((cat) => (
                      <option key={cat.id} value={cat.nome}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formProduto.preco}
                      onChange={(e) =>
                        setFormProduto((f) => ({ ...f, preco: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formProduto.estoque}
                      onChange={(e) =>
                        setFormProduto((f) => ({ ...f, estoque: parseInt(e.target.value, 10) || 0 }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formProduto.descricao}
                    onChange={(e) => setFormProduto((f) => ({ ...f, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formProduto.ativo}
                    onChange={(e) => setFormProduto((f) => ({ ...f, ativo: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                    Produto ativo
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={fecharModal}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarProduto}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {produtoEditando ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}