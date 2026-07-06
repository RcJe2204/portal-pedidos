import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const tokenDb = await prisma.blingToken.findFirst()

    if (!tokenDb || !tokenDb.accessToken) {
      return NextResponse.json({ error: 'Bling não conectado.' }, { status: 401 })
    }

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
      
      if (pagina > 50) break
    }
    return NextResponse.json({ data: todosProdutos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenDb = await prisma.blingToken.findFirst()

    if (!tokenDb || !tokenDb.accessToken) {
      return NextResponse.json({ error: 'Bling não conectado.' }, { status: 401 })
    }

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
      
      if (pagina > 50) break 
    }

    return NextResponse.json(todosProdutos)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno na sincronização' }, { status: 500 })
  }
}