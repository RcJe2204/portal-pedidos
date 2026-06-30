import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      preco: p.preco,
      estoque: { saldoVirtualTotal: p.estoque },
      situacao: p.situacao,
      categoria: null,
      tags: null,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}