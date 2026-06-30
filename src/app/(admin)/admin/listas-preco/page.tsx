'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, Save, Edit3, Trash2, DollarSign, ArrowLeft, Shield, Loader2
} from 'lucide-react'

interface Lojista {
  id: string
  nome: string
}

interface ListaPreco {
  id: string
  nome: string
  precosPorCategoria: Record<string, number>
  lojistas: Lojista[] 
  lojistasVinculados: string[] 
}

const STORAGE_KEY_PRODUTOS = 'portal_produtos_custom'
const STORAGE_KEY_RESTRICOES = 'portal_restricoes_categorias'

function parseJsonSafe(valor: any, fallback: any = {}) {
  if (typeof valor === 'object' && valor !== null) return valor
  try {
    return JSON.parse(valor || '{}')
  } catch {
    return fallback
  }
}

export default function ListasPrecoPage() {
  const router = useRouter()

  const [listas, setListas] = useState<ListaPreco[]>([])
  const [lojistas, setLojistas] = useState<Lojista[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loadingLojistas, setLoadingLojistas] = useState(true)
  const [loadingListas, setLoadingListas] = useState(true)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeLista, setNomeLista] = useState('')
  const [precosForm, setPrecosForm] = useState<Record<string, string>>({})
  const [lojistasSelecionados, setLojistasSelecionados] = useState<string[]>([])

  const [restricoes, setRestricoes] = useState<Record<string, string[]>>({})
  const [modalRestricoesAberto, setModalRestricoesAberto] = useState(false)
  const [lojistaRestricaoAtual, setLojistaRestricaoAtual] = useState('')
  const [categoriasPermitidas, setCategoriasPermitidas] = useState<string[]>([])

  // Busca na rota correta de clientes
  const fetchLojistas = async () => {
    try {
      setLoadingLojistas(true)
      const res = await fetch('/api/clientes') 
      if (!res.ok) throw new Error('Erro ao buscar lojistas')
      const data = await res.json()
      setLojistas(data)
    } catch (err) {
      console.error('Erro ao carregar lojistas:', err)
    } finally {
      setLoadingLojistas(false)
    }
  }

  const fetchListas = async () => {
    try {
      setLoadingListas(true)
      const res = await fetch('/api/lista-preco')
      if (!res.ok) throw new Error('Erro ao buscar listas')
      const data = await res.json()
      
      const listasParseadas: ListaPreco[] = data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        precosPorCategoria: parseJsonSafe(item.precosPorCategoria, {}),
        lojistas: item.lojistas || [], 
        lojistasVinculados: parseJsonSafe(item.lojistasVinculados, []),
      }))
      setListas(listasParseadas)
    } catch (err) {
      console.error('Erro ao carregar listas:', err)
    } finally {
      setLoadingListas(false)
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth || JSON.parse(auth).tipo !== 'admin') {
      router.push('/admin/login')
      return
    }

    const savedRestricoes = localStorage.getItem(STORAGE_KEY_RESTRICOES)
    if (savedRestricoes) setRestricoes(JSON.parse(savedRestricoes))

    carregarCategorias()
    fetchLojistas()
    fetchListas()
  }, [router])

  function carregarCategorias() {
    const produtosSalvos = localStorage.getItem(STORAGE_KEY_PRODUTOS)
    if (produtosSalvos) {
      const produtos = JSON.parse(produtosSalvos)
      const cats = [...new Set(produtos.map((p: any) => p.categoria).filter(Boolean))] as string[]
      setCategorias(cats)
    }
  }

  function abrirRestricoes(lojistaNome: string) {
    setLojistaRestricaoAtual(lojistaNome)
    setCategoriasPermitidas(restricoes[lojistaNome] || [])
    carregarCategorias()
    setModalRestricoesAberto(true)
  }

  function salvarRestricoes() {
    const novas = { ...restricoes, [lojistaRestricaoAtual]: categoriasPermitidas }
    if (categoriasPermitidas.length === 0) {
      delete novas[lojistaRestricaoAtual]
    }
    setRestricoes(novas)
    localStorage.setItem(STORAGE_KEY_RESTRICOES, JSON.stringify(novas))
    setModalRestricoesAberto(false)
    alert(`Restrições salvas para ${lojistaRestricaoAtual}!`)
  }

  function toggleCategoriaRestricao(cat: string) {
    setCategoriasPermitidas(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  const abrirNovaLista = () => {
    setEditandoId(null)
    setNomeLista('')
    setPrecosForm({})
    setLojistasSelecionados([])
    setModalAberto(true)
  }

  const abrirEditarLista = (lista: ListaPreco) => {
    setEditandoId(lista.id)
    setNomeLista(lista.nome)
    setLojistasSelecionados(lista.lojistas.map(l => l.id))

    const precos: Record<string, string> = {}
    categorias.forEach(cat => {
      precos[cat] = lista.precosPorCategoria[cat]?.toString() || ''
    })
    setPrecosForm(precos)
    setModalAberto(true)
  }

  const salvarLista = async () => {
    if (!nomeLista.trim()) {
      alert('Digite um nome para a lista.')
      return
    }

    const precosPorCategoria: Record<string, number> = {}
    Object.entries(precosForm).forEach(([cat, val]) => {
      if (val) precosPorCategoria[cat] = parseFloat(val) || 0
    })

    try {
      const payload = {
        nome: nomeLista.trim(),
        precosPorCategoria: JSON.stringify(precosPorCategoria),
        lojistasVinculadosIds: lojistasSelecionados, 
        lojistasVinculados: JSON.stringify(lojistasSelecionados),
      }

      const url = editandoId ? `/api/lista-preco?id=${editandoId}` : '/api/lista-preco'
      const method = editandoId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Erro ao salvar lista')
        return
      }

      setModalAberto(false)
      await fetchListas()
      alert('Lista salva com sucesso!')
    } catch (err) {
      alert('Erro de conexão ao salvar lista.')
    }
  }

  const excluirLista = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return

    try {
      const res = await fetch(`/api/lista-preco?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Erro ao excluir lista')
        return
      }

      await fetchListas()
    } catch (err) {
      alert('Erro de conexão ao excluir lista.')
    }
  }

  const nomesLojistasVinculados = (lista: ListaPreco) => {
    if (lista.lojistas && lista.lojistas.length > 0) {
      return lista.lojistas.map(l => l.nome).join(', ')
    }
    return 'Nenhum lojista vinculado'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/dashboard')} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">💰 Listas de Preço</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie as listas de preço por categoria e vincule aos lojistas</p>
            </div>
          </div>
          <button
            onClick={abrirNovaLista}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Nova Lista de Preço
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-indigo-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Restrições por Lojista</h2>
                <p className="text-sm text-gray-500">Defina quais categorias cada lojista pode vender</p>
              </div>
            </div>
          </div>

          {loadingLojistas ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
              <Loader2 className="animate-spin h-4 w-4" /> Carregando lojistas...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {lojistas.map(loj => {
                const temRestricao = !!restricoes[loj.nome]
                const qtdCats = restricoes[loj.nome]?.length || 0
                return (
                  <button
                    key={loj.id}
                    onClick={() => abrirRestricoes(loj.nome)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                      temRestricao
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{loj.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      temRestricao ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {temRestricao ? `${qtdCats} cats` : 'Todas'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {loadingListas ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm p-12">
            <Loader2 className="animate-spin h-5 w-5" /> Carregando listas...
          </div>
        ) : listas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Nenhuma lista de preço cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listas.map(lista => (
              <div key={lista.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lista.nome}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Vinculada a: <strong>{nomesLojistasVinculados(lista)}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditarLista(lista)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => excluirLista(lista.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(lista.precosPorCategoria).map(([categoria, preco]) => (
                    <div key={categoria} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                      <span className="text-gray-600">{categoria}</span>
                      <span className="font-medium text-indigo-600">
                        {preco?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editandoId ? '✏️ Editar Lista' : '➕ Nova Lista de Preço'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Lista</label>
                <input
                  type="text"
                  value={nomeLista}
                  onChange={e => setNomeLista(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Lista Premium..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lojistas vinculados</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {lojistas.map(loj => (
                    <label key={loj.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={lojistasSelecionados.includes(loj.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setLojistasSelecionados([...lojistasSelecionados, loj.id])
                          } else {
                            setLojistasSelecionados(lojistasSelecionados.filter(id => id !== loj.id))
                          }
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{loj.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preços por Categoria</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categorias.map(cat => (
                    <div key={cat} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium flex-1">{cat}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={precosForm[cat] || ''}
                          onChange={e => setPrecosForm({ ...precosForm, [cat]: e.target.value })}
                          className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm text-right outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvarLista} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                <Save className="h-4 w-4" /> Salvar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRestricoesAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">🛡️ Restrições — {lojistaRestricaoAtual}</h3>
              <button onClick={() => setModalRestricoesAberto(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categorias.map(cat => (
                <label key={cat} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${categoriasPermitidas.includes(cat) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={categoriasPermitidas.includes(cat)} onChange={() => toggleCategoriaRestricao(cat)} className="rounded text-indigo-600" />
                  <span className="text-sm text-gray-700 font-medium flex-1">{cat}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setModalRestricoesAberto(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvarRestricoes} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                <Save className="h-4 w-4" /> Salvar Restrições
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}