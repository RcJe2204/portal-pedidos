'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Aba = "importar" | "manual";

interface ProdutoCatalogo {
  sku: string;
  nome: string;
  categoria: string;
  precoBase?: number;
}

interface ItemPedido {
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  precoUnitario: number;
}

function detectarCategoria(nome: string): string {
  const n = nome.toUpperCase().trim()

  // CAPA
  if (n.includes('CAPA PROTETORA')) return 'CAPA'

  // PELUCIA NVI
  if (n.includes('PELUCIA') && n.includes('NVI')) return 'PELUCIA NVI LETRAS GRANDES GEOGRAFICA'

  // PELUCIA ARC
  if (n.includes('PELUCIA') && n.includes('ARC')) return 'PELUCIA ARC LETRAS GRANDES GEOGRAFICA'

  // MINI GLITTER → CAPA DURA LUXO
  if (n.includes('MINI') && n.includes('GLITTER')) return 'MINI CAPA DURA LUXO'

  // MINI COURO/YESHUA/outros → MINI CAPA DURA
  if (n.includes('MINI')) return 'MINI CAPA DURA'

  // GLITTER HIPERGIGANTE
  if (n.includes('GLITTER') && (n.includes('HIPERGIGANTE') || n.includes('HIPER GIGANTE')))
    return 'GLITTER LETRAS HIPERGIGANTE ARC'

  // GLITTER MÉDIA
  if (n.includes('GLITTER')) return 'GLITTER LETRAS MÉDIAS ARC'

  // ULTRA GIGANTE → JUMBO
  if (n.includes('ULTRA GIGANTE')) return 'JUMBO / ULTRA GIGANTE'

  // PREMIUM
  if (n.includes('PREMIUM')) return 'PREMIUM MEGA GIGANTE GEOGRAFICA'

  // NVI GRANDE
  if (n.includes('NVI') && (n.includes('GRANDE') || n.includes('GIGANTE')))
    return 'NVI LETRAS GRANDES GEOGRAFICA'

  // NVI MÉDIA
  if (n.includes('NVI') && (n.includes('MÉDIA') || n.includes('MEDIA')))
    return 'NVI LETRAS MÉDIAS GEOGRAFICA'

  // ARC GRANDE (sem ser PELUCIA)
  if (n.includes('ARC') && (n.includes('GRANDE') || n.includes('GIGANTE')))
    return 'ARC LETRAS GRANDES GEOGRAFICA'

  // ARC MÉDIA (sem ser PELUCIA)
  if (n.includes('ARC') && (n.includes('MÉDIA') || n.includes('MEDIA')))
    return 'ARC LETRAS MÉDIAS GEOGRAFICA'

  // ARC KINGS HIPERGIGANTE
  if (n.includes('ARC KINGS') && (n.includes('HIPERGIGANTE') || n.includes('HIPER')))
    return 'LETRAS HIPERGIGANTES ARC KINGS'

  // ARC KINGS ILUMINADA
  if (n.includes('ILUMINADA') && n.includes('ARC KINGS'))
    return 'LETRAS MÉDIAS ARC KINGS ILUMINADA'

  // ARC KINGS ANTIGO
  if (n.includes('ANTIGO') && n.includes('ARC KINGS'))
    return 'LETRAS MÉDIAS ARC KINGS ANTIGO HDC'

  // ARC KINGS
  if (n.includes('ARC KINGS')) return 'LETRAS MÉDIAS ARC KINGS'

  // HIPER GIGANTE HDC → ANTIGO
  if (n.includes('HIPER GIGANTE') && n.includes('HDC'))
    return 'LETRAS HIPER GIGANTE ANTIGO HDC'
  if (n.includes('HIPERGIGANTE') && n.includes('HDC'))
    return 'LETRAS HIPER GIGANTE ANTIGO HDC'

  // Fallback
  return 'DIVERSOS'
}

