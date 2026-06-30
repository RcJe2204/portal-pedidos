'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import {
  Search, Edit3, ChevronLeft, ChevronRight,
  X, Trash2, AlertTriangle, Plus, RefreshCw
} from 'lucide-react'

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
      // AJUSTE: Chamando a rota que lê do seu banco de dados
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
      // AJUSTE OAUTH: Agora o POST /api/clientes faz a mágica de puxar do Bling
      const res = await fetch('/api/clientes', { 
        method: 'POST'
      })
      
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
    setClienteEdit({
      nome: '', cnpj: '', cidade: '', telefone: '', email: '', situacao: 'A', listaPrecoId: ''
    })
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

  if (carregando) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Carregando lojistas...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👥 Lojistas Cadastrados</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os lojistas do sistema</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSincronizarBling}
              disabled={sincronizando}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar com Bling'}
            </button>
            <button 
              onClick={abrirModalNovo}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Novo Lojista
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between text-red-600 text-sm font-medium">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              {erro}
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPagina(1) }}
              placeholder="Buscar por nome, documento ou e-mail..."
              className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Lojista</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">CPF/CNPJ</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Cidade</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Telefone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">E-mail</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginaAtual.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhum lojista encontrado.</td></tr>
              ) : (
                paginaAtual.map(cli => (
                  <tr key={cli.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{cli.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatCpfCnpj(cli.cnpj)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cli.cidade || '---'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cli.telefone || '---'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cli.email || '---'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${cli.situacao === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cli.situacao === 'A' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => abrirModalEditar(cli)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setClienteSelecionado(cli); setConfirmarExclusao(true); setModalAberto(true); }} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <button onClick={() => irParaPagina(pagina - 1)} disabled={pagina === 1} className="p-2 disabled:opacity-20"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-sm font-medium text-gray-500">Página {pagina} de {totalPaginas}</span>
            <button onClick={() => irParaPagina(pagina + 1)} disabled={pagina === totalPaginas} className="p-2 disabled:opacity-20"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-gray-900">
                {confirmarExclusao ? 'Excluir Lojista' : modoEdicao ? 'Editar Lojista' : 'Novo Lojista'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {confirmarExclusao ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-gray-600 text-sm">Deseja realmente <strong>EXCLUIR</strong> permanentemente o lojista <strong>{clienteSelecionado?.nome}</strong>?</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Lojista</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clienteEdit.nome} onChange={e => setClienteEdit({...clienteEdit, nome: e.target.value})} placeholder="Ex: Livraria Central" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CPF ou CNPJ</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clienteEdit.cnpj} onChange={e => setClienteEdit({...clienteEdit, cnpj: e.target.value})} placeholder="Apenas números" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vincular à Lista de Preço</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none" 
                      value={clienteEdit.listaPrecoId} 
                      onChange={e => setClienteEdit({...clienteEdit, listaPrecoId: e.target.value})}
                    >
                      <option value="">Nenhuma lista vinculada</option>
                      {listasPreco.map(lista => (
                        <option key={lista.id} value={lista.id}>{lista.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cidade</label>
                      <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clienteEdit.cidade} onChange={e => setClienteEdit({...clienteEdit, cidade: e.target.value})} placeholder="Ex: São Paulo" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Situação</label>
                      <select className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none" value={clienteEdit.situacao} onChange={e => setClienteEdit({...clienteEdit, situacao: e.target.value})}>
                        <option value="A">Ativo</option>
                        <option value="I">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Telefone / Celular</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clienteEdit.telefone} onChange={e => setClienteEdit({...clienteEdit, telefone: e.target.value})} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail</label>
                    <input type="email" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={clienteEdit.email} onChange={e => setClienteEdit({...clienteEdit, email: e.target.value})} placeholder="email@exemplo.com" />
                  </div>
                </div>
              )}
              {modalErro && <p className="text-xs text-red-500 mt-4 bg-red-50 p-2 rounded-lg text-center">{modalErro}</p>}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={fecharModal} className="px-4 py-2 text-sm font-bold text-gray-400">Cancelar</button>
              {confirmarExclusao ? (
                <button onClick={excluirCliente} disabled={salvando} className="bg-red-500 text-white px-8 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-200 disabled:opacity-50">Confirmar Exclusão</button>
              ) : (
                <>
                  {modoEdicao && (
                    <button onClick={() => setConfirmarExclusao(true)} className="text-red-500 text-xs font-bold mr-auto">Excluir Lojista</button>
                  )}
                  <button onClick={handleSalvar} disabled={salvando} className="bg-indigo-600 text-white px-8 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 disabled:opacity-50">
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