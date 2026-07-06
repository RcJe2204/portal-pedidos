import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao || !integracao.token) return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });

    let pagina = 1;
    let totalSalvos = 0;
    let temMais = true;

    while (temMais) {
      const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pagina}&limite=100`, {
        headers: { 'Authorization': `Bearer ${integracao.token}` },
      });

      const blingData = await response.json();
      const produtosBling = blingData.data || [];

      if (produtosBling.length === 0) {
        temMais = false;
        break;
      }

      for (const p of produtosBling) {
        const sku = String(p.codigo || p.id);

        const resEstoque = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${p.id}`, {
          headers: { 'Authorization': `Bearer ${integracao.token}` },
        });
        const estoqueData = await resEstoque.json();
        const saldoReal = estoqueData.data?.[0]?.saldoVirtualTotal || 0;

        await prisma.produto.upsert({
          where: { sku },
          update: {
            nome: p.nome,
            descricao: p.descricao || null,
            precoBase: p.preco || 0,
            estoque: Math.floor(saldoReal),
          },
          create: {
            sku,
            nome: p.nome,
            descricao: p.descricao || null,
            precoBase: p.preco || 0,
            estoque: Math.floor(saldoReal),
            lojistaId: integracao.lojistaId,
          },
        });
        totalSalvos++;
      }
      pagina++;
      if (pagina > 10) break;
    }

    return NextResponse.json({ success: true, total: totalSalvos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}