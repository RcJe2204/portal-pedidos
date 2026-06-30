import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(requisicao: NextRequest) {
  try {
    const { searchParams } = new URL(requisicao.url);
    const lojistaId = searchParams.get('lojistaId');

    if (lojistaId) {
      const permissoes = await prisma.preco_lojista.findMany({
        where: {
          cliente_id: lojistaId,
          preco: { gt: 0 }
        },
        select: { categoria: true }
      });

      const nomesPermitidos = Array.from(new Set(permissoes.map(p => p.categoria.trim().toUpperCase())));

      const categoriasFiltradas = await prisma.categoria.findMany({
        where: {
          nome: {
            in: nomesPermitidos
          }
        },
        orderBy: { nome: 'asc' }
      });

      return NextResponse.json(categoriasFiltradas);
    }

    const todasCategorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(todasCategorias);
  } catch (erro) {
    console.error('Erro ao buscar categorias:', erro);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(requisicao: NextRequest) {
  try {
    const corpo = await requisicao.json();
    const nomeRecebido = corpo?.nome;
    if (!nomeRecebido) return NextResponse.json({ erro: 'Nome obrigatório' }, { status: 400 });

    const nome = String(nomeRecebido).trim().toUpperCase();
    const categoriaCriada = await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome }
    });

    const todosOsLojistas = await prisma.lojista.findMany();
    await Promise.all(
      todosOsLojistas.map((lojista) =>
        prisma.preco_lojista.upsert({
          where: {
            cliente_id_categoria: {
              cliente_id: lojista.id,
              categoria: nome
            }
          },
          update: {},
          create: {
            cliente_id: lojista.id,
            categoria: nome,
            preco: 0,
          },
        })
      )
    );

    return NextResponse.json(categoriaCriada, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: 'Erro ao criar' }, { status: 500 });
  }
}