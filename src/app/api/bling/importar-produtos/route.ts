import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const integracao = await prisma.integracao.findFirst();
    if (!integracao) return NextResponse.json({ error: 'Sem integração' }, { status: 404 });

    let catGeral = await prisma.categoria.findFirst({ where: { nome: 'Geral' } });
    if (!catGeral) catGeral = await prisma.categoria.create({ data: { nome: 'Geral' } });

    const res = await fetch(`https://www.bling.com.br/Api/v3/produtos?limite=100`, {
      headers: { 'Authorization': `Bearer ${integracao.token}` }
    });
    const json = await res.json();
    const itens = json.data || [];

    for (const p of itens) {    
      await prisma.produto.upsert({
        where: { codigo: String(p.codigo || p.id) },
        update: { nome: p.nome, preco: Number(p.preco || 0), categoriaId: catGeral.id, lojistaId: integracao.lojistaId },
        create: { codigo: String(p.codigo || p.id), nome: p.nome, preco: Number(p.preco || 0), categoriaId: catGeral.id, lojistaId: integracao.lojistaId }
      });
    }
    return NextResponse.json({ success: true, total: itens.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}