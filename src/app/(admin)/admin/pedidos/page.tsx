import prisma from '@/lib/prisma'
import Link from 'next/link'
export const dynamic = 'force-dynamic';

async function getPedidos() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'desc' },
    include: { lojista: { select: { nome: true } } }
  })
  return pedidos
}

function formatarMoeda(valor: number | null) {
  // Aqui corrigimos para aceitar valor nulo
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusBadge(status: string) {
  const cores: Record<string, string> = {
    'aguardando autorização': 'bg-yellow-100 text-yellow-800',
    autorizado: 'bg-blue-100 text-blue-800',
    'em embalagem': 'bg-purple-100 text-purple-800',
    finalizado: 'bg-green-100 text-green-800',
  }
  return cores[status] || 'bg-gray-100 text-gray-800'
}

type PedidoComLojista = {
  id: string
  lojista: { nome: string }
  total: number | null // Aqui avisamos que o total pode ser nulo
  status: string
  plataforma: string | null
  createdAt: Date
}

export default async function AdminPedidosPage() {
  const pedidos = await getPedidos()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pedidos Recebidos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Total de {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 text-lg">Nenhum pedido recebido ainda</p>
          <p className="text-slate-400 text-sm mt-1">
            Os pedidos enviados pelos lojistas aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Lojista</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Plataforma</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Data</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {pedidos.map((pedido: PedidoComLojista) => (
                <tr key={pedido.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {pedido.lojista.nome}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {pedido.plataforma || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                    {formatarMoeda(pedido.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(pedido.status)}`}>
                      {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatarData(pedido.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                    >
                      Detalhes →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}