import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Buscar detalhes de um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        lojista: {
          select: { nome: true }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...pedido,
      itens: JSON.parse(pedido.itens as string),
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar detalhes do pedido' },
      { status: 500 }
    );
  }
}

// PATCH: Atualizar o status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status não informado' },
        { status: 400 }
      );
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: { status },
      include: {
        lojista: {
          select: { nome: true }
        }
      }
    });

    return NextResponse.json({
      ...pedidoAtualizado,
      itens: JSON.parse(pedidoAtualizado.itens as string),
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar status do pedido' },
      { status: 500 }
    );
  }
}