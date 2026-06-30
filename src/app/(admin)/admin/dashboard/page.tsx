'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, TrendingUp, Package, BarChart3, Users, 
  ClipboardList, Settings, DollarSign, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ShoppingBag
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ nome: string; id: string } | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth) { router.push('/admin/login'); return }
    const user = JSON.parse(auth)
    if (user.tipo !== 'admin') { router.push('/admin/login'); return }
    setAdmin(user)
  }, [router])

  const handleLogout = () => { localStorage.removeItem('portal_auth'); router.push('/admin/login') }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtNum = (v: number) => v.toLocaleString('pt-BR')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main */}
      <main className="p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">📊 Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Visão geral da operação</p>
          </div>
          <span className="text-xs text-gray-400">19 de maio de 2026</span>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12%
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pedidos Hoje</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(847)}</p>
            <p className="text-xs text-gray-400 mt-1">142 há 1h</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendentes</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Aguardando Revisão</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{fmtNum(38)}</p>
            <p className="text-xs text-gray-400 mt-1">12 com saldo insuficiente</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +5%
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Clientes Ativos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(156)}</p>
            <p className="text-xs text-gray-400 mt-1">8 novos esse mês</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +18%
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Faturamento Hoje</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(84750.00)}</p>
            <p className="text-xs text-gray-400 mt-1">Meta: {fmt(120000.00)}</p>
          </div>
        </div>

        {/* Cards auxiliares */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Recargas Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{fmtNum(23)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-700">{fmt(18450.00)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)' }}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Pedidos para Revisar</p>
                <p className="text-xs text-gray-500">38 pedidos aguardando aprovação</p>
              </div>
            </div>
            <button onClick={() => router.push('/admin/pedidos')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm">
              Revisar
            </button>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 Últimos Pedidos</h2>
            <a href="/admin/pedidos" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Ver todos →
            </a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-gray-500 font-medium">Pedido</th>
                <th className="text-left py-3 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-3 text-gray-500 font-medium">Data</th>
                <th className="text-left py-3 text-gray-500 font-medium">Valor</th>
                <th className="text-left py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '#PED-20260301', cliente: 'Casa Católica - Matriz', data: '19/05/2026', valor: 1250.00, status: 'Liberado' as const },
                { id: '#PED-20260300', cliente: 'Casa Católica - Filial', data: '19/05/2026', valor: 3420.00, status: 'Aguardando revisão' as const },
                { id: '#PED-20260299', cliente: 'Loja Online', data: '18/05/2026', valor: 890.00, status: 'Em leitura por IA' as const },
                { id: '#PED-20260298', cliente: 'Mercado Livre', data: '18/05/2026', valor: 2100.00, status: 'Liberado' as const },
                { id: '#PED-20260297', cliente: 'Casa Católica - Matriz', data: '17/05/2026', valor: 5400.00, status: 'Aguardando saldo' as const },
                { id: '#PED-20260296', cliente: 'Shopee', data: '17/05/2026', valor: 180.00, status: 'Concluído' as const },
              ].map(pedido => {
                const statusColor = {
                  'Liberado': 'bg-green-50 text-green-700',
                  'Aguardando revisão': 'bg-amber-50 text-amber-700',
                  'Em leitura por IA': 'bg-blue-50 text-blue-700',
                  'Aguardando saldo': 'bg-red-50 text-red-700',
                  'Concluído': 'bg-gray-100 text-gray-600',
                }[pedido.status]
                return (
                  <tr key={pedido.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{pedido.id}</td>
                    <td className="py-3 text-gray-500">{pedido.cliente}</td>
                    <td className="py-3 text-gray-500">{pedido.data}</td>
                    <td className="py-3 text-gray-900 font-medium">{fmt(pedido.valor)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {pedido.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}