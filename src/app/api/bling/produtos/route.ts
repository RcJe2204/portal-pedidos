import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const tokenDb = await prisma.blingToken.findFirst()

    if (!tokenDb || !tokenDb.accessToken) {
      return NextResponse.json({
        error: 'Bling não conectado. Vá em Configurações e conecte o Bling.',
        precisaReconectar: true
      }, { status: 401 })
    }

    const accessToken = tokenDb.accessToken

    let todosProdutos: any[] = []
    let pagina = 1

    while (true) {
      const response = await fetch(
        `https://www.bling.com.br/Api/v3/produtos?limite=100&pagina=${pagina}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) break
        break
      }

      const data = await response.json()
      const produtos = data.data || []

      if (produtos.length === 0) break

      todosProdutos = [...todosProdutos, ...produtos]
      pagina++

      if (pagina > 50) break 
    }

    return NextResponse.json({ data: todosProdutos })

  } catch (err: any) {
    console.error('Erro ao buscar produtos:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}