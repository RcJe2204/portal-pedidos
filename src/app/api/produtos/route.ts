import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função para ignorar acentos e maiúsculas na comparação
function normalizar(texto: string) {
  return texto ? texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
}

// Definimos o que é um Produto para o TypeScript não reclamar
interface ProdutoComCategoria {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  categoria?: {
    nome: string;
  } | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lojistaId = searchParams.get('lojistaId')

  if (!lojistaId) return NextResponse.json([])

  try {
    let lojista = await prisma.lojista.findUnique({
      where: { id: lojistaId },
      include: { listaPrecos: true }
    })

    if (!lojista && (lojistaId === 'fake-123' || lojistaId.includes('fake'))) {
      lojista = await prisma.lojista.findFirst({
        where: { nome: { contains: 'TESTE' } },
        include: { listaPrecos: true }
      })
    }

    if (lojista) {
      // Buscamos os produtos forçando o tipo correto
      const produtosNoBanco = await prisma.produto.findMany({
        include: { categoria: true }
      }) as unknown as ProdutoComCategoria[]

      const resultado = produtosNoBanco.map(p => {
        return {
          sku: p.codigo,
          nome: p.nome,
          categoria: p.categoria?.nome || 'Sem Categoria',
          precoLojista: p.preco
        }
      })

      console.log(`--- RELATÓRIO API ---`)
      console.log(`Lojista: ${lojista.nome}`)
      console.log(`Produtos Enviados: ${resultado.length}`)
      
      return NextResponse.json(resultado)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}