'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, Upload, ClipboardList, TrendingUp, Package,
  Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
  Download, ChevronLeft, ChevronRight, CreditCard
} from 'lucide-react'

export default function SaldoExtratoPage() {
  const router = useRouter()
  const [lojista, setLojista] = useState<{ nome: string; id: string } | null>(null)
  const [mesSelecionado, setMesSelecionado] = useState('05/2026')

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth) { router.push('/lojista/login'); return }
    const user = JSON.parse(auth)
    if (user.tipo !== 'lojista') { router.push('/lojista/login'); return }
    setLojista(user)
  }, [router])

  const handleLogout = () => { localStorage.removeItem('portal_auth'); router.push('/lojista/login') }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const movimentacoes = [
    { data: '19/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260301', tipo: 'entrada', valor: 1250.00 },
    { data: '18/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260298', tipo: 'entrada', valor: 2100.00 },
    { data: '17/05/2026', descricao: 'Taxa de processamento', tipo: 'saida', valor: 25.00 },
    { data: '16/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260296', tipo: 'entrada', valor: 760.00 },
    { data: '15/05/2026', descricao: 'Estorno — Pedido #PED-20260294 (item avariado)', tipo: 'saida', valor: 185.00 },
    { data: '14/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260293', tipo: 'entrada', valor: 520.00 },
    { data: '13/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260291', tipo: 'entrada', valor: 1890.00 },
    { data: '12/05/2026', descricao: 'Taxa mensal de plataforma', tipo: 'saida', valor: 97.00 },
    { data: '11/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260289', tipo: 'entrada', valor: 340.00 },
    { data: '10/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260287', tipo: 'entrada', valor: 1100.00 },
    { data: '09/05/2026', descricao: 'Depósito — Adição de saldo', tipo: 'entrada', valor: 5000.00 },
    { data: '08/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260285', tipo: 'entrada', valor: 670.00 },
    { data: '07/05/2026', descricao: 'Taxa de processamento', tipo: 'saida', valor: 18.50 },
    { data: '06/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260283', tipo: 'entrada', valor: 920.00 },
    { data: '05/05/2026', descricao: 'Pagamento recebido — Pedido #PED-20260281', tipo: 'entrada', valor: 450.00 },
  ]

  const entradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((a, m) => a + m.valor, 0)
  const saidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((a, m) => a + m.valor, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Meu Painel</h2>
          </div>
          <p className="text-xs text-gray-400 ml-8">{lojista?.nome || 'Lojista'}</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a href="/lojista/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
            <TrendingUp className="h-5 w-5" /> Dashboard
          </a>
          <a href="/lojista/subir-pedido" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
            <Upload className="h-5 w-5" /> Subir Pedido
          </a>
          <a href="/lojista/meus-pedidos" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
            <ClipboardList className="h-5 w-5" /> Meus Pedidos
          </a>
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all mt-auto">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">💰 Saldo & Extrato</h1>
            <p className="text-sm text-gray-500 mt-1">Acompanhe seu saldo e movimentações financeiras</p>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar extrato
          </button>
        </div>

        {/* Cards de Saldo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-indigo-100 text-sm">Saldo Disponível</p>
            <p className="text-3xl font-bold mt-1">{fmt(1250.00)}</p>
            <p className="text-indigo-200 text-xs mt-2">Atualizado em 19/05/2026</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Entradas no mês</p>
            <p className="text-2xl font-bold text-green-600 mt-1 flex items-center gap-2">
              {fmt(entradas)}
              <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +32%
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Comparado a abril/2026</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Saídas no mês</p>
            <p className="text-2xl font-bold text-red-600 mt-1 flex items-center gap-2">
              {fmt(saidas)}
              <span className="text-xs bg-red-50 text-red-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3" /> +5%
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Taxas e estornos</p>
          </div>
        </div>

        {/* Extrato */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">📋 Movimentações</h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-4 w-4 text-gray-500" /></button>
              <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">{mesSelecionado}</span>
              <button className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="h-4 w-4 text-gray-500" /></button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-5 text-gray-500 font-medium">Data</th>
                <th className="text-left py-4 px-5 text-gray-500 font-medium">Descrição</th>
                <th className="text-right py-4 px-5 text-gray-500 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-5 text-gray-500">{mov.data}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mov.tipo === 'entrada' 
                          ? <ArrowUpRight className={`h-4 w-4 ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`} />
                          : <ArrowDownRight className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <span className="text-gray-700">{mov.descricao}</span>
                    </div>
                  </td>
                  <td className={`py-3.5 px-5 text-right font-medium ${
                    mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{fmt(mov.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Adicionar saldo */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Quer adicionar saldo?</p>
              <p className="text-sm text-gray-500">Envie um comprovante de pagamento para o financeiro</p>
            </div>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            <Upload className="h-4 w-4" /> Enviar comprovante
          </button>
        </div>
      </main>
    </div>
  )
}