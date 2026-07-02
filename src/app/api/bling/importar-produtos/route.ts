import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function POST(request: NextRequest) {
  try {
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao || !integracao.token) return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });

    let pagina = 1;
    let totalSalvos = 0;
    let temMais = true;

    while (temMais) {
      // 1. Busca a lista de produtos
      const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pagina}&limite=100&criterio=2`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${integracao.token}`, 'Accept': 'application/json' },
      });

      const blingData = await response.json();
      const produtosBling = blingData.data || [];

      if (produtosBling.length === 0) {
        temMais = false;
        break;
      }

      for (const p of produtosBling) {
        try {
          // 2. PASSO EXTRA: Busca o estoque real deste produto específico
          // Na V3, o estoque muitas vezes precisa ser consultado pelo ID do produto
          const resEstoque = await fetch(`https://api.bling.com.br/Api/v3/estoques/saldos?idsProdutos[]=${p.id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${integracao.token}`, 'Accept': 'application/json' },
          });
          
          const estoqueData = await resEstoque.json();
          // Pega o saldo virtual total (soma de todos os depósitos)
          const saldoReal = estoqueData.data?.[0]?.saldoVirtualTotal || 0;

          // 3. Salva no banco com o estoque atualizado
          await prisma.produto.upsert({
            where: { codigo: String(p.codigo || p.id) },
            update: {
              nome: p.nome,
              preco: p.preco || 0,
              estoque: Math.floor(saldoReal), // Salva o saldo vindo da API de estoque
              situacao: p.situacao || 'A'
            },
            create: {
              codigo: String(p.codigo || p.id),
              nome: p.nome,
              preco: p.preco || 0,
              estoque: Math.floor(saldoReal),
              situacao: p.situacao || 'A',
              lojistaId: integracao.lojistaId,
            },
          });
          totalSalvos++;
        } catch (e) {
          console.error(`Erro no produto ${p.id}:`, e);
        }
      }

      pagina++;
      if (pagina > 20) break; // Segurança
    }

    return NextResponse.json({ 
      success: true, 
      totalImportado: totalSalvos, 
      mensagem: `Sucesso! ${totalSalvos} produtos e seus estoques foram sincronizados.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro na sincronização', mensagem: error.message }, { status: 500 });
  }
}