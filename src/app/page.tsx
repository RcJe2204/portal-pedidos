import { ClipboardList, Users, Package, DollarSign } from 'lucide-react'

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total de Pedidos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">1.247</p>
            </div>
            <ClipboardList className="h-12 w-12 text-blue-500 opacity-75" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Clientes Ativos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">342</p>
            </div>
            <Users className="h-12 w-12 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Produtos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">89</p>
            </div>
            <Package className="h-12 w-12 text-purple-500 opacity-75" />
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Faturamento</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">R$ 84.500</p>
            </div>
            <DollarSign className="h-12 w-12 text-amber-500 opacity-75" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Pedidos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#001</td>
                  <td className="px-4 py-3 text-sm text-gray-900">João Silva</td>
                  <td className="px-4 py-3 text-sm text-gray-900">R$ 150,00</td>
                  <td><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">Aprovado</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#002</td>
                  <td className="px-4 py-3 text-sm text-gray-900">Maria Santos</td>
                  <td className="px-4 py-3 text-sm text-gray-900">R$ 250,00</td>
                  <td><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">Pendente</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#003</td>
                  <td className="px-4 py-3 text-sm text-gray-900">Pedro Oliveira</td>
                  <td className="px-4 py-3 text-sm text-gray-900">R$ 180,00</td>
                  <td><span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">Cancelado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}