'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LogOut, Upload, ClipboardList, TrendingUp, Package,
  Search, Filter, Eye, ChevronDown, Store, BarChart3
} from 'lucide-react'

export default function MeusPedidosPage() {
  const router = useRouter()
  const [lojista, setLojista] = useState<{ nome: string; id: string } | null>(null)
  const [lojistaData, setLojistaData] = useState<{ nome: string } | null>(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth) { router.push('/lojista/login'); return }
    const user = JSON.parse(auth)
    if (user.tipo !== 'lojista') { router.push('/lojista/login'); return }
    setLojista(user)
    fetchLojistaData(user.id)
  }, [router])

  const fetchLojistaData = async (id: string) => {
    try {
      const res = await fetch(`/api/lojista/perfil?id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setLojistaData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do lojista:', error)
    }
  }

  const handleLogout = () => { 
    localStorage.removeItem('portal_auth'); 
    router.push('/lojista/login') 
  }
  
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const pedidos = [
    { id: '#PED-20260301', data: '19/05/2026', itens: 24, valor: 1250.00, status: 'Liberado' },
    { id: '#PED-20260300', data: '18/05/2026', itens: 8, valor: 420.00, status: 'Aguardando revisão' },
    { id: '#PED-20260299', data: '18/05/2026', itens: 15, valor: 890.00, status: 'Em leitura por IA' },
    { id: '#PED-20260298', data: '17/05/2026', itens: 32, valor: 2100.00, status: 'Liberado' },
    { id: '#PED-20260297', data: '17/05/2026', itens: 6, valor: 180.00, status: 'Aguardando saldo' },
    { id: '#PED-20260296', data: '16/05/2026', itens: 18, valor: 760.00, status: 'Aguardando revisão' },
    { id: '#PED-20260295', data: '16/05/2026', itens: 10, valor: 520.00, status: 'Enviado / Concluído' },
    { id: '#PED-20260294', data: '15/05/2026', itens: 22, valor: 1850.00, status: 'Nota emitida' },
  ]

  const statusColor = (s: string) => {
    if (s === 'Liberado') return 'bg-green-50 text-green-700'
    if (s === 'Aguardando revisão') return 'bg-amber-50 text-amber-700'
    if (s === 'Em leitura por IA') return 'bg-blue-50 text-blue-700'
    if (s === 'Aguardando saldo') return 'bg-red-50 text-red-700'
    if (s === 'Enviado / Concluído') return 'bg-emerald-50 text-emerald-700'
    return 'bg-gray-50 text-gray-700'
  }

  const filtrados = filtro === 'todos' ? pedidos : pedidos.filter(p => {
    if (filtro === 'pendentes') return p.status === 'Aguardando revisão' || p.status === 'Aguardando saldo'
    if (filtro === 'andamento') return p.status === 'Em leitura por IA' || p.status === 'Liberado'
    if (filtro === 'concluidos') return p.status === 'Enviado / Concluído' || p.status === 'Nota emitida'
    return true
  })

  if (!lojista) return null

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar Unificada */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Store className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Meu Painel</span>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Principal</div>
          <Link href="/lojista/dashboard" className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-all">
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/lojista/meus-pedidos" className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 bg-indigo-50 rounded-xl font-medium transition-all">
            <Package className="h-5 w-5" />
            Meus Pedidos
          </Link>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Logado como</p>
            <p className="font-semibold text-gray-900 truncate">{lojistaData?.nome || lojista.nome}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all">
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Meus Pedidos</h1>
            <p className="text-sm text-gray-500 mt-1">Acompanhe todos os seus pedidos</p>
          </div>
          <Link href="/lojista/subir-pedido"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
            <Upload className="h-4 w-4" /> Novo Pedido
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pendentes', label: '⏳ Pendentes' },
            { key: 'andamento', label: '📄 Em andamento' },
            { key: 'concluidos', label: '✅ Concluídos' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filtro === f.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Pedido</th>
                <th className="text-left py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Data</th>
                <th className="text-left py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Itens</th>
                <th className="text-left py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Valor</th>
                <th className="text-left py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Status</th>
                <th className="text-right py-4 px-8 text-gray-400 font-bold uppercase text-[10px] tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(pedido => (
                <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                  <td className="py-5 px-8 font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{pedido.id}</td>
                  <td className="py-5 px-8 text-gray-500">{pedido.data}</td>
                  <td className="py-5 px-8 text-gray-600">{pedido.itens} itens</td>
                  <td className="py-5 px-8 text-gray-900 font-medium">{fmt(pedido.valor)}</td>
                  <td className="py-5 px-8">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColor(pedido.status)}`}>
                      {pedido.status}
                    </span>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 ml-auto">
                      <Eye className="h-4 w-4" /> Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo */}
        <div className="mt-6 text-sm text-gray-400 flex items-center gap-4 px-2">
          <span>{pedidos.length} pedidos no total</span>
          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
          <span>{fmt(pedidos.reduce((a, p) => a + p.valor, 0))} em pedidos</span>
        </div>
      </main>
    </div>
  )
}