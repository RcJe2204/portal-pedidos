'use client'

import React from 'react'

export default function LojistaGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 
          Este layout é exclusivo para o grupo (lojista).
          Ele NÃO contém a barra escura do Admin.
          As páginas aqui dentro usarão apenas sua própria Sidebar clara.
      */}
      {children}
    </div>
  )
}