import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, itens, observacao, plataforma } = body;

    if (!lojistaId || !itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: 'Dados inválidos: lojistaId e itens são obrigatórios' },
        { status: 400 }
      );
    }

    // Valida cada item
    const itensProcessados = itens.map((item: any) => ({
      codigo: item.codigo || item.sku || '',
      nome: item.nome || '',
      quantidade: item.quantidade || 1,
      precoUnitario: item.preco || item.precoUnitario || 0,
    }));

    // Calcula o total
    const total = itensProcessados.reduce(
      (acc: number, item: any) => acc + item.quantidade * item.precoUnitario,
      0
    );

    // Cria o pedido no banco
    const pedido = await prisma.pedido.create({
      data: {
        lojistaId,
        itens: JSON.stringify(itensProcessados),
        total,
        status: 'aguardando autorização',
        observacao: observacao || '',
        plataforma: plataforma || null,
      },
      include: {
        lojista: { select: { nome: true } },
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido manual:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar pedido' },
      { status: 500 }
    );
  }
}