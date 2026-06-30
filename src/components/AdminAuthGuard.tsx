'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    const auth = localStorage.getItem('portal_auth')
    if (auth) {
      const dados = JSON.parse(auth)
      if (dados.tipo === 'admin') {
        setAutenticado(true)
      } else {
        router.push('/login-admin')
      }
    } else {
      router.push('/login-admin')
    }
    setVerificando(false)
  }, [router, pathname])

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-10 w-10 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-gray-500">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) return null

  return <>{children}</>
}