'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, Upload, ClipboardList, TrendingUp, Wallet, 
  Clock, CheckCircle, Package, BarChart3,
  ArrowUpRight, ArrowDownRight, Plus, Eye, FileUp,
  X, Download, AlertCircle, Check
} from 'lucide-react'

interface TooltipData {
  values: Array<{ metric: string; value: number }>
  label: string
  x: number
  y: number
}

interface DadosDiarios {
  compras: number[]
  pedidos: number[]
  itens: number[]
  unidades: number[]
}

export default function LojistaDashboardPage() {
  const router = useRouter()
  const [lojista, setLojista] = useState<{ nome: string; id: string } | null>(null)
  const [lojaSelecionada, setLojaSelecionada] = useState('todas')
  const [periodoSelecionado, setPeriodoSelecionado] = useState('hoje')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [metricasAtivas, setMetricasAtivas] = useState({
    compras: true,
    pedidos: true,
    itens: false,
    unidades: false,
  })
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [modalRecarga, setModalRecarga] = useState(false)
  const [modalSubir, setModalSubir] = useState(false)
  const [modalExtrato, setModalExtrato] = useState(false)
  const [valorRecarga, setValorRecarga] = useState('')
  const [recargaSucesso, setRecargaSucesso] = useState(false)
  const [extratoFiltro, setExtratoFiltro] = useState('todas')
  const [comprovanteNome, setComprovanteNome] = useState('')

  const svgRef = useRef<SVGSVGElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (!auth) { router.push('/lojista/login'); return }
    const user = JSON.parse(auth)
    if (user.tipo !== 'lojista') { router.push('/lojista/login'); return }
    setLojista(user)
  }, [router])

  const handleLogout = () => { localStorage.removeItem('portal_auth'); router.push('/lojista/login') }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtNum = (v: number) => v.toLocaleString('pt-BR')

  const lojas = [
    { id: 'todas', nome: 'Todas as lojas' },
    { id: 'matriz', nome: 'Casa Católica - Matriz' },
    { id: 'filial', nome: 'Casa Católica - Filial Centro' },
    { id: 'online', nome: 'Casa Católica - Loja Online' },
    { id: 'mercadolivre', nome: 'Mercado Livre' },
  ]

  const dadosPorLoja: Record<string, { diario: DadosDiarios }> = {
    todas: {
      diario: { compras: [438, 520, 380, 610, 490, 320, 280, 510, 440, 380, 560, 470, 350, 290, 530, 460, 390, 580, 500, 370, 310, 550, 480, 410, 600, 520, 400, 340, 570, 490, 420], pedidos: [9, 11, 7, 14, 10, 6, 5, 12, 9, 8, 13, 10, 7, 6, 11, 9, 8, 12, 10, 7, 6, 11, 10, 8, 13, 11, 8, 7, 12, 10, 9], itens: [23, 28, 18, 35, 25, 15, 12, 30, 22, 20, 33, 26, 18, 14, 28, 24, 20, 32, 26, 18, 15, 29, 25, 21, 34, 28, 20, 16, 30, 26, 22], unidades: [34, 42, 27, 52, 38, 22, 18, 45, 33, 30, 50, 39, 27, 21, 42, 36, 30, 48, 39, 27, 23, 44, 38, 32, 51, 42, 30, 24, 45, 39, 33] },
    },
    matriz: {
      diario: { compras: [180, 210, 150, 250, 200, 130, 110, 220, 180, 160, 240, 190, 140, 120, 230, 200, 170, 260, 210, 150, 130, 240, 190, 170, 250, 220, 160, 140, 260, 210, 180], pedidos: [4, 5, 3, 6, 5, 3, 2, 5, 4, 4, 6, 5, 3, 3, 5, 4, 4, 6, 5, 3, 3, 5, 4, 4, 6, 5, 3, 3, 6, 5, 4], itens: [10, 12, 8, 15, 12, 7, 6, 13, 10, 9, 14, 11, 8, 7, 12, 10, 9, 14, 12, 8, 7, 13, 11, 10, 15, 12, 9, 7, 14, 12, 10], unidades: [15, 18, 12, 23, 18, 11, 9, 20, 15, 14, 21, 17, 12, 10, 18, 15, 14, 21, 18, 12, 11, 20, 17, 15, 23, 18, 14, 11, 21, 18, 15] },
    },
    filial: {
      diario: { compras: [120, 140, 100, 170, 140, 90, 80, 150, 120, 110, 160, 130, 100, 85, 155, 135, 115, 175, 145, 105, 90, 165, 130, 115, 170, 140, 110, 95, 175, 145, 120], pedidos: [3, 3, 2, 4, 3, 2, 2, 3, 3, 2, 4, 3, 2, 2, 3, 3, 2, 4, 3, 2, 2, 4, 3, 3, 4, 3, 2, 2, 4, 3, 3], itens: [7, 8, 5, 10, 8, 5, 4, 9, 7, 6, 10, 8, 5, 4, 9, 7, 6, 10, 8, 5, 4, 9, 8, 7, 10, 8, 6, 5, 10, 8, 7], unidades: [11, 12, 8, 15, 12, 7, 6, 14, 11, 9, 15, 12, 8, 6, 14, 11, 9, 15, 12, 8, 7, 14, 12, 10, 15, 12, 9, 7, 15, 12, 10] },
    },
    online: {
      diario: { compras: [150, 170, 130, 190, 160, 100, 90, 180, 140, 130, 185, 155, 115, 100, 175, 145, 125, 195, 165, 120, 105, 180, 155, 140, 200, 170, 135, 115, 185, 155, 130], pedidos: [3, 4, 3, 5, 4, 2, 2, 4, 3, 3, 5, 4, 3, 2, 4, 3, 3, 5, 4, 3, 2, 4, 4, 3, 5, 4, 3, 2, 5, 4, 3], itens: [8, 10, 7, 12, 10, 6, 5, 11, 8, 8, 12, 9, 7, 5, 10, 8, 7, 12, 10, 7, 6, 11, 10, 8, 13, 11, 8, 6, 12, 10, 8], unidades: [12, 15, 10, 18, 15, 9, 7, 16, 12, 11, 17, 13, 10, 8, 15, 12, 11, 18, 15, 10, 9, 17, 15, 12, 19, 16, 12, 10, 18, 15, 12] },
    },
    mercadolivre: {
      diario: { compras: Array.from({ length: 31 }, () => 0), pedidos: Array.from({ length: 31 }, () => 0), itens: Array.from({ length: 31 }, () => 0), unidades: Array.from({ length: 31 }, () => 0) },
    },
  }

  const isPersonalizado = periodoSelecionado === 'personalizado'
  const dataHoje = '19/05/2026'

  const resolverDados = () => {
    if (periodoSelecionado === 'hoje') {
      return {
        labels: [dataHoje],
        dados: {
          compras: [dadosPorLoja[lojaSelecionada].diario.compras[18]],
          pedidos: [dadosPorLoja[lojaSelecionada].diario.pedidos[18]],
          itens: [dadosPorLoja[lojaSelecionada].diario.itens[18]],
          unidades: [dadosPorLoja[lojaSelecionada].diario.unidades[18]],
        },
      }
    }
    const total = periodoSelecionado === '7' ? 7 : periodoSelecionado === '15' ? 15 : 30
    const labels = Array.from({ length: total }, (_, i) => `${String(i + 1).padStart(2, '0')}`)
    return {
      labels,
      dados: {
        compras: dadosPorLoja[lojaSelecionada].diario.compras.slice(0, total),
        pedidos: dadosPorLoja[lojaSelecionada].diario.pedidos.slice(0, total),
        itens: dadosPorLoja[lojaSelecionada].diario.itens.slice(0, total),
        unidades: dadosPorLoja[lojaSelecionada].diario.unidades.slice(0, total),
      },
    }
  }

  const { labels, dados } = resolverDados()

  const cores: Record<string, string> = {
    compras: '#14b8a6',
    pedidos: '#3b82f6',
    itens: '#f59e0b',
    unidades: '#8b5cf6',
  }

  const nomesMetricas: Record<string, string> = {
    compras: 'Compras',
    pedidos: 'Pedidos',
    itens: 'Itens vendidos',
    unidades: 'Unidades vendidas',
  }

  const totaisCard: Record<string, string> = {
    compras: `R$ ${dados.compras.reduce((a: number, v: number) => a + v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pedidos: dados.pedidos.reduce((a: number, v: number) => a + v, 0).toString(),
    itens: dados.itens.reduce((a: number, v: number) => a + v, 0).toString(),
    unidades: dados.unidades.reduce((a: number, v: number) => a + v, 0).toString(),
  }

  const maxValor = Math.max(
    1,
    ...Object.entries(metricasAtivas)
      .filter(([, ativa]) => ativa)
      .flatMap(([key]) => dados[key as keyof typeof dados])
  )

  const toggleMetrica = (key: string) => {
    setMetricasAtivas(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const fmtValorMetrica = (key: string, val: number) => {
    if (key === 'compras') return fmt(val)
    return fmtNum(val)
  }

  const SVG_W = 350
  const SVG_H = 130
  const espacoX = Math.min(50, 320 / Math.max(labels.length - 1, 1))

  const metricasInfo = Object.entries(metricasAtivas)
    .filter(([, ativa]) => ativa)
    .map(([key]) => {
      const valores = dados[key as keyof typeof dados]
      const cor = cores[key]
      const maxV = maxValor || 1
      const pontos = valores.map((v, i) => ({
        x: 15 + i * espacoX,
        y: 115 - (v / maxV) * 90,
      }))
      return { key, valores, cor, pontos }
    })

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const svgWidth = rect.width

    const svgMouseX = (mouseX / svgWidth) * SVG_W

    let closestIdx = 0
    let closestDist = Infinity
    for (let i = 0; i < labels.length; i++) {
      const pontoX = 15 + i * espacoX
      const dist = Math.abs(svgMouseX - pontoX)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    }

    if (closestDist > espacoX * 0.6) {
      setTooltip(null)
      return
    }

    const pontoX = 15 + closestIdx * espacoX
    const pixelX = (pontoX / SVG_W) * svgWidth

    const metricasAtivasArray = Object.entries(metricasAtivas)
      .filter(([, ativa]) => ativa)

    const values = metricasAtivasArray.map(([key]) => ({
      metric: key,
      value: dados[key as keyof typeof dados][closestIdx],
    }))

    const svgHeight = rect.height

    const firstMetric = metricasAtivasArray[0]
    if (firstMetric) {
      const valores = dados[firstMetric[0] as keyof typeof dados]
      const maxV = maxValor || 1
      const pontoY = 115 - (valores[closestIdx] / maxV) * 90
      const pixelY = (pontoY / SVG_H) * svgHeight

      setTooltip({
        values,
        label: labels[closestIdx],
        x: pixelX,
        y: pixelY,
      })
    }
  }, [labels, dados, metricasAtivas, maxValor])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const handleRecarga = () => {
    if (!valorRecarga || parseFloat(valorRecarga) <= 0) return
    setRecargaSucesso(true)
    setTimeout(() => {
      setModalRecarga(false)
      setRecargaSucesso(false)
      setValorRecarga('')
      setComprovanteNome('')
    }, 2000)
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
          <a href="/lojista/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700">
            <TrendingUp className="h-5 w-5" /> Dashboard
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
            <h1 className="text-2xl font-semibold text-gray-900">📊 Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Visão geral dos seus pedidos e saldo</p>
          </div>
        </div>

        {/* Cards: Saldo atual + Subir Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Saldo atual</p>
                <p className="text-2xl font-bold text-amber-600">R$ 129,50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setModalRecarga(true)}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all">
                <Plus className="h-3.5 w-3.5" /> Recarga
              </button>
              <button onClick={() => setModalExtrato(true)}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium transition-all">
                <Eye className="h-3.5 w-3.5" /> Ver extrato
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)' }}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <FileUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Subir Pedidos</p>
                <p className="text-xs text-gray-500">Envie seus pedidos manualmente por enquanto</p>
              </div>
            </div>
            <button onClick={() => setModalSubir(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm">
              Subir Pedidos
            </button>
          </div>
        </div>

        {/* Modal Recarga */}
        {modalRecarga && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">💰 Fazer Recarga</h3>
                <button onClick={() => { setModalRecarga(false); setRecargaSucesso(false); setValorRecarga(''); setComprovanteNome('') }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {recargaSucesso ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Recarga solicitada!</p>
                  <p className="text-sm text-gray-500 mt-1">Seu comprovante foi enviado para análise do financeiro.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">Insira o valor e anexe o comprovante de pagamento.</p>
                  
                  <div className="mb-4">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Valor da recarga</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
                      <input type="number" value={valorRecarga} onChange={e => setValorRecarga(e.target.value)}
                        placeholder="0,00"
                        className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Comprovante de pagamento</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      {comprovanteNome ? (
                        <p className="text-sm font-medium text-green-600">{comprovanteNome}</p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">Clique para anexar ou arraste o arquivo</p>
                          <p className="text-[10px] text-gray-300 mt-1">PNG, JPG ou PDF • Máx. 5MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  <button onClick={() => {
                    setComprovanteNome(`comprovante_recarga_${Date.now()}.pdf`)
                    handleRecarga()
                  }}
                    disabled={!valorRecarga || parseFloat(valorRecarga) <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-all">
                    Solicitar Recarga
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal Extrato */}
        {modalExtrato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">📄 Extrato</h3>
                <button onClick={() => setModalExtrato(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <select value={extratoFiltro} onChange={e => setExtratoFiltro(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="todas">Todas as lojas</option>
                  <option value="matriz">Matriz</option>
                  <option value="online">Online</option>
                </select>
                <span className="text-xs text-gray-400">Últimos 30 dias</span>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Data</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Valor</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { data: '19/05', desc: 'Pagamento ML - #PED-20260301', valor: 1250.00, tipo: 'entrada' as const },
                    { data: '18/05', desc: 'Recarga via PIX', valor: 500.00, tipo: 'entrada' as const },
                    { data: '17/05', desc: 'Pedido #PED-20260298', valor: -2100.00, tipo: 'saida' as const },
                    { data: '16/05', desc: 'Pagamento ML - #PED-20260295', valor: 890.00, tipo: 'entrada' as const },
                    { data: '15/05', desc: 'Recarga via PIX', valor: 1000.00, tipo: 'entrada' as const },
                    { data: '14/05', desc: 'Pedido #PED-20260290', valor: -450.00, tipo: 'saida' as const },
                    { data: '13/05', desc: 'Pagamento Shopee - #PED-20260287', valor: 320.00, tipo: 'entrada' as const },
                  ].map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-500">{item.data}</td>
                      <td className="py-2.5 text-gray-700">{item.desc}</td>
                      <td className={`py-2.5 text-right font-medium ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.tipo === 'entrada' ? '+' : ''}{fmt(Math.abs(item.valor))}
                      </td>
                      <td className="py-2.5 text-right text-gray-900 font-medium">{fmt(129.50)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Saldo atual: <strong className="text-gray-900">R$ 129,50</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Subir Pedido */}
        {modalSubir && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">📤 Subir Pedidos</h3>
                <button onClick={() => setModalSubir(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4 hover:border-indigo-300 transition-all cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Upload de PDF</p>
                <p className="text-xs text-gray-400 mt-1">Arraste seu PDF aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-300 mt-2">Formatos aceitos: .pdf</p>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">ou</span>
                </div>
              </div>

              <button disabled
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-400 text-sm font-medium py-2.5 rounded-lg cursor-not-allowed">
                <ClipboardList className="h-4 w-4" />
                Pedido Manual (em breve)
              </button>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Ao enviar, seu pedido será lido por IA e disponibilizado para revisão.
              </p>
            </div>
          </div>
        )}

        {/* Gráfico de Vendas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Vendas</h2>
              {lojaSelecionada !== 'todas' && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">
                  {lojas.find(l => l.id === lojaSelecionada)?.nome}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">19 de maio de 2026</span>
          </div>

          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Loja</label>
              <select value={lojaSelecionada} onChange={e => setLojaSelecionada(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Período</label>
              <select value={periodoSelecionado} onChange={e => setPeriodoSelecionado(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="hoje">📅 Hoje ({dataHoje})</option>
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option disabled>──────────</option>
                <option value="personalizado">📆 Personalizar</option>
              </select>
            </div>
            {isPersonalizado && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-gray-500 font-medium">De:</label>
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[130px]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-gray-500 font-medium">Até:</label>
                  <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-[130px]" />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { key: 'compras', label: 'Compras', cor: '#14b8a6' },
              { key: 'pedidos', label: 'Pedidos', cor: '#3b82f6' },
              { key: 'itens', label: 'Itens vendidos', cor: '#f59e0b' },
              { key: 'unidades', label: 'Unidades vendidas', cor: '#8b5cf6' },
            ].map(m => {
              const ativa = metricasAtivas[m.key as keyof typeof metricasAtivas]
              return (
                <button key={m.key} onClick={() => toggleMetrica(m.key)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    ativa 
                      ? 'border-gray-800 bg-white shadow-sm' 
                      : 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-80'
                  }`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-gray-500">{m.label}</span>
                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                      ativa ? 'border-transparent' : 'border-gray-300'
                    }`}
                      style={ativa ? { backgroundColor: m.cor } : {}}>
                      {ativa && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{totaisCard[m.key]}</p>
                </button>
              )
            })}
          </div>

          <div ref={chartContainerRef} className="relative h-32">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="border-t border-gray-100 w-full" />
              ))}
            </div>

            {tooltip && (
              <div className="absolute z-10 pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
                style={{
                  left: `min(${tooltip.x}px, calc(100% - 140px))`,
                  top: `max(${tooltip.y - 50}px, 0px)`,
                  transform: 'translateX(-50%)',
                }}>
                <p className="font-medium opacity-80 mb-1">{tooltip.label}</p>
                {tooltip.values.map(v => (
                  <p key={v.metric} className="font-semibold" style={{ color: cores[v.metric] }}>
                    {nomesMetricas[v.metric]}: {fmtValorMetrica(v.metric, v.value)}
                  </p>
                ))}
              </div>
            )}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-32 overflow-visible cursor-crosshair"
              preserveAspectRatio="xMidYMid meet"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {metricasInfo.map(({ key, valores, cor, pontos }) => {
                const pathD = pontos.map((p, i) => 
                  i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                ).join(' ')

                const areaD = pathD + ` L ${pontos[pontos.length - 1].x} 120 L ${pontos[0].x} 120 Z`

                return (
                  <g key={key}>
                    <path d={areaD} fill={cor + '12'} />
                    <path d={pathD} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pontos.map((p, i) => (
                      <circle key={i}
                        cx={p.x} cy={p.y} r="2.5"
                        fill="white" stroke={cor} strokeWidth="1.5"
                      />
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {Object.entries(metricasAtivas)
                .filter(([, ativa]) => ativa)
                .map(([key]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cores[key] }} />
                    <span className="text-[10px] text-gray-500">{nomesMetricas[key]}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Últimos Pedidos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 Últimos Pedidos</h2>
            <a href="/lojista/meus-pedidos" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Ver todos →
            </a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-gray-500 font-medium">Pedido</th>
                <th className="text-left py-3 text-gray-500 font-medium">Loja</th>
                <th className="text-left py-3 text-gray-500 font-medium">Data</th>
                <th className="text-left py-3 text-gray-500 font-medium">Valor</th>
                <th className="text-left py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '#PED-20260301', loja: 'Matriz', data: '19/05/2026', valor: 1250.00, status: 'Liberado' },
                { id: '#PED-20260300', loja: 'ML', data: '18/05/2026', valor: 420.00, status: 'Aguardando revisão' },
                { id: '#PED-20260299', loja: 'Online', data: '18/05/2026', valor: 890.00, status: 'Em leitura por IA' },
                { id: '#PED-20260298', loja: 'Filial', data: '17/05/2026', valor: 2100.00, status: 'Liberado' },
                { id: '#PED-20260297', loja: 'ML', data: '17/05/2026', valor: 180.00, status: 'Aguardando saldo' },
              ].map(pedido => (
                <tr key={pedido.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{pedido.id}</td>
                  <td className="py-3 text-gray-500">{pedido.loja}</td>
                  <td className="py-3 text-gray-500">{pedido.data}</td>
                  <td className="py-3 text-gray-900 font-medium">{fmt(pedido.valor)}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      pedido.status === 'Liberado' ? 'bg-green-50 text-green-700' :
                      pedido.status === 'Aguardando revisão' ? 'bg-amber-50 text-amber-700' :
                      pedido.status === 'Em leitura por IA' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {pedido.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}