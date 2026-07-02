'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import ProdutoModal from '@/components/ProdutoModal'

interface Produto {
  id: any
  codigo: string
  nome: string
  preco: number
  estoque: { saldoVirtualTotal: number }
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

export default function AdminProdutosPage() {
  const router = useRouter()
  const [produtosBling, setProdutosBling] = useState<Produto[]>([])
  const [search, setSearch] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>()
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [sincronizando, setSincronizando] = useState(false)

  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/produtos')
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setProdutosBling(data)
    } catch (err) {
      console.error(err)
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
    carregarProdutos()
  }, [router, carregarProdutos])

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

  const listaFiltrada = produtosBling.filter(p => {
    const matchesSearch = p.codigo?.toLowerCase().includes(search.toLowerCase()) || 
                         p.nome?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoriaSelecionada === '' || p.categoria === categoriaSelecionada
    return matchesSearch && matchesCategory
  })

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const paginaAtual = listaFiltrada.slice(inicio, inicio + ITENS_POR_PAGINA)
  const categorias = [...new Set(produtosBling.map(p => p.categoria).filter(Boolean))] as string[]

  const totalEstoque = produtosBling.reduce((acc, p) => acc + (p.estoque?.saldoVirtualTotal || 0), 0)
  const totalValorEstoque = produtosBling.reduce((acc, p) => acc + (p.preco || 0) * (p.estoque?.saldoVirtualTotal || 0), 0)

  const handleSync = async () => {
    setSincronizando(true)
    try {
      const res = await fetch('/api/admin/produtos', { method: 'POST' })
      if (!res.ok) throw new Error('Falha na sincronização')
      alert('Sincronização concluída com sucesso!')
      carregarProdutos()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSincronizando(false)
    }
  }

  const salvarProduto = async (form: ProdutoForm, id?: any) => {
    try {
      const res = await fetch('/api/admin/produtos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form })
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      alert('Produto atualizado!')
      setModalAberto(false)
      carregarProdutos()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (carregando) return <div className="p-8 text-center">Carregando produtos...</div>

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Produtos
          </h1>
          <p className="text-sm text-gray-500">{produtosBling.length} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={sincronizando} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${sincronizando ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button onClick={() => { setProdutoEditando(undefined); setModalAberto(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all">
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Produtos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{produtosBling.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Categorias</p>
          <select value={categoriaSelecionada} onChange={(e) => { setCategoriaSelecionada(e.target.value); setPagina(1) }} className="w-full mt-1 text-sm border-none p-0 focus:ring-0 bg-transparent font-bold text-gray-900">
            <option value="">Todas ({categorias.length})</option>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalEstoque} un</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor em Estoque</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalValorEstoque)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPagina(1) }} placeholder="Buscar por SKU ou nome..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginaAtual.map(prod => (
                <tr key={prod.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{prod.codigo}</td>
                  <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900">{prod.nome}</p></td>
                  <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{prod.categoria || '—'}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{fmt(prod.preco)}</td>
                  <td className="px-6 py-4"><span className={`text-sm font-medium ${prod.estoque?.saldoVirtualTotal <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{prod.estoque?.saldoVirtualTotal || 0}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setProdutoEditando(prod); setModalAberto(true) }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
          <p className="text-sm text-gray-500">Página {pagina} de {totalPaginas}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"><ChevronLeft size={18} /></button>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
      {modalAberto && <ProdutoModal isOpen={modalAberto} onClose={() => setModalAberto(false)} onSave={salvarProduto} produto={produtoEditando} />}
    </div>
  )
}