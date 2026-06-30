import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 1. Função para listar (GET) - Já estava correta
export async function GET(request: NextRequest) {
  try {
    const tokenDb = await prisma.integracao.findUnique({ where: { nome: 'Bling' } })
    if (!tokenDb) return NextResponse.json({ error: 'Bling não conectado.' }, { status: 401 })

    let todosProdutos: any[] = []
    let pagina = 1
    while (true) {
      const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?limite=100&pagina=${pagina}`, {
        headers: { 'Authorization': `Bearer ${tokenDb.accessToken}` }
      })
      if (!response.ok) break
      const data = await response.json()
      if (!data.data || data.data.length === 0) break
      todosProdutos = [...todosProdutos, ...data.data]
      pagina++
    }
    return NextResponse.json({ data: todosProdutos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// 2. Função para Sincronizar (POST) - AGORA COM LOOP DE PÁGINAS
export async function POST(request: NextRequest) {
  try {
    const tokenDb = await prisma.integracao.findUnique({ where: { nome: 'Bling' } })
    if (!tokenDb) return NextResponse.json({ error: 'Bling não conectado.' }, { status: 401 })

    let todosProdutos: any[] = []
    let pagina = 1

    console.log('Iniciando sincronização completa...');

    while (true) {
      const response = await fetch(`https://www.bling.com.br/Api/v3/produtos?limite=100&pagina=${pagina}`, {
        headers: { 'Authorization': `Bearer ${tokenDb.accessToken}` }
      })
      
      if (!response.ok) break
      
      const data = await response.json()
      if (!data.data || data.data.length === 0) break
      
      todosProdutos = [...todosProdutos, ...data.data]
      console.log(`Página ${pagina} capturada. Total acumulado: ${todosProdutos.length}`);
      
      pagina++
      
      // Segurança para não entrar em loop infinito se a API do Bling falhar
      if (pagina > 50) break 
    }

    return NextResponse.json(todosProdutos)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno na sincronização' }, { status: 500 })
  }
}