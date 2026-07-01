import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(requisicao: NextRequest) {
  try {
    const { searchParams } = new URL(requisicao.url);
    const lojistaId = searchParams.get('lojistaId');

    if (lojistaId) {
      // Busca os preços vinculados ao lojista para descobrir quais categorias ele acessa
      const permissoes = await prisma.precoLojista.findMany({
        where: {
          lojistaId: lojistaId,
          preco: { gt: 0 }
        },
        include: {
          produto: {
            include: {
              categoria: true
            }
          }
        }
      });

      // Extrai as categorias únicas dos produtos que possuem preço definido
      const categoriasMap = new Map();
      permissoes.forEach(p => {
        if (p.produto.categoria) {
          categoriasMap.set(p.produto.categoria.id, p.produto.categoria);
        }
      });

      const categoriasFiltradas = Array.from(categoriasMap.values()).sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );

      return NextResponse.json(categoriasFiltradas);
    }

    const todasCategorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(todasCategorias);
  } catch (erro: any) {
    console.error('Erro ao buscar categorias:', erro);
    return NextResponse.json({ erro: 'Erro interno ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = await requisicao.json();
    const nomeRecebido = corpo?.nome;
    if (!nomeRecebido) return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 });

    const nome = String(nomeRecebido).trim().toUpperCase();

    // No seu schema o nome não é @unique, então buscamos primeiro
    let categoriaExistente = await prisma.categoria.findFirst({
      where: { nome }
    });

    if (!categoriaExistente) {
      categoriaExistente = await prisma.categoria.create({
        data: { nome }
      });
    }

    // Nota: A lógica de criar PrecoLojista por categoria foi removida 
    // pois no seu schema atual os preços são vinculados a Produtos (produtoId).

    return NextResponse.json(categoriaExistente, { status: 201 });
  } catch (erro: any) {
    console.error('Erro ao criar categoria:', erro);
    return NextResponse.json({ erro: 'Erro ao criar categoria' }, { status: 500 });
  }
}