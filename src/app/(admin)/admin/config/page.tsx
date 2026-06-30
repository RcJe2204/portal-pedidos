'use client'

import { useEffect, useState } from 'react'

export default function ConfigPage() {
  const [conectado, setConectado] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    // Verifica se já tem token salvo
    const token = localStorage.getItem('bling_token')
    if (token) {
      setConectado(true)

      // Verifica se veio do callback e mostra mensagem
      const params = new URLSearchParams(window.location.search)
      if (params.has('bling')) {
        setMensagem('✅ Bling conectado com sucesso!')
        // Remove o parâmetro da URL
        window.history.replaceState({}, '', '/admin/config')
      }
    } else {
      const params = new URLSearchParams(window.location.search)
      if (params.get('bling') === 'erro') {
        setMensagem('❌ Erro ao conectar Bling')
      }
    }
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-2">Integração Bling</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Conecte sua conta do Bling para sincronizar pedidos, produtos e notas fiscais.
        </p>

        {mensagem && (
          <div className="mb-4 text-sm font-medium">{mensagem}</div>
        )}

        {conectado ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Conectado ao Bling</span>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = '/api/bling/auth'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔗 Conectar com Bling
          </button>
        )}
      </div>
    </div>
  )
}