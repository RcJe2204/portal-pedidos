import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function toInt(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map((p) => ({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      precoBase: Number(p.precoBase || 0),
      estoque: { saldoVirtualTotal: p.estoque },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      for (const item of body) {
        if (!item.sku) continue;
        await prisma.produto.upsert({
          where: { sku: item.sku },
          update: {
            nome: item.nome,
            precoBase: Number(item.precoBase || 0),
            estoque: toInt(item.estoque),
          },
          create: {
            sku: item.sku,
            nome: item.nome,
            precoBase: Number(item.precoBase || 0),
            estoque: toInt(item.estoque),
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    const produto = await prisma.produto.create({
      data: {
        nome: body.nome,
        sku: body.sku,
        precoBase: Number(body.precoBase || 0),
        estoque: toInt(body.estoque),
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST de produtos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, nome, precoBase, estoque } = await request.json();
    const atualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        precoBase: Number(precoBase || 0),
        estoque: toInt(estoque),
      },
    });
    return NextResponse.json(atualizado);
  } catch (error: any) {
    console.error('Erro ao editar produto:', error);
    return NextResponse.json({ error: 'Erro ao editar' }, { status: 500 });
  }
}