'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { Search, Edit3, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle, Plus, RefreshCw } from 'lucide-react'

interface Cliente {
  id: number | string
  nome: string
  cnpj?: string
  telefone?: string
  celular?: string
  email?: string
  situacao?: string
  cidade?: string
  listaPrecoId?: string
  origem?: string
}

interface ClienteEdit {
  nome: string
  cnpj: string
  cidade: string
  telefone: string
  email: string
  situacao: string
  listaPrecoId: string
}

interface ListaPreco {
  id: string
  nome: string
}

const ITENS_POR_PAGINA = 30

export default function AdminClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [listasPreco, setListasPreco] = useState<ListaPreco[]>([])
  const [search, setSearch] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteEdit, setClienteEdit] = useState<ClienteEdit>({
    nome: '',
    cnpj: '',
    cidade: '',
    telefone: '',
    email: '',
    situacao: 'A',
    listaPrecoId: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [modalErro, setModalErro] = useState('')
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth || JSON.parse(auth).tipo !== 'admin') {
      router.push('/admin/login')
      return
    }
    carregarDadosIniciais()
  }, [router])

  async function carregarDadosIniciais() {
    try {
      setCarregando(true)
      setErro("")
      await Promise.all([
        carregarClientes(),
        carregarListasPreco()
      ])
    } catch (err: any) {
      setErro("Erro ao carregar dados iniciais")
    } finally {
      setCarregando(false)
    }
  }

  async function carregarListasPreco() {
    try {
      const res = await fetch('/api/admin/listas-preco')
      if (res.ok) {
        const data = await res.json()
        setListasPreco(data || [])
      }
    } catch (err) {
      console.error("Erro ao carregar listas", err)
    }
  }

  async function carregarClientes() {
    try {
      const res = await fetch('/api/clientes')
      if (res.status === 401) {
        setErro("Bling não conectado. Clique em Reconectar para ativar.")
        return
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Falha ao carregar lojistas')
        setClientes(data || [])
        setErro("")
      } else {
        setErro("O servidor de lojistas não respondeu corretamente.")
      }
    } catch (err: any) {
      console.error(err)
      setErro(`Erro: ${err.message}`)
    }
  }

  async function handleSincronizarBling() {
    setSincronizando(true)
    try {
      const res = await fetch('/api/clientes', { method: 'POST' })
      const data = await res.json()
      if (res.status === 401) {
        throw new Error("Bling não conectado. Por favor, clique em Reconectar primeiro.")
      }
      if (!res.ok) throw new Error(data.error || 'Erro na sincronização')
      await carregarClientes()
      alert(`Sincronização concluída! ${data.total || 0} lojistas puxados do Bling.`);
    } catch (err: any) {
      alert('Erro ao sincronizar: ' + err.message)
    } finally {
      setSincronizando(false)
    }
  }

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const paginaAtual = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA)

  const irParaPagina = (p: number) => {
    if (p >= 1 && p <= totalPaginas) setPagina(p)
  }

  const formatCpfCnpj = (v?: string) => {
    if (!v || v === '---' || v === '') return '—'
    const digits = v.replace(/\D/g, '')
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    return v
  }

  const abrirModalNovo = () => {
    setModoEdicao(false)
    setClienteSelecionado(null)
    setClienteEdit({ nome: '', cnpj: '', cidade: '', telefone: '', email: '', situacao: 'A', listaPrecoId: '' })
    setModalErro('')
    setConfirmarExclusao(false)
    setModalAberto(true)
  }

  const abrirModalEditar = (cli: Cliente) => {
    setModoEdicao(true)
    setClienteSelecionado(cli)
    setClienteEdit({
      nome: cli.nome || '',
      cnpj: cli.cnpj || '',
      cidade: cli.cidade || '',
      telefone: cli.telefone || cli.celular || '',
      email: cli.email || '',
      situacao: cli.situacao || 'A',
      listaPrecoId: cli.listaPrecoId || ''
    })
    setModalErro('')
    setConfirmarExclusao(false)
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setClienteSelecionado(null)
    setModalErro('')
  }

  async function handleSalvar() {
    if (!clienteEdit.nome.trim()) {
      setModalErro('O nome é obrigatório.')
      return
    }
    setSalvando(true)
    try {
      const url = modoEdicao ? `/api/clientes/${clienteSelecionado?.id}` : '/api/clientes'
      const method = modoEdicao ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteEdit),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      fecharModal()
      await carregarClientes()
    } catch (err: any) {
      setModalErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCliente() {
    if (!clienteSelecionado) return
    setSalvando(true)
    try {
      const res = await fetch(`/api/clientes/${clienteSelecionado.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      fecharModal()
      await carregarClientes()
    } catch (err: any) {
      setModalErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <div className="p-10 text-center">Carregando lojistas...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            👥 Lojistas Cadastrados
          </h1>
          <p className="text-gray-500 text-sm">Gerencie os lojistas do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSincronizarBling}
            disabled={sincronizando}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar com Bling'}
          </button>
          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Lojista
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">{erro}</span>
          </div>
          {erro.includes("Bling não conectado") && (
            <button
              onClick={() => window.location.href = '/api/bling/auth'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
            >
              Reconectar Bling
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagina(1) }}
              placeholder="Buscar por nome, documento ou e-mail..."
              className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Lojista</th>
                <th className="px-6 py-4">CPF/CNPJ</th>
                <th className="px-6 py-4">Cidade</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginaAtual.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    Nenhum lojista encontrado.
                  </td>
                </tr>
              ) : (
                paginaAtual.map(cli => (
                  <tr key={cli.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-700">{cli.nome}</td>
                    <td className="px-6 py-4 text-gray-500">{formatCpfCnpj(cli.cnpj)}</td>
                    <td className="px-6 py-4 text-gray-500">{cli.cidade || '---'}</td>
                    <td className="px-6 py-4 text-gray-500">{cli.telefone || '---'}</td>
                    <td className="px-6 py-4 text-gray-500">{cli.email || '---'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${cli.situacao === 'A' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {cli.situacao === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => abrirModalEditar(cli)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setClienteSelecionado(cli); setConfirmarExclusao(true); setModalAberto(true); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
            <button
              onClick={() => irParaPagina(pagina - 1)}
              disabled={pagina === 1}
              className="p-2 disabled:opacity-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">
              Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <button
              onClick={() => irParaPagina(pagina + 1)}
              disabled={pagina === totalPaginas}
              className="p-2 disabled:opacity-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {confirmarExclusao ? 'Excluir Lojista' : modoEdicao ? 'Editar Lojista' : 'Novo Lojista'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {confirmarExclusao ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-gray-600 mb-2">Deseja realmente EXCLUIR permanentemente o lojista <strong>{clienteSelecionado?.nome}</strong>?</p>
                  <p className="text-red-500 text-xs font-medium">Esta ação não pode ser desfeita.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Lojista</label>
                    <input
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={clienteEdit.nome}
                      onChange={e => setClienteEdit({ ...clienteEdit, nome: e.target.value })}
                      placeholder="Ex: Livraria Central"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">CPF ou CNPJ</label>
                    <input
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={clienteEdit.cnpj}
                      onChange={e => setClienteEdit({ ...clienteEdit, cnpj: e.target.value })}
                      placeholder="Apenas números"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vincular à Lista de Preço</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={clienteEdit.listaPrecoId}
                      onChange={e => setClienteEdit({ ...clienteEdit, listaPrecoId: e.target.value })}
                    >
                      <option value="">Nenhuma lista vinculada</option>
                      {listasPreco.map(lista => (
                        <option key={lista.id} value={lista.id}>{lista.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cidade</label>
                    <input
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={clienteEdit.cidade}
                      onChange={e => setClienteEdit({ ...clienteEdit, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Situação</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={clienteEdit.situacao}
                      onChange={e => setClienteEdit({ ...clienteEdit, situacao: e.target.value })}
                    >
                      <option value="A">Ativo</option>
                      <option value="I">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefone / Celular</label>
                    <input
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={clienteEdit.telefone}
                      onChange={e => setClienteEdit({ ...clienteEdit, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
                    <input
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={clienteEdit.email}
                      onChange={e => setClienteEdit({ ...clienteEdit, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              )}

              {modalErro && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                  {modalErro}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-gray-500 font-semibold hover:text-gray-700 transition-all"
              >
                Cancelar
              </button>
              {confirmarExclusao ? (
                <button
                  onClick={excluirCliente}
                  disabled={salvando}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {salvando ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              ) : (
                <>
                  {modoEdicao && (
                    <button
                      onClick={() => setConfirmarExclusao(true)}
                      className="text-red-500 text-xs font-bold mr-auto"
                    >
                      Excluir Lojista
                    </button>
                  )}
                  <button
                    onClick={handleSalvar}
                    disabled={salvando}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    {salvando ? 'Processando...' : modoEdicao ? 'Salvar Alterações' : 'Criar Lojista'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}