'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Package,
  Plus,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';

interface Preco {
  id: number;
  categoria: string;
  preco: number;
}

interface CategoriaItem {
  id: number;
  nome: string;
}

export default function LojistaPrecosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: nomeLojista } = use(params);
  const router = useRouter();

  const [precos, setPrecos] = useState<Record<string, number>>({});
  const [editando, setEditando] = useState<Record<string, boolean>>({});
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{
    categoria: string;
    tipo: 'ok' | 'erro';
  } | null>(null);

  const [modalCategoria, setModalCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [todasCategorias, setTodasCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [adicionandoCategoria, setAdicionandoCategoria] = useState(false);

  const nomeDecodificado = decodeURIComponent(nomeLojista);

  const carregarPrecos = () => {
    fetch(`/api/lojista/precos?nome=${encodeURIComponent(nomeDecodificado)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar preços');
        return res.json();
      })
      .then((data: Preco[]) => {
        const mapa: Record<string, number> = {};
        const editMap: Record<string, string> = {};

        for (const p of data) {
          mapa[p.categoria] = p.preco;
          editMap[p.categoria] = p.preco.toFixed(2);
        }

        setPrecos(mapa);
        setValoresEditados(editMap);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth');

    if (!auth || JSON.parse(auth).tipo !== 'admin') {
      router.push('/admin/login');
      return;
    }

    carregarPrecos();
  }, [router, nomeLojista]);

  const iniciarEdicao = (categoria: string) => {
    setEditando((prev) => ({ ...prev, [categoria]: true }));
    setFeedback(null);
  };

  const handleChange = (categoria: string, valor: string) => {
    const sanitized = valor.replace(/[^0-9,.]/g, '');
    setValoresEditados((prev) => ({ ...prev, [categoria]: sanitized }));
  };

  const salvarPreco = async (categoria: string) => {
    const valorStr = (valoresEditados[categoria] || '0').replace(',', '.');
    const preco = parseFloat(valorStr);

    if (isNaN(preco) || preco < 0) {
      setFeedback({ categoria, tipo: 'erro' });
      return;
    }

    setSalvando(categoria);
    setFeedback(null);

    try {
      const res = await fetch(
        `/api/lojista/precos?nome=${encodeURIComponent(nomeDecodificado)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoria, preco }),
        }
      );

      if (!res.ok) throw new Error('Erro ao salvar');

      setPrecos((prev) => ({ ...prev, [categoria]: preco }));
      setEditando((prev) => ({ ...prev, [categoria]: false }));
      setFeedback({ categoria, tipo: 'ok' });
    } catch {
      setFeedback({ categoria, tipo: 'erro' });
    } finally {
      setSalvando(null);
    }
  };

  const cancelarEdicao = (categoria: string) => {
    setEditando((prev) => ({ ...prev, [categoria]: false }));
    setValoresEditados((prev) => ({
      ...prev,
      [categoria]:
        precos[categoria] !== undefined ? precos[categoria].toFixed(2) : '0.00',
    }));
    setFeedback(null);
  };

  const excluirCategoria = async (categoria: string) => {
    const confirmar = window.confirm(
      `Deseja excluir a categoria "${categoria}" deste lojista?`
    );

    if (!confirmar) return;

    setSalvando(categoria);

    try {
      const res = await fetch(
        `/api/lojista/precos?nome=${encodeURIComponent(
          nomeDecodificado
        )}&categoria=${encodeURIComponent(categoria)}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) throw new Error('Erro ao excluir categoria');

      const novoMapa = { ...precos };
      delete novoMapa[categoria];
      setPrecos(novoMapa);

      const novoEditMap = { ...valoresEditados };
      delete novoEditMap[categoria];
      setValoresEditados(novoEditMap);
    } catch {
      alert('Erro ao excluir categoria');
    } finally {
      setSalvando(null);
    }
  };

  const abrirModalAdicionarCategoria = async () => {
    try {
      const res = await fetch('/api/categoria');

      if (!res.ok) throw new Error('Erro ao carregar categorias');

      const data: CategoriaItem[] = await res.json();
      const categoriasDoLojista = new Set(Object.keys(precos));

      const disponiveis = data
        .map((item) => item.nome)
        .filter((nome) => !categoriasDoLojista.has(nome))
        .sort((a, b) => a.localeCompare(b));

      setTodasCategorias(disponiveis);
      setCategoriaSelecionada(disponiveis[0] || '');
      setModalAdicionar(true);
    } catch {
      alert('Erro ao carregar categorias');
    }
  };

  const adicionarCategoriaExistente = async () => {
    if (!categoriaSelecionada) return;

    setAdicionandoCategoria(true);

    try {
      const res = await fetch(
        `/api/lojista/precos?nome=${encodeURIComponent(nomeDecodificado)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoria: categoriaSelecionada }),
        }
      );

      if (!res.ok) throw new Error('Erro ao adicionar categoria');

      setModalAdicionar(false);
      setCategoriaSelecionada('');
      carregarPrecos();
    } catch {
      alert('Erro ao adicionar categoria');
    } finally {
      setAdicionandoCategoria(false);
    }
  };

  const criarCategoria = async () => {
    const nome = novaCategoria.trim().toUpperCase();

    if (!nome) return;

    setCriandoCategoria(true);

    try {
      const res = await fetch('/api/categoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error('Erro ao criar categoria');

      setModalCategoria(false);
      setNovaCategoria('');
      carregarPrecos();
    } catch {
      alert('Erro ao criar categoria. Talvez ela já exista.');
    } finally {
      setCriandoCategoria(false);
    }
  };

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const categorias = Object.keys(precos).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Carregando preços...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar
          </h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError('');
              carregarPrecos();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <a
          href="/admin/lojistas"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Lojistas
        </a>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {nomeDecodificado}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {categorias.length} categorias — clique no preço para editar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={abrirModalAdicionarCategoria}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              Adicionar categoria
            </button>

            <button
              onClick={() => setModalCategoria(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nova categoria
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {categorias.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                Este lojista ainda não possui categorias.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                      Preço
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase w-32">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {categorias.map((categoria) => {
                    const precoAtual = precos[categoria] ?? 0;
                    const editandoEsta = editando[categoria];
                    const salvandoEsta = salvando === categoria;
                    const fb =
                      feedback?.categoria === categoria ? feedback.tipo : null;

                    return (
                      <tr
                        key={categoria}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {categoria}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {editandoEsta ? (
                            <div className="relative inline-flex items-center">
                              <span className="absolute left-3 text-sm text-gray-400">
                                R$
                              </span>
                              <input
                                type="text"
                                value={valoresEditados[categoria] || '0.00'}
                                onChange={(e) =>
                                  handleChange(categoria, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') salvarPreco(categoria);
                                  if (e.key === 'Escape')
                                    cancelarEdicao(categoria);
                                }}
                                autoFocus
                                className="w-32 pl-9 pr-3 py-1.5 text-right text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
                              />
                            </div>
                          ) : (
                            <span
                              onClick={() => iniciarEdicao(categoria)}
                              className={`text-sm font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                                precoAtual === 0
                                  ? 'text-red-400 bg-red-50 hover:bg-red-100'
                                  : 'text-indigo-600 hover:bg-indigo-50'
                              }`}
                              title="Clique para editar"
                            >
                              {precoAtual === 0 ? 'R$ 0,00' : fmt(precoAtual)}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {editandoEsta ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => salvarPreco(categoria)}
                                disabled={salvandoEsta}
                                className={`p-1.5 rounded-lg transition-all ${
                                  salvandoEsta
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title="Salvar"
                              >
                                <Save className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => cancelarEdicao(categoria)}
                                disabled={salvandoEsta}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              {fb === 'ok' && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Salvo
                                </span>
                              )}

                              <button
                                onClick={() => excluirCategoria(categoria)}
                                disabled={salvandoEsta}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all"
                                title="Excluir categoria"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalCategoria && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Nova categoria
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Essa categoria será criada no sistema e vinculada aos lojistas.
            </p>

            <input
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value.toUpperCase())}
              placeholder="Digite o nome da categoria"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setModalCategoria(false);
                  setNovaCategoria('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>

              <button
                onClick={criarCategoria}
                disabled={criandoCategoria}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {criandoCategoria ? 'Criando...' : 'Criar categoria'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAdicionar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Adicionar categoria
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Escolha uma categoria existente para vincular a este lojista.
            </p>

            {todasCategorias.length === 0 ? (
              <p className="text-sm text-gray-500">
                Não há categorias disponíveis para adicionar.
              </p>
            ) : (
              <select
                value={categoriaSelecionada}
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {todasCategorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setModalAdicionar(false);
                  setCategoriaSelecionada('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>

              {todasCategorias.length > 0 && (
                <button
                  onClick={adicionarCategoriaExistente}
                  disabled={adicionandoCategoria}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adicionandoCategoria ? 'Adicionando...' : 'Adicionar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}