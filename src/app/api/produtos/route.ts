import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lojistaId = searchParams.get('lojistaId')
  if (!lojistaId) return NextResponse.json([])

  try {
    const produtos = await prisma.produto.findMany({
      where: { lojistaId },
      include: { categoria: true }
    })
    const resultado = produtos.map((p: any) => ({
      sku: p.codigo,
      nome: p.nome,
      categoria: p.categoria?.nome || 'Geral',
      precoLojista: p.preco
    }))
    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}