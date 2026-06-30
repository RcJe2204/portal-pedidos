'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Package
} from 'lucide-react'
import ProdutoModal from '@/components/ProdutoModal'

interface Produto {
  id: number
  codigo: string
  nome: string
  preco: number
  estoque: {
    saldoVirtualTotal: number
  }
  situacao: string
  categoria?: string
  tags?: string
}

interface ProdutoForm {
  codigo: string
  nome: string
  preco: number
  estoque: number
  situacao: string
  categoria: string
  tags: string
}

const ITENS_POR_PAGINA = 30
const STORAGE_KEY = 'portal_produtos_custom'

export default function AdminProdutosPage() {
  const router = useRouter()
  const [produtosBling, setProdutosBling] = useState<Produto[]>([])
  const [produtosCustom, setProdutosCustom] = useState<Produto[]>([])
  const [search, setSearch] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>()
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [sincronizando, setSincronizando] = useState(false)

  // ALTERAÇÃO 1: Função de carregar produtos isolada para ser reutilizada
  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/produtos')
      if (res.status === 401) {
        setErro('Bling não conectado. Verifique as chaves no banco.')
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar produtos')
      
      const data = await res.json()
      setProdutosBling(Array.isArray(data) ? data : (data.data || []))
      setErro('')
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth || JSON.parse(auth).tipo !== 'admin') {
      router.push('/admin/login')
      return
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setProdutosCustom(JSON.parse(saved))
    
    carregarProdutos()
  }, [router, carregarProdutos])

  const produtos = [...produtosCustom, ...produtosBling.filter(
    bling => !produtosCustom.some(c => c.codigo === bling.codigo)
  )]

  const fmt = (v: number) =>
    v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

  // ALTERAÇÃO 2: Lógica de Filtro Unificada (Busca + Categoria)
  const listaFiltrada = produtos.filter(p => {
    const matchesSearch = 
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.nome?.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = categoriaSelecionada === '' || p.categoria === categoriaSelecionada
    
    return matchesSearch && matchesCategory
  })

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const paginaAtual = listaFiltrada.slice(inicio, inicio + ITENS_POR_PAGINA)

  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))] as string[]

  // ALTERAÇÃO 3: Cálculos baseados na lista filtrada para precisão
  const totalEstoque = produtos.reduce((acc, p) => acc + (p.estoque?.saldoVirtualTotal || 0), 0)
  const totalValorEstoque = produtos.reduce((acc, p) => acc + (p.preco || 0) * (p.estoque?.saldoVirtualTotal || 0), 0)

  const irParaPagina = (p: number) => {
    if (p >= 1 && p <= totalPaginas) setPagina(p)
  }

  const handleSync = async () => {
    setSincronizando(true)
    try {
      const res = await fetch('/api/bling/importar-produtos', { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Falha na sincronização')
      }
      
      alert(`Sucesso! ${data.totalImportado || data.total || 0} produtos sincronizados.`)
      await carregarProdutos() // Recarrega a lista após sincronizar
    } catch (err: any) {
      alert('Erro ao sincronizar: ' + err.message)
    } finally {
      setSincronizando(false)
    }
  }

  const salvarProduto = (form: ProdutoForm, id?: number) => {
    let lista: Produto[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const novoProduto = {
      id: id || -Date.now(),
      codigo: form.codigo,
      nome: form.nome,
      preco: form.preco,
      estoque: { saldoVirtualTotal: form.estoque },
      situacao: form.situacao,
      categoria: form.categoria,
      tags: form.tags,
    }

    if (id) {
      const idx = lista.findIndex(p => p.id === id)
      if (idx >= 0) lista[idx] = novoProduto
    } else {
      lista.push(novoProduto)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    setProdutosCustom(lista)
    setModalAberto(false)
  }

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando produtos...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">📦 Produtos</h1>
            <p className="text-sm text-gray-500 mt-1">{produtos.length} produtos cadastrados</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={sincronizando}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
            >
              <Package className="h-4 w-4" />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button
              onClick={() => { setProdutoEditando(undefined); setModalAberto(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Total Produtos</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{produtos.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Categorias</p>
            <select
              value={categoriaSelecionada}
              onChange={e => { setCategoriaSelecionada(e.target.value); setPagina(1) }}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Todas ({categorias.length})</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Estoque Total</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{totalEstoque} un</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase">Valor em Estoque</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmt(totalValorEstoque)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPagina(1) }}
              placeholder="Buscar por SKU ou nome..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginaAtual.map(prod => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{prod.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{prod.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{prod.categoria || '—'}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{fmt(prod.preco)}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{prod.estoque?.saldoVirtualTotal || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setProdutoEditando(prod); setModalAberto(true) }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button disabled={prod.id > 0} className={`p-2 rounded-lg transition-all ${prod.id > 0 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {pagina} de {totalPaginas}</p>
            <div className="flex gap-2">
              <button onClick={() => irParaPagina(pagina - 1)} disabled={pagina === 1} className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => irParaPagina(pagina + 1)} disabled={pagina === totalPaginas} className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ProdutoModal isOpen={modalAberto} onClose={() => setModalAberto(false)} onSave={salvarProduto} produto={produtoEditando} />
    </div>
  )
}