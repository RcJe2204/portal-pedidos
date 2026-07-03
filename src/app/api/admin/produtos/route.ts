import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map(p => ({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      precoBase: Number(p.precoBase || 0),
      // Aqui está o ajuste: tratamos o estoque como número, não como objeto
      estoque: { saldoVirtualTotal: p.estoque || 0 },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Se for um array (sincronização do Bling)
    if (Array.isArray(body)) {
      for (const item of body) {
        await prisma.produto.upsert({
          where: { sku: item.sku },
          update: {
            nome: item.nome,
            precoBase: item.precoBase || 0,
            estoque: item.estoque || 0,
          },
          create: {
            sku: item.sku,
            nome: item.nome,
            precoBase: item.precoBase || 0,
            estoque: item.estoque || 0,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Se for criação única
    const produto = await prisma.produto.create({
      data: {
        nome: body.nome,
        sku: body.sku,
        precoBase: body.precoBase || 0,
        estoque: body.estoque || 0,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error("Erro no POST de produtos:", error);
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
        precoBase: parseFloat(precoBase), 
        estoque: parseInt(estoque) 
      }
    });
    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao editar' }, { status: 500 });
  }
}