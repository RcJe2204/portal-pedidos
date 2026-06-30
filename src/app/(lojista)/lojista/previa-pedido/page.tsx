'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, Upload, ClipboardList, TrendingUp, Package,
  CheckCircle, AlertTriangle, Download, Search, Plus, Minus, Trash2, Save
} from 'lucide-react'

export default function PreviaPedidoPage() {
  const router = useRouter()
  const [lojista, setLojista] = useState<{ nome: string; id: string } | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth) { router.push('/lojista/login'); return }
    const user = JSON.parse(auth)
    if (user.tipo !== 'lojista') { router.push('/lojista/login'); return }
    setLojista(user)
  }, [router])

  const handleLogout = () => { localStorage.removeItem('portal_auth'); router.push('/lojista/login') }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const [itens, setItens] = useState([
    { sku: 'BIB-001', produto: 'Bíblia Sagrada Capa Dura', qtd: 10, preco: 45.90, confianca: 98 },
    { sku: 'BIB-002', produto: 'Bíblia de Estudo', qtd: 5, preco: 89.90, confianca: 95 },
    { sku: 'TER-001', produto: 'Terço Nossa Senhora', qtd: 15, preco: 12.50, confianca: 45 },
    { sku: 'IMA-001', produto: 'Imagem São Miguel Arcanjo 20cm', qtd: 3, preco: 79.90, confianca: 30 },
    { sku: 'LIV-001', produto: 'Livro Imitação de Cristo', qtd: 8, preco: 29.90, confianca: 92 },
  ])

  const alterarQtd = (idx: number, delta: number) => {
    setItens(itens.map((item, i) => 
      i === idx ? { ...item, qtd: Math.max(0, item.qtd + delta) } : item
    ))
  }

  const removerItem = (idx: number) => {
    setItens(itens.filter((_, i) => i !== idx))
  }

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">🔍 Revisar Pedido</h1>
              <span className="bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">#PED-20260301</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Confira os itens extraídos do PDF e faça correções antes de aprovar</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <Download className="h-4 w-4" /> Ver PDF
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <Save className="h-4 w-4" /> Aprovar Pedido
            </button>
          </div>
        </div>

        {/* Alerta de baixa confiança */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">⚠️ Alguns itens têm baixa confiança na leitura</p>
            <p className="text-sm text-amber-700 mt-0.5">2 itens foram identificados com confiança abaixo de 50%. Revise as quantidades manualmente.</p>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-5 text-gray-500 font-medium">SKU</th>
                <th className="text-left py-4 px-5 text-gray-500 font-medium">Produto</th>
                <th className="text-center py-4 px-5 text-gray-500 font-medium">Qtd</th>
                <th className="text-right py-4 px-5 text-gray-500 font-medium">Preço Unit.</th>
                <th className="text-right py-4 px-5 text-gray-500 font-medium">Total</th>
                <th className="text-center py-4 px-5 text-gray-500 font-medium">Confiança</th>
                <th className="text-right py-4 px-5 text-gray-500 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => (
                <tr key={item.sku} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  item.confianca < 50 ? 'bg-amber-50/50' : ''
                }`}>
                  <td className="py-3 px-5 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="py-3 px-5 font-medium text-gray-900">{item.produto}</td>
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => alterarQtd(idx, -1)} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                        <Minus className="h-3 w-3 text-gray-500" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.qtd}</span>
                      <button onClick={() => alterarQtd(idx, 1)} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                        <Plus className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right text-gray-700">{fmt(item.preco)}</td>
                  <td className="py-3 px-5 text-right font-medium text-gray-900">{fmt(item.qtd * item.preco)}</td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.confianca >= 80 ? 'bg-green-50 text-green-700' :
                      item.confianca >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {item.confianca}%
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button onClick={() => removerItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo + Ações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">📝 Observações</h3>
            <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4} placeholder="Adicione observações para o pedido (opcional)..." />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">💰 Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Itens</span>
                <span className="text-gray-900 font-medium">{itens.reduce((a, i) => a + i.qtd, 0)} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Produtos diferentes</span>
                <span className="text-gray-900 font-medium">{itens.length}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base">
                <span className="text-gray-700 font-medium">Valor total</span>
                <span className="text-gray-900 font-bold">{fmt(itens.reduce((a, i) => a + (i.qtd * i.preco), 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}