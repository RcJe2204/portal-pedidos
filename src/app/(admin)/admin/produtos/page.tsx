import React, { useState, useEffect, useMemo, useCallback } from 'react';

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  estoque: number;
  categoria: string;
  ativo: boolean;
  sincronizado: boolean;
  origem: 'bling' | 'customizado';
  atualizadoEm: string;
}

export interface FiltrosProdutos {
  busca: string;
  categoria: string;
  origem: 'todos' | 'bling' | 'customizado';
  apenasAtivos: boolean;
}

export interface Paginacao {
  pagina: number;
  porPagina: number;
  total: number;
}

const STORAGE_KEY = 'admin_produtos_customizados';
const ITENS_POR_PAGINA = 10;

const filtrosIniciais: FiltrosProdutos = {
  busca: '',
  categoria: '',
  origem: 'todos',
  apenasAtivos: false,
};

const carregarProdutosCustomizados = (): Produto[] => {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (!dados) return [];
    const parsed = JSON.parse(dados);
    return Array.isArray(parsed) ? parsed : [];
  } catch (erro) {
    console.error('Erro ao carregar produtos customizados do storage:', erro);
    return [];
  }
};

const salvarProdutosCustomizados = (produtos: Produto[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
  } catch (erro) {
    console.error('Erro ao salvar produtos customizados no storage:', erro);
  }
};

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

const formatarData = (data: string): string => {
  if (!data) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
};

