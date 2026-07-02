import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || DB_URL } } });

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
      preco: p.preco || 0,
      // Formatação crucial para a sua tabela ler o número
      estoque: { saldoVirtualTotal: p.estoque || 0 },
      situacao: p.situacao || 'A',
      categoria: p.categoria?.nome || ''
    }));
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao?.token) return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });

    let produtosBling: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${i}&limite=100&criterio=2`, {
        headers: { 'Authorization': `Bearer ${integracao.token}` }
      });
      const data = await res.json();
      if (data.data) produtosBling.push(...data.data);
      if (!data.data || data.data.length < 100) break;
    }

    // Busca estoques em lote para os 287 produtos
    const ids = produtosBling.map(p => p.id);
    const resEstoque = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?${ids.map(id => `idsProdutos[]=${id}`).join('&')}`, {
      headers: { 'Authorization': `Bearer ${integracao.token}` }
    });
    const estoqueData = await resEstoque.json();
    const saldos = estoqueData.data || [];

    for (const p of produtosBling) {
      const saldoInfo = saldos.find((s: any) => s.produto.id === p.id);
      const estoqueReal = saldoInfo ? Math.floor(saldoInfo.saldoVirtualTotal) : 0;

      await prisma.produto.upsert({
        where: { codigo: String(p.codigo || p.id) },
        update: { nome: p.nome, preco: p.preco || 0, estoque: estoqueReal },
        create: {
          codigo: String(p.codigo || p.id),
          nome: p.nome,
          preco: p.preco || 0,
          estoque: estoqueReal,
          lojistaId: integracao.lojistaId,
          situacao: 'A'
        }
      });
    }
    return NextResponse.json({ success: true, total: produtosBling.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, nome, preco, estoque } = await request.json();
    const atualizado = await prisma.produto.update({
      where: { id },
      data: { nome, preco: parseFloat(preco), estoque: parseInt(estoque) }
    });
    return NextResponse.json({ success: true, produto: atualizado });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao editar' }, { status: 500 });
  }
}