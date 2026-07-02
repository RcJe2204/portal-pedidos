import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || DB_URL } } });

// 1. LISTAR PRODUTOS (GET)
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });

    const resultado = produtos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      preco: p.preco,
      estoque: { saldoVirtualTotal: p.estoque },
      situacao: p.situacao,
      categoria: p.categoria?.nome || 'Sem Categoria'
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  }
}

// 2. EDITAR PRODUTO (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, preco, estoque, categoria } = body;

    // Lógica para Categoria: Busca ou cria se não existir
    let categoriaId = null;
    if (categoria) {
      const cat = await prisma.categoria.upsert({
        where: { id: categoria.id || 'temp-id' }, // Tenta pelo ID ou nome
        update: { nome: categoria },
        create: { nome: categoria }
      });
      categoriaId = cat.id;
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id: id },
      data: {
        nome,
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
        categoriaId: categoriaId
      }
    });

    return NextResponse.json({ success: true, produto: produtoAtualizado });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao editar', detalhes: error.message }, { status: 500 });
  }
}

// 3. SINCRONIZAR (POST)
export async function POST() {
  try {
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao?.token) return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });

    const res = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=2', {
      headers: { 'Authorization': `Bearer ${integracao.token}` }
    });
    const data = await res.json();
    const produtosBling = data.data || [];

    for (const p of produtosBling) {
      // Busca estoque real na API de estoques
      const resEst = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${p.id}`, {
        headers: { 'Authorization': `Bearer ${integracao.token}` }
      });
      const estData = await resEst.json();
      const saldo = estData.data?.[0]?.saldoVirtualTotal || 0;

      await prisma.produto.upsert({
        where: { codigo: String(p.codigo) },
        update: { nome: p.nome, preco: p.preco, estoque: Math.floor(saldo) },
        create: {
          codigo: String(p.codigo),
          nome: p.nome,
          preco: p.preco,
          estoque: Math.floor(saldo),
          lojistaId: integracao.lojistaId
        }
      });
    }
    return NextResponse.json({ success: true, total: produtosBling.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}