const AdminProdutosPage: React.FC = () => {
  const [produtosBling, setProdutosBling] = useState<Produto[]>([]);
  const [produtosCustomizados, setProdutosCustomizados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosProdutos>(filtrosIniciais);
  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    porPagina: ITENS_POR_PAGINA,
    total: 0,
  });

  const carregarProdutosBling = useCallback(async (): Promise<void> => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/bling/produtos');
      if (!resposta.ok) {
        throw new Error(`Falha ao carregar produtos do Bling: ${resposta.status}`);
      }
      const dados = await resposta.json();
      const produtos: Produto[] = (dados.produtos ?? []).map((p: any) => ({
        id: String(p.id),
        codigo: p.codigo ?? '',
        nome: p.nome ?? '',
        preco: Number(p.preco ?? 0),
        estoque: Number(p.estoque ?? 0),
        categoria: p.categoria ?? 'Geral',
        ativo: Boolean(p.ativo ?? true),
        sincronizado: true,
        origem: 'bling',
        atualizadoEm: p.atualizadoEm ?? new Date().toISOString(),
      }));
      setProdutosBling(produtos);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro desconhecido ao carregar produtos.';
      setErro(mensagem);
      setProdutosBling([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  const sincronizarComBling = useCallback(async (): Promise<void> => {
    setSincronizando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/bling/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resposta.ok) {
        throw new Error(`Falha na sincronização com o Bling: ${resposta.status}`);
      }
      await carregarProdutosBling();
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro desconhecido na sincronização.';
      setErro(mensagem);
    } finally {
      setSincronizando(false);
    }
  }, [carregarProdutosBling]);

  useEffect(() => {
    const customizados = carregarProdutosCustomizados();
    setProdutosCustomizados(customizados);
    carregarProdutosBling();
  }, [carregarProdutosBling]);

  const produtosCombinados = useMemo<Produto[]>(() => {
    const mapa = new Map<string, Produto>();
    produtosBling.forEach((p) => mapa.set(p.id, p));
    produtosCustomizados.forEach((p) => mapa.set(p.id, p));
    return Array.from(mapa.values());
  }, [produtosBling, produtosCustomizados]);

  const categorias = useMemo<string[]>(() => {
    const set = new Set<string>();
    produtosCombinados.forEach((p) => set.add(p.categoria));
    return Array.from(set).sort();
  }, [produtosCombinados]);

  const produtosFiltrados = useMemo<Produto[]>(() => {
    return produtosCombinados.filter((produto) => {
      if (filtros.apenasAtivos && !produto.ativo) return false;
      if (filtros.origem !== 'todos' && produto.origem !== filtros.origem) return false;
      if (filtros.categoria && produto.categoria !== filtros.categoria) return false;
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const corresponde =
          produto.nome.toLowerCase().includes(termo) ||
          produto.codigo.toLowerCase().includes(termo);
        if (!corresponde) return false;
      }
      return true;
    });
  }, [produtosCombinados, filtros]);

  useEffect(() => {
    setPaginacao((prev) => ({
      ...prev,
      pagina: 1,
      total: produtosFiltrados.length,
    }));
  }, [produtosFiltrados.length]);

  const totalPaginas = Math.max(1, Math.ceil(paginacao.total / paginacao.porPagina));

  const produtosPaginados = useMemo<Produto[]>(() => {
    const inicio = (paginacao.pagina - 1) * paginacao.porPagina;
    const fim = inicio + paginacao.porPagina;
    return produtosFiltrados.slice(inicio, fim);
  }, [produtosFiltrados, paginacao]);

  const atualizarFiltro = useCallback(<K extends keyof FiltrosProdutos>(
    chave: K,
    valor: FiltrosProdutos[K],
  ): void => {
    setFiltros((prev) => ({ ...prev, [chave]: valor }));
  }, []);

  const limparFiltros = useCallback((): void => {
    setFiltros(filtrosIniciais);
  }, []);

  const irParaPagina = useCallback(
    (pagina: number): void => {
      const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);
      setPaginacao((prev) => ({ ...prev, pagina: paginaValida }));
    },
    [totalPaginas],
  );

  const adicionarProdutoCustomizado = useCallback((produto: Produto): void => {
    setProdutosCustomizados((prev) => {
      const atualizado = [...prev.filter((p) => p.id !== produto.id), produto];
      salvarProdutosCustomizados(atualizado);
      return atualizado;
    });
  }, []);

  const removerProdutoCustomizado = useCallback((id: string): void => {
    setProdutosCustomizados((prev) => {
      const atualizado = prev.filter((p) => p.id !== id);
      salvarProdutosCustomizados(atualizado);
      return atualizado;
    });
  }, []);

  const alternarAtivo = useCallback(
    (id: string): void => {
      const produto = produtosCombinados.find((p) => p.id === id);
      if (!produto) return;
      const atualizado: Produto = {
        ...produto,
        ativo: !produto.ativo,
        atualizadoEm: new Date().toISOString(),
      };
      if (produto.origem === 'customizado') {
        adicionarProdutoCustomizado(atualizado);
      } else {
        const comoCustomizado: Produto = {
          ...atualizado,
          origem: 'customizado',
          sincronizado: false,
        };
        adicionarProdutoCustomizado(comoCustomizado);
      }
    },
    [produtosCombinados, adicionarProdutoCustomizado],
  );

  return (
    <div className="admin-produtos-page">
      <header className="admin-produtos-header">
        <h1>Admin - Produtos</h1>
        <div className="admin-produtos-acoes">
          <button
            type="button"
            onClick={sincronizarComBling}
            disabled={sincronizando || carregando}
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar com Bling'}
          </button>
          <button
            type="button"
            onClick={carregarProdutosBling}
            disabled={carregando || sincronizando}
          >
            {carregando ? 'Carregando...' : 'Recarregar'}
          </button>
        </div>
      </header>

      {erro && (
        <div className="admin-produtos-erro" role="alert">
          {erro}
        </div>
      )}

      <section className="admin-produtos-filtros">
        <div className="filtro-group">
          <label htmlFor="filtro-busca">Buscar</label>
          <input
            id="filtro-busca"
            type="text"
            placeholder="Nome ou código..."
            value={filtros.busca}
            onChange={(e) => atualizarFiltro('busca', e.target.value)}
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="filtro-categoria">Categoria</label>
          <select
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={(e) => atualizarFiltro('categoria', e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="filtro-origem">Origem</label>
          <select
            id="filtro-origem"
            value={filtros.origem}
            onChange={(e) =>
              atualizarFiltro('origem', e.target.value as FiltrosProdutos['origem'])
            }
          >
            <option value="todos">Todos</option>
            <option value="bling">Bling</option>
            <option value="customizado">Customizados</option>
          </select>
        </div>

        <div className="filtro-group filtro-checkbox">
          <label>
            <input
              type="checkbox"
              checked={filtros.apenasAtivos}
              onChange={(e) => atualizarFiltro('apenasAtivos', e.target.checked)}
            />
            Apenas ativos
          </label>
        </div>

        <button type="button" onClick={limparFiltros} className="filtro-limpar">
          Limpar filtros
        </button>
      </section>

      <section className="admin-produtos-tabela">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && produtosPaginados.length === 0 ? (
              <tr>
                <td colSpan={9} className="tabela-vazia">
                  Carregando produtos...
                </td>
              </tr>
            ) : produtosPaginados.length === 0 ? (
              <tr>
                <td colSpan={9} className="tabela-vazia">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              produtosPaginados.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.codigo}</td>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria}</td>
                  <td>{formatarMoeda(produto.preco)}</td>
                  <td>{produto.estoque}</td>
                  <td>
                    <span className={`origem-badge origem-${produto.origem}`}>
                      {produto.origem === 'bling' ? 'Bling' : 'Customizado'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${produto.ativo ? 'ativo' : 'inativo'}`}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{formatarData(produto.atualizadoEm)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => alternarAtivo(produto.id)}
                      className="acao-toggle"
                    >
                      {produto.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    {produto.origem === 'customizado' && (
                      <button
                        type="button"
                        onClick={() => removerProdutoCustomizado(produto.id)}
                        className="acao-remover"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="admin-produtos-paginacao">
        <span>
          {paginacao.total} produto(s) - página {paginacao.pagina} de {totalPaginas}
        </span>
        <div className="paginacao-botoes">
          <button
            type="button"
            onClick={() => irParaPagina(1)}
            disabled={paginacao.pagina <= 1}
          >
            Primeira
          </button>
          <button
            type="button"
            onClick={() => irParaPagina(paginacao.pagina - 1)}
            disabled={paginacao.pagina <= 1}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => irParaPagina(paginacao.pagina + 1)}
            disabled={paginacao.pagina >= totalPaginas}
          >
            Próxima
          </button>
          <button
            type="button"
            onClick={() => irParaPagina(totalPaginas)}
            disabled={paginacao.pagina >= totalPaginas}
          >
            Última
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AdminProdutosPage;