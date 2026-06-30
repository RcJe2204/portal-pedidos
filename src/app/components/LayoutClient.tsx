'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

interface LayoutClientProps {
  children: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Verifica se a rota atual pertence ao lojista
  const isLojistaPage = pathname?.startsWith('/lojista')

  // Se for página de lojista, renderiza apenas o conteúdo sem os componentes do Admin
  if (isLojistaPage) {
    return (
      <main className="min-h-screen bg-gray-50 overflow-auto">
        {children}
      </main>
    )
  }

  return (
    <>
      <Header isCollapsed={isCollapsed} />
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={'pt-16 ' + (isCollapsed ? 'ml-16' : 'ml-64') + ' min-h-screen p-6 bg-gray-50 transition-all duration-300 overflow-auto'}>
        {children}
      </main>
    </>
  )
}