import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. BUSCA NA TABELA CORRETA (integracao)
    const tokenDb = await prisma.integracao.findUnique({ 
      where: { nome: 'Bling' } 
    })

    if (!tokenDb) {
      return NextResponse.json({ 
        error: 'Bling não conectado. Vá em Configurações e conecte o Bling.', 
        precisaReconectar: true 
      }, { status: 401 })
    }

    let accessToken = tokenDb.accessToken

    // 2. RENOVAÇÃO AUTOMÁTICA (Ajustado para o campo expiresIn)
    if (tokenDb.expiresIn && new Date() > tokenDb.expiresIn) {
      const clientId = process.env.BLING_CLIENT_ID
      const clientSecret = process.env.BLING_CLIENT_SECRET
      const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

      const refreshRes = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicToken}`,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: tokenDb.refreshToken,
        }),
      })

      if (refreshRes.ok) {
        const newData = await refreshRes.json()
        accessToken = newData.access_token
        await prisma.integracao.update({
          where: { nome: 'Bling' },
          data: {
            accessToken: newData.access_token,
            refreshToken: newData.refresh_token,
            expiresIn: new Date(Date.now() + newData.expires_in * 1000)
          }
        })
      }
    }

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
      
      if (pagina > 50) break // Segurança
    }

    return NextResponse.json({ data: todosProdutos })

  } catch (err: any) {
    console.error('Erro ao buscar produtos:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}