import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, total, plataforma } = body;

    if (!lojistaId || total === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // AJUSTE: Removido 'itens' e 'observacao' pois não existem no modelo Pedido do seu schema.prisma
    const pedido = await prisma.pedido.create({
      data: {
        lojistaId,
        total: Number(total),
        status: 'aguardando autorização',
        plataforma: plataforma || 'manual'
      }
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar pedido manual:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}