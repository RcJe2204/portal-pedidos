'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, ClipboardList, Package, Users, 
  ChevronLeft, ChevronRight, Settings, 
  DollarSign, ChevronDown, ChevronUp
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname()
  const [configOpen, setConfigOpen] = useState(false)

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <div className={`fixed left-0 top-0 h-screen z-50 bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-500 to-indigo-600">
          {isCollapsed ? (
            <span className="text-xl font-bold">PP</span>
          ) : (
            <span className="text-lg font-bold">Portal Pedidos</span>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/admin/dashboard"
            className={`group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
              isActive('/admin/dashboard') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">Dashboard</span>
            )}
          </Link>

          <Link
            href="/admin/pedidos/novo"
            className={`group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
              isActive('/admin/pedidos') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">Pedidos</span>
            )}
          </Link>

          <Link
            href="/admin/produtos"
            className={`group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
              isActive('/admin/produtos') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            <Package className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">Produtos</span>
            )}
          </Link>

          <Link
            href="/admin/clientes"
            className={`group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
              isActive('/admin/clientes') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">Lojistas</span>
            )}
          </Link>

          {/* Configurações com submenu */}
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setConfigOpen(!configOpen)}
                className={`w-full group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
                  isActive('/admin/listas-preco') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
                }`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span className="ml-3 text-sm font-medium flex-1 text-left">Configurações</span>
                {configOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {configOpen && (
                <div className="ml-8 space-y-1 border-l-2 border-gray-700 pl-3">
                  <Link
                    href="/admin/listas-preco"
                    className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive('/admin/listas-preco') ? 'bg-gray-700 text-blue-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 shrink-0 mr-2" />
                    Listas de Preço / Restrições
                  </Link>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/admin/listas-preco"
              className={`group flex items-center px-3 py-2 rounded-r-lg transition-all duration-200 ${
                isActive('/admin/listas-preco') ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
            </Link>
          )}
        </nav>

        {/* Botão recolher */}
        <div className="p-2 border-t border-gray-800">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar