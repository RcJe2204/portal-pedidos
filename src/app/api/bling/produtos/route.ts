import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. BUSCA NA TABELA CORRETA (integracao)
    // Ajuste: Usamos findFirst com o campo 'tipo' que existe no seu schema
    const tokenDb = await prisma.integracao.findFirst({
      where: { tipo: 'BLING' }
    })

    if (!tokenDb || !tokenDb.token) {
      return NextResponse.json({
        error: 'Bling não conectado. Vá em Configurações e conecte o Bling.',
        precisaReconectar: true
      }, { status: 401 })
    }

    // No seu schema o campo chama-se 'token'
    const accessToken = tokenDb.token

    // 2. RENOVAÇÃO AUTOMÁTICA
    // Nota: A lógica de refresh foi removida pois os campos 'refreshToken' e 'expiresIn' 
    // não existem no seu modelo Integracao do schema.prisma atual.

    // 3. BUSCA DE PRODUTOS COM LOOP DE PÁGINAS (Para trazer todos os 272)
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

      if (pagina > 50) break // Segurança para evitar loop infinito
    }

    return NextResponse.json({ data: todosProdutos })

  } catch (err: any) {
    console.error('Erro ao buscar produtos:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}