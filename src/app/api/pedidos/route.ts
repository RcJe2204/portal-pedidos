import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lojista: {
          select: { nome: true }
        }
      }
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar pedidos.' },
      { status: 500 }
    );
  }
}