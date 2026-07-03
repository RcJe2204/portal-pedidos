import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      // Removido o include de categoria que não existe no schema atual
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map(p => ({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      precoBase: Number(p.precoBase || 0),
      // Retornamos uma string fixa ou nula para não quebrar o frontend
      categoria: "Geral" 
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const produto = await prisma.produto.create({
      data: {
        nome: data.nome,
        sku: data.sku,
        precoBase: data.precoBase || 0,
        descricao: data.descricao,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}