export default function PaginaLojista() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("manual");
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [categoriasBling, setCategoriasBling] = useState<string[]>([]);
  const [lojistaSelecionado, setLojistaSelecionado] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [skuDigitado, setSkuDigitado] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  const lojistasDisponiveis = ["APL", "ILUMINADA", "DEUSDETY SHOPEE", "ESCAPE", "PROMESSA"];

  useEffect(() => {
    const tokenData = JSON.parse(localStorage.getItem('bling_token') || '{}');
    if (!tokenData.access_token) {
      setErro("Token do Bling não encontrado. Conecte o Bling na página de administração primeiro.");
      setDebugInfo("Token não encontrado no localStorage");
      setCarregando(false);
      return;
    }

    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        // --- Buscar grupos/categorias do Bling ---
        const resCategorias = await fetch("/api/bling/categorias-produtos", {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'x-refresh-token': tokenData.refresh_token || '',
          }
        });
        const dadosCategorias = await resCategorias.json();
        if (dadosCategorias.data) {
          const nomes = dadosCategorias.data.map((c: any) => c.nome).filter(Boolean);
          setCategoriasBling(nomes);
          setDebugInfo(`Carregados ${nomes.length} grupos de produtos do Bling`);
        }
        if (dadosCategorias.novoToken) {
          const tokenAtual = JSON.parse(localStorage.getItem('bling_token') || '{}');
          localStorage.setItem('bling_token', JSON.stringify({
            access_token: dadosCategorias.novoToken,
            refresh_token: dadosCategorias.novoRefreshToken || tokenAtual.refresh_token,
            expires_at: Date.now() + 3600 * 1000,
          }));
        }

        // --- Buscar produtos ---
        const resCatalogo = await fetch("/api/bling/produtos", {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'x-refresh-token': tokenData.refresh_token || '',
            'x-expires-at': String(tokenData.expires_at || ''),
          }
        });

        const dadosCatalogo = await resCatalogo.json();

        if (dadosCatalogo.novoToken) {
          const tokenAtual = JSON.parse(localStorage.getItem('bling_token') || '{}');
          localStorage.setItem('bling_token', JSON.stringify({
            access_token: dadosCatalogo.novoToken,
            refresh_token: dadosCatalogo.novoRefreshToken || tokenAtual.refresh_token,
            expires_at: Date.now() + 3600 * 1000,
          }));
          setDebugInfo("Token renovado automaticamente!");
        }

        if (!resCatalogo.ok) {
          if (dadosCatalogo.precisaReconectar) {
            setErro("Token expirou e não foi possível renovar. Conecte o Bling novamente.");
            setCarregando(false);
            return;
          }
          throw new Error(`Falha ao carregar catálogo. Status: ${resCatalogo.status}`);
        }

        const produtos = dadosCatalogo.data || [];
        setDebugInfo(`API retornou ${produtos.length} produtos`);

        const catalogoNormalizado: ProdutoCatalogo[] = produtos
          .map((p: any) => ({
            sku: String(p.codigo ?? "").trim(),
            nome: String(p.nome ?? "").trim(),
            categoria: detectarCategoria(p.nome), // ← DETECÇÃO AUTOMÁTICA
            precoBase: typeof p.preco === "number" ? p.preco : undefined,
          }))
          .filter((p: ProdutoCatalogo) => p.sku && p.nome);

        setDebugInfo(`Normalizados: ${catalogoNormalizado.length} produtos`);
        setCatalogo(catalogoNormalizado);

        if (lojistasDisponiveis.length > 0) {
          setLojistaSelecionado(lojistasDisponiveis[0]);
        }
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar dados.");
        setDebugInfo(`ERRO: ${e?.message}`);
        console.error("Erro ao carregar dados:", e);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [router]);

  const categoriasDisponiveis = useMemo(() => {
    const categoriasSet = new Set(
      catalogo
        .map((p) => p.categoria)
        .filter((c) => c && c.trim() !== "" && c !== "Sem Categoria")
    );
    categoriasBling.forEach((c) => {
      if (c && c.trim() !== "") categoriasSet.add(c)
    })
    return Array.from(categoriasSet).sort();
  }, [catalogo, categoriasBling]);

  const produtosFiltrados = useMemo(() => {
    if (!categoriaSelecionada) return catalogo;
    return catalogo.filter((p) => p.categoria === categoriaSelecionada);
  }, [catalogo, categoriaSelecionada]);

  function pegarPreco(produto: ProdutoCatalogo) {
    return produto.precoBase ?? 0;
  }

  function adicionarItem(produto: ProdutoCatalogo) {
    const preco = produto.precoBase || 0;
    setItens((antigos) => {
      const existente = antigos.find((i) => i.sku === produto.sku);
      if (existente) {
        return antigos.map((i) =>
          i.sku === produto.sku ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [
        ...antigos,
        {
          sku: produto.sku,
          nome: produto.nome,
          categoria: produto.categoria,
          quantidade: 1,
          precoUnitario: preco,
        },
      ];
    });
  }

  function adicionarPorSku() {
    const sku = skuDigitado.trim();
    if (!sku) return;
    const produto = catalogo.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (!produto) {
      alert("SKU não encontrado no catálogo.");
      return;
    }
    adicionarItem(produto);
    setSkuDigitado("");
  }

  function alterarQuantidade(sku: string, delta: number) {
    setItens((antigos) =>
      antigos
        .map((item) =>
          item.sku === sku ? { ...item, quantidade: item.quantidade + delta } : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function removerItem(sku: string) {
    setItens((antigos) => antigos.filter((item) => item.sku !== sku));
  }

  const total = itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col gap-6">
        <div className="text-2xl font-bold">Lojista</div>
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setAba("importar")}
            className={`rounded-lg px-4 py-3 text-left transition ${
              aba === "importar" ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            Importar PDF
          </button>
          <button
            onClick={() => setAba("manual")}
            className={`rounded-lg px-4 py-3 text-left transition ${
              aba === "manual" ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            Digitação Manual
          </button>
        </nav>
        <div className="mt-auto text-xs text-slate-400">
          Catálogo carregado do Bling
        </div>
      </aside>

      <main className="flex-1 p-6">
        {debugInfo && (
          <div className="mb-4 rounded-lg bg-blue-100 p-3 text-sm text-blue-800 border border-blue-200">
            🐛 {debugInfo}
          </div>
        )}

        {erro ? (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            ❌ {erro}
            <div className="mt-3">
              <a
                href="/admin/produtos"
                className="inline-block rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Ir para Admin e conectar Bling
              </a>
            </div>
          </div>
        ) : null}

        {carregando ? (
          <div className="rounded-xl bg-white p-6 shadow">Carregando catálogo e preços...</div>
        ) : aba === "importar" ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h1 className="text-2xl font-semibold mb-4">Importar PDF</h1>
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                Área do upload de PDF
              </div>
            </div>
            <aside className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Resumo</h2>
              <p className="text-slate-500">Sem itens importados ainda.</p>
            </aside>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h1 className="text-2xl font-semibold mb-4">Digitação Manual</h1>
                <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
                  <input
                    value={skuDigitado}
                    onChange={(e) => setSkuDigitado(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && adicionarPorSku()}
                    className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                    placeholder="Digite o SKU"
                  />
                  <select
                    value={lojistaSelecionado}
                    onChange={(e) => setLojistaSelecionado(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  >
                    <option value="">Selecione um lojista</option>
                    {lojistasDisponiveis.map((lojista) => (
                      <option key={lojista} value={lojista}>
                        {lojista}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={adicionarPorSku}
                    className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800"
                  >
                    Adicionar SKU
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    Produtos {catalogo.length > 0 && <span className="text-sm text-slate-400 font-normal">({catalogo.length})</span>}
                  </h2>
                  <select
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categoriasDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {produtosFiltrados.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">
                      {carregando ? 'Carregando...' : 'Nenhum produto encontrado.'}
                    </div>
                  ) : (
                    produtosFiltrados.map((produto) => (
                      <button
                        key={produto.sku}
                        onClick={() => adicionarItem(produto)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-400 hover:bg-white"
                      >
                        <div className="font-semibold">{produto.nome}</div>
                        <div className="mt-2 text-sm text-slate-600">SKU: {produto.sku}</div>
                        <div className="text-sm text-slate-600">Categoria: {produto.categoria}</div>
                        <div className="mt-3 text-sm font-medium">
                          Preço: R$ {pegarPreco(produto).toFixed(2)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <aside className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              {itens.length === 0 ? (
                <p className="text-slate-500">Nenhum item adicionado.</p>
              ) : (
                <div className="space-y-4">
                  {itens.map((item) => (
                    <div key={item.sku} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{item.nome}</div>
                          <div className="text-xs text-slate-500">{item.sku}</div>
                          <div className="text-xs text-slate-500">{item.categoria}</div>
                        </div>
                        <button onClick={() => removerItem(item.sku)} className="text-sm text-red-600">Remover</button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => alterarQuantidade(item.sku, -1)} className="h-8 w-8 rounded-md border border-slate-300">-</button>
                          <span className="w-8 text-center">{item.quantidade}</span>
                          <button onClick={() => alterarQuantidade(item.sku, 1)} className="h-8 w-8 rounded-md border border-slate-300">+</button>
                        </div>
                        <div className="font-semibold">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}