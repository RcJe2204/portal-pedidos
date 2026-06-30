'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LOJISTAS as LOJISTAS_FIXOS } from '@/constants/lojistas';
import { Upload, FileText } from 'lucide-react';

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

interface ListaPreco {
  id: string
  nome: string
  precosPorCategoria: Record<string, number>
  lojistasVinculados: string[]
}

const CATEGORIAS_FIXAS = [
  'ARC LETRAS GRANDES GEOGRAFICA',
  'ARC LETRAS MÉDIAS GEOGRAFICA',
  'CAPA',
  'DIVERSOS',
  'GLITTER LETRAS HIPERGIGANTE ARC',
  'GLITTER LETRAS MÉDIAS ARC',
  'JUMBO / ULTRA GIGANTE',
  'LETRAS HIPER GIGANTE ANTIGO HDC',
  'LETRAS HIPERGIGANTES ARC KINGS',
  'LETRAS MÉDIAS ARC KINGS',
  'LETRAS MÉDIAS ARC KINGS ANTIGO HDC',
  'LETRAS MÉDIAS ARC KINGS ILUMINADA',
  'MINI CAPA DURA',
  'MINI CAPA DURA LUXO',
  'NVI LETRAS GRANDES GEOGRAFICA',
  'NVI LETRAS MÉDIAS GEOGRAFICA',
  'PELUCIA ARC LETRAS GRANDES GEOGRAFICA',
  'PELUCIA NVI LETRAS GRANDES GEOGRAFICA',
  'PREMIUM MEGA GIGANTE GEOGRAFICA',
]

const STORAGE_KEY_LISTAS = 'portal_listas_preco'
const STORAGE_KEY_RESTRICOES = 'portal_restricoes_categorias'

function detectarCategoria(nome: string): string {
  const n = nome.toUpperCase().trim()
  if (n.includes('CAPA PROTETORA')) return 'CAPA'
  if (n.includes('PELUCIA') && n.includes('NVI')) return 'PELUCIA NVI LETRAS GRANDES GEOGRAFICA'
  if (n.includes('PELUCIA') && n.includes('ARC')) return 'PELUCIA ARC LETRAS GRANDES GEOGRAFICA'
  if (n.includes('MINI') && n.includes('GLITTER')) return 'MINI CAPA DURA LUXO'
  if (n.includes('MINI')) return 'MINI CAPA DURA'
  if (n.includes('GLITTER') && (n.includes('HIPERGIGANTE') || n.includes('HIPER GIGANTE'))) return 'GLITTER LETRAS HIPERGIGANTE ARC'
  if (n.includes('GLITTER')) return 'GLITTER LETRAS MÉDIAS ARC'
  if (n.includes('ULTRA GIGANTE')) return 'JUMBO / ULTRA GIGANTE'
  if (n.includes('PREMIUM')) return 'PREMIUM MEGA GIGANTE GEOGRAFICA'
  if (n.includes('NVI') && (n.includes('GRANDE') || n.includes('GIGANTE'))) return 'NVI LETRAS GRANDES GEOGRAFICA'
  if (n.includes('NVI') && (n.includes('MÉDIA') || n.includes('MEDIA'))) return 'NVI LETRAS MÉDIAS GEOGRAFICA'
  if (n.includes('ARC') && (n.includes('GRANDE') || n.includes('GIGANTE'))) return 'ARC LETRAS GRANDES GEOGRAFICA'
  if (n.includes('ARC') && (n.includes('MÉDIA') || n.includes('MEDIA'))) return 'ARC LETRAS MÉDIAS GEOGRAFICA'
  if (n.includes('EDIFICA') && (n.includes('HIPER GIGANTE') || n.includes('HIPERGIGANTE'))) return 'LETRAS HIPERGIGANTES ARC KINGS'
  if (n.includes('EDIFICA') && n.includes('LETRA MÉDIA')) return 'LETRAS MÉDIAS ARC KINGS'
  if (n.includes('LETRA MÉDIA') && n.includes('HDC')) return 'LETRAS MÉDIAS ARC KINGS ANTIGO HDC'
  if (n.includes('ARC KINGS') && (n.includes('HIPERGIGANTE') || n.includes('HIPER'))) return 'LETRAS HIPERGIGANTES ARC KINGS'
  if (n.includes('ILUMINADA') && n.includes('ARC KINGS')) return 'LETRAS MÉDIAS ARC KINGS ILUMINADA'
  if (n.includes('ANTIGO') && n.includes('ARC KINGS')) return 'LETRAS MÉDIAS ARC KINGS ANTIGO HDC'
  if (n.includes('ARC KINGS')) return 'LETRAS MÉDIAS ARC KINGS'
  if (n.includes('HIPER GIGANTE') && n.includes('HDC')) return 'LETRAS HIPER GIGANTE ANTIGO HDC'
  if (n.includes('HIPERGIGANTE') && n.includes('HDC')) return 'LETRAS HIPER GIGANTE ANTIGO HDC'
  return 'DIVERSOS'
}

export default function PaginaPedidos() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("manual");
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [lojistas, setLojistas] = useState<any[]>(LOJISTAS_FIXOS);
  const [categoriasBling, setCategoriasBling] = useState<string[]>([]);
  const [categoriasCustom, setCategoriasCustom] = useState<string[]>([]);
  const [lojistaSelecionado, setLojistaSelecionado] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [skuDigitado, setSkuDigitado] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [erro, setErro] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // ══════════════════════════════════════════════════
  // Carrega listas de preço + restrições
  // ══════════════════════════════════════════════════
  const [listasPreco, setListasPreco] = useState<ListaPreco[]>([])
  const [restricoes, setRestricoes] = useState<Record<string, string[]>>({})

  // ══════════════════════════════════════════════════
  // Estado e funções para Importar PDF
  // ══════════════════════════════════════════════════
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erroPdf, setErroPdf] = useState('')
  const [resultadoPdf, setResultadoPdf] = useState<{
    itens: { sku: string; quantidade: number; linha: string }[]
    paginas: number
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LISTAS)
    if (saved) setListasPreco(JSON.parse(saved))

    const savedRestricoes = localStorage.getItem(STORAGE_KEY_RESTRICOES)
    if (savedRestricoes) setRestricoes(JSON.parse(savedRestricoes))
  }, [])

    useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        // 1. Busca Lojistas do Banco
        const resLojistas = await fetch("/api/clientes");
        if (resLojistas.ok) {
          const dadosLojistas = await resLojistas.json();
          if (dadosLojistas.length > 0) {
            setLojistas(dadosLojistas);
            setLojistaSelecionado(dadosLojistas[0].nome);
          }
        }

        // 2. Busca Produtos
        const resCatalogo = await fetch("/api/produtos");
        if (resCatalogo.status === 401) {
          setErro("Bling não conectado. Conecte o Bling na página de Produtos.");
          setCarregando(false);
          return;
        }

        const dadosCatalogo = await resCatalogo.json();
        const produtos = dadosCatalogo.data || [];
        
        const customProdutos: any[] = JSON.parse(localStorage.getItem('portal_produtos_custom') || '[]')
        const mapaOverrides = new Map()
        customProdutos.forEach((p: any) => {
          if (p.codigo && p.categoria) {
            mapaOverrides.set(String(p.codigo).trim().toLowerCase(), p.categoria)
          }
        })

        const catalogoNormalizado: ProdutoCatalogo[] = produtos.map((p: any) => {
          const sku = String(p.codigo ?? "").trim()
          const categoriaCustom = mapaOverrides.get(sku.toLowerCase())
          return {
            sku,
            nome: String(p.nome ?? "").trim(),
            categoria: categoriaCustom || detectarCategoria(p.nome),
            precoBase: typeof p.preco === "number" ? p.preco : undefined,
          }
        }).filter((p: ProdutoCatalogo) => p.sku && p.nome);

        const skusExistentes = new Set(catalogoNormalizado.map(p => p.sku.toLowerCase()))
        const customProdutosExtra = customProdutos
          .filter((p: any) => p.codigo && p.nome && !skusExistentes.has(String(p.codigo).trim().toLowerCase()))
          .map((p: any) => ({
            sku: String(p.codigo).trim(),
            nome: String(p.nome).trim(),
            categoria: p.categoria || 'DIVERSOS',
            precoBase: typeof p.preco === "number" ? p.preco : 0,
          }))

        const catalogoCompleto = [...catalogoNormalizado, ...customProdutosExtra]
        setCatalogo(catalogoCompleto);

      } catch (e: any) {
        setErro("Erro ao carregar dados.");
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('portal_produtos_custom')
    if (saved) {
      try {
        const custom = JSON.parse(saved)
        const cats = custom
          .map((p: any) => p.categoria)
          .filter((c: string) => c && c.trim() !== '')
        setCategoriasCustom([...new Set(cats)] as string[])
      } catch {
        // ignore
      }
    }
  }, [])

  const categoriasDisponiveis = useMemo(() => {
    const categoriasSet = new Set<string>()
    catalogo.forEach((p) => {
      if (p.categoria && p.categoria.trim() !== '') categoriasSet.add(p.categoria)
    })
    CATEGORIAS_FIXAS.forEach((c) => categoriasSet.add(c))
    categoriasBling.forEach((c) => {
      if (c && c.trim() !== '') categoriasSet.add(c)
    })
    categoriasCustom.forEach((c) => {
      if (c && c.trim() !== '') categoriasSet.add(c)
    })
    return Array.from(categoriasSet).sort()
  }, [catalogo, categoriasBling, categoriasCustom])

  // ══════════════════════════════════════════════════
  // Filtra produtos considerando RESTRIÇÕES do lojista
  // ══════════════════════════════════════════════════
  const categoriasPermitidasLojista = useMemo(() => {
    if (!lojistaSelecionado) return null
    const cats = restricoes[lojistaSelecionado]
    if (!cats || cats.length === 0) return null
    return cats
  }, [lojistaSelecionado, restricoes])

  const produtosFiltrados = useMemo(() => {
    let lista = catalogo
    if (categoriasPermitidasLojista) {
      lista = lista.filter(p => categoriasPermitidasLojista.includes(p.categoria))
    }
    if (categoriaSelecionada) {
      lista = lista.filter(p => p.categoria === categoriaSelecionada)
    }
    return lista
  }, [catalogo, categoriaSelecionada, categoriasPermitidasLojista])

  function pegarPreco(produto: ProdutoCatalogo): number {
    if (!lojistaSelecionado) return produto.precoBase ?? 0
    const lojista = lojistas.find(l => l.nome === lojistaSelecionado)
    if (!lojista) return produto.precoBase ?? 0
    const lista = listasPreco.find(l => l.lojistasVinculados.includes(lojista.nome))
    if (!lista) return produto.precoBase ?? 0
    const precoLista = lista.precosPorCategoria[produto.categoria]
    if (precoLista && precoLista > 0) return precoLista
    return produto.precoBase ?? 0
  }

  const nomeListaLojista = useMemo(() => {
    if (!lojistaSelecionado) return ''
    const lojista = lojistas.find(l => l.nome === lojistaSelecionado)
    if (!lojista) return ''
    const lista = listasPreco.find(l => l.lojistasVinculados.includes(lojista.nome))
    return lista ? ` (Lista: ${lista.nome})` : ' (Sem lista vinculada)'
  }, [lojistaSelecionado, listasPreco])

  // ══════════════════════════════════════════════════
  // Funções do PDF
  // ══════════════════════════════════════════════════
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file && file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são aceitos.')
      return
    }
    setArquivoSelecionado(file)
    setResultadoPdf(null)
    setErroPdf('')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são aceitos.')
      return
    }
    setArquivoSelecionado(file)
    setResultadoPdf(null)
    setErroPdf('')
  }

  async function processarPdf() {
    if (!arquivoSelecionado || !lojistaSelecionado) return
    setProcessando(true)
    setErroPdf('')
    setResultadoPdf(null)
    try {
      const formData = new FormData()
      formData.append('file', arquivoSelecionado)
      formData.append('lojista', lojistaSelecionado)
      const res = await fetch('/api/pedidos/importar-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setErroPdf(data.error || 'Erro ao processar PDF'); return }
      if (data.itens.length === 0) { setErroPdf(data.aviso || 'Nenhum item encontrado.'); return }
      setResultadoPdf(data)
    } catch (err: any) {
      setErroPdf('Erro ao enviar o arquivo: ' + (err.message || 'desconhecido'))
    } finally { setProcessando(false) }
  }

  function confirmarImportacao() {
    if (!resultadoPdf) return
    const itensValidos = resultadoPdf.itens.filter(i => {
      const produto = catalogo.find(p => p.sku.toLowerCase() === i.sku.toLowerCase())
      if (!produto) return false
      if (categoriasPermitidasLojista && !categoriasPermitidasLojista.includes(produto.categoria)) return false
      return true
    })
    itensValidos.forEach(item => {
      const produto = catalogo.find(p => p.sku.toLowerCase() === item.sku.toLowerCase())
      if (!produto) return
      const preco = pegarPreco(produto)
      setItens(prev => {
        const existente = prev.find(i => i.sku === produto.sku)
        if (existente) return prev.map(i => i.sku === produto.sku ? { ...i, quantidade: i.quantidade + item.quantidade } : i)
        return [...prev, { sku: produto.sku, nome: produto.nome, categoria: produto.categoria, quantidade: item.quantidade, precoUnitario: preco }]
      })
    })
    setArquivoSelecionado(null)
    setResultadoPdf(null)
    setErroPdf('')
    setAba('manual')
  }

  function adicionarItem(produto: ProdutoCatalogo) {
    const preco = pegarPreco(produto);
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
    if (categoriasPermitidasLojista && !categoriasPermitidasLojista.includes(produto.categoria)) {
      alert(`Este produto é da categoria "${produto.categoria}", que não está liberada para ${lojistaSelecionado}.`)
      return
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
  async function enviarPedido() {
  if (!lojistaSelecionado || itens.length === 0) return;

  setEnviando(true);
  setErro("");

  try {
    const lojista = lojistas.find(l => l.nome === lojistaSelecionado);
    if (!lojista) {
      alert("Lojista não encontrado.");
      setEnviando(false);
      return;
    }

    const payload = {
      lojistaId: lojista.id,
      itens: itens.map(i => ({
        codigo: i.sku,
        nome: i.nome,
        quantidade: i.quantidade,
        preco: i.precoUnitario
      })),
      observacao: ""
    };

    const res = await fetch("/api/pedidos/criar-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Erro ao enviar pedido: " + (data.error || "Erro desconhecido"));
      setEnviando(false);
      return;
    }

    setPedidoEnviado(true);
    setItens([]);
    alert("Pedido #" + data.pedido.id.slice(0, 8) + " enviado com sucesso!");
  } catch (err: any) {
    alert("Erro ao enviar pedido: " + (err.message || "Erro desconhecido"));
  } finally {
    setEnviando(false);
  }
}

  const total = itens.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col gap-6">
        <div className="text-2xl font-bold">Pedidos</div>
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
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h1 className="text-2xl font-semibold mb-4">Importar PDF</h1>

                {/* Seletor do lojista */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lojista</label>
                  <select
                    value={lojistaSelecionado}
                    onChange={(e) => setLojistaSelecionado(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  >
                    <option value="">Selecione um lojista</option>
                    {lojistas.map((lojista) => (
                      <option key={lojista.nome} value={lojista.nome}>
                        {lojista.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Área de upload */}
                <label
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    arquivoSelecionado
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {arquivoSelecionado ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-indigo-500" />
                      <p className="text-sm font-medium text-indigo-700">{arquivoSelecionado.name}</p>
                      <p className="text-xs text-slate-400">
                        {(arquivoSelecionado.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        Arraste o PDF aqui ou <span className="text-indigo-600 font-medium">clique para selecionar</span>
                      </p>
                      <p className="text-xs text-slate-400">Formatos aceitos: PDF</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Botão de processar */}
                {arquivoSelecionado && !processando && !resultadoPdf && (
                  <button
                    onClick={processarPdf}
                    disabled={!lojistaSelecionado}
                    className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                  >
                    {!lojistaSelecionado
                      ? 'Selecione um lojista primeiro'
                      : `Processar ${arquivoSelecionado.name}`}
                  </button>
                )}

                {processando && (
                  <div className="mt-4 flex items-center justify-center gap-3 py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <span className="text-sm text-slate-600">Lendo PDF e extraindo produtos...</span>
                  </div>
                )}

                {erroPdf && (
                  <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                    ❌ {erroPdf}
                  </div>
                )}

                {/* Prévia dos itens extraídos */}
                {resultadoPdf && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        📄 Itens encontrados ({resultadoPdf.itens.length})
                      </h3>
                      <p className="text-xs text-slate-400">{resultadoPdf.paginas} página(s)</p>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {resultadoPdf.itens.map((item, idx) => {
                        const produto = catalogo.find(
                          p => p.sku.toLowerCase() === item.sku.toLowerCase()
                        )
                        const nome = produto?.nome || 'Produto não encontrado'
                        const categoria = produto?.categoria || '—'
                        const preco = produto ? pegarPreco(produto) : 0
                        const permitido = !categoriasPermitidasLojista || categoriasPermitidasLojista.includes(categoria)

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              permitido
                                ? 'border-slate-200 bg-white'
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {item.sku}
                                </span>
                                {!permitido && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                    Bloqueado
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-900 mt-0.5">{nome}</p>
                              <p className="text-xs text-slate-400">{categoria}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const novos = resultadoPdf.itens.map((it, i) =>
                                      i === idx ? { ...it, quantidade: Math.max(1, it.quantidade - 1) } : it
                                    )
                                    setResultadoPdf({ ...resultadoPdf, itens: novos })
                                  }}
                                  className="h-7 w-7 rounded border border-slate-300 text-sm"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantidade}
                                </span>
                                <button
                                  onClick={() => {
                                    const novos = resultadoPdf.itens.map((it, i) =>
                                      i === idx ? { ...it, quantidade: it.quantidade + 1 } : it
                                    )
                                    setResultadoPdf({ ...resultadoPdf, itens: novos })
                                  }}
                                  className="h-7 w-7 rounded border border-slate-300 text-sm"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-medium text-indigo-600 w-20 text-right">
                                R$ {(item.quantidade * preco).toFixed(2)}
                              </span>
                              <button
                                onClick={() => {
                                  const novos = resultadoPdf.itens.filter((_, i) => i !== idx)
                                  setResultadoPdf({ ...resultadoPdf, itens: novos })
                                }}
                                className="text-red-400 hover:text-red-600 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {resultadoPdf.itens.filter(
                      i => categoriasPermitidasLojista && !categoriasPermitidasLojista.includes(
                        catalogo.find(p => p.sku.toLowerCase() === i.sku.toLowerCase())?.categoria || ''
                      )
                    ).length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                        ⚠️ Alguns itens não estão disponíveis para {lojistaSelecionado}.
                        Eles serão removidos automaticamente ao confirmar.
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="font-semibold text-slate-900">Total Estimado</span>
                      <span className="text-lg font-bold text-indigo-600">
                        R$ {resultadoPdf.itens
                          .filter(i => {
                            const p = catalogo.find(pt => pt.sku.toLowerCase() === i.sku.toLowerCase())
                            return !categoriasPermitidasLojista || (p && categoriasPermitidasLojista.includes(p.categoria))
                          })
                          .reduce((acc, i) => {
                            const p = catalogo.find(pt => pt.sku.toLowerCase() === i.sku.toLowerCase())
                            return acc + (p ? pegarPreco(p) * i.quantidade : 0)
                          }, 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setArquivoSelecionado(null)
                          setResultadoPdf(null)
                          setErroPdf('')
                        }}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={confirmarImportacao}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all"
                      >
                        ✅ Adicionar ao Pedido ({resultadoPdf.itens.filter(i => {
                          const p = catalogo.find(pt => pt.sku.toLowerCase() === i.sku.toLowerCase())
                          return !categoriasPermitidasLojista || (p && categoriasPermitidasLojista.includes(p.categoria))
                        }).length} itens)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              {itens.length === 0 && !resultadoPdf ? (
                <p className="text-slate-500">Nenhum item adicionado.</p>
              ) : (
                <div className="space-y-4">
                  {resultadoPdf && (
                    <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
                      📄 PDF processado — {resultadoPdf.itens.length} itens extraídos
                    </div>
                  )}
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
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                     {itens.length > 0 && (
    <button
      onClick={enviarPedido}
      disabled={enviando}
      className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
    >
      {enviando ? "Enviando..." : "ENVIAR PEDIDO - R$ " + total.toFixed(2)}
    </button>
  )}
                  </div>
                </div>
              )}
            </aside>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h1 className="text-2xl font-semibold mb-4">
                  Digitação Manual
                  <span className="text-sm text-slate-400 font-normal ml-2">
                    {lojistaSelecionado && nomeListaLojista}
                  </span>
                </h1>
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
                    {lojistas.map((lojista) => (
                      <option key={lojista.id} value={lojista.nome}>
                        {lojista.nome}
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

                {categoriasPermitidasLojista && (
                  <div className="mt-3 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
                    🛡️ <strong>{lojistaSelecionado}</strong> pode vender apenas{' '}
                    <strong>{categoriasPermitidasLojista.length} categoria(s)</strong>.
                    Produtos de outras categorias não aparecem na lista abaixo.
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    Produtos
                    {categoriasPermitidasLojista && (
                      <span className="text-sm text-indigo-500 font-normal ml-2">
                        ({produtosFiltrados.length} disponíveis para {lojistaSelecionado})
                      </span>
                    )}
                    {!categoriasPermitidasLojista && catalogo.length > 0 && (
                      <span className="text-sm text-slate-400 font-normal ml-2">
                        ({catalogo.length})
                      </span>
                    )}
                  </h2>
                  <select
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categoriasDisponiveis
                      .filter(cat => !categoriasPermitidasLojista || categoriasPermitidasLojista.includes(cat))
                      .map((categoria) => (
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
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                    {itens.length > 0 && (
    <button
      onClick={enviarPedido}
      disabled={enviando}
      className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
    >
      {enviando ? "Enviando..." : "ENVIAR PEDIDO - R$ " + total.toFixed(2)}
    </button>
  )}
                  </div>
                </div>
              )}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}