import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função para ignorar acentos e maiúsculas na comparação
function normalizar(texto: string) {
  return texto ? texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lojistaId = searchParams.get('lojistaId')

  if (!lojistaId) return NextResponse.json([])

  try {
    let lojista = await prisma.lojista.findUnique({
      where: { id: lojistaId },
      include: { listaPreco: true }
    })

    if (!lojista && (lojistaId === 'fake-123' || lojistaId.includes('fake'))) {
      lojista = await prisma.lojista.findFirst({
        where: { nome: { contains: 'TESTE' } },
        include: { listaPreco: true }
      })
    }

    if (lojista?.listaPreco) {
      const precosOriginais = JSON.parse(lojista.listaPreco.precosPorCategoria || '{}')
      const mapaPrecosNormalizado: Record<string, number> = {}
      
      // CORREÇÃO AQUI: precosOriginais (com 'i')
      Object.entries(precosOriginais).forEach(([cat, preco]) => {
        mapaPrecosNormalizado[normalizar(cat)] = Number(preco)
      })

      const categoriasPermitidas = Object.keys(mapaPrecosNormalizado)

      const produtosNoBanco = await prisma.produto.findMany({
        where: { situacao: { in: ['A', 'a'] } },
        include: { categoria: true }
      })

      const resultado = produtosNoBanco.filter(p => {
        const nomeCatProd = normalizar(p.categoria?.nome || '');
        return categoriasPermitidas.includes(nomeCatProd);
      }).map(p => {
        const nomeCatProd = normalizar(p.categoria?.nome || '');
        return {
          sku: p.codigo,
          nome: p.nome,
          categoria: p.categoria?.nome || 'Sem Categoria',
          precoLojista: mapaPrecosNormalizado[nomeCatProd] ?? p.preco
        }
      })

      console.log(`--- RELATÓRIO API ---`)
      console.log(`Lojista: ${lojista.nome}`)
      console.log(`Categorias na Lista: ${categoriasPermitidas.join(', ')}`)
      console.log(`Produtos Enviados: ${resultado.length}`)
      
      return NextResponse.json(resultado)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}