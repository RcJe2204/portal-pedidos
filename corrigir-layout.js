const fs = require('fs');

const correctContent = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutClient from './components/LayoutClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Portal Pedidos',
  description: 'Portal de gerenciamento de pedidos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}`;

fs.writeFileSync('src/app/layout.tsx', correctContent, 'utf8');
console.log('✅ layout.tsx corrigido!');