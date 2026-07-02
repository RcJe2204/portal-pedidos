import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function POST(request: NextRequest) {
  try {
    // 1. Busca o Token do Bling
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao || !integracao.token) {
      return NextResponse.json({ error: 'Bling não conectado.' }, { status: 400 });
    }

    // 2. Puxa os produtos do Bling (Sem filtros para vir tudo)
    const response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${integracao.token}`, 'Accept': 'application/json' },
    });

    const blingData = await response.json();
    const produtosBling = blingData.data || [];

    if (produtosBling.length === 0) {
      return NextResponse.json({ 
        success: true, 
        mensagem: "O Bling não entregou nenhum produto. Verifique se há produtos ativos no painel do Bling.",
        debug: blingData 
      });
    }

    // 3. SALVA NO BANCO DE DADOS (O pulo do gato)
    let contagem = 0;
    for (const p of produtosBling) {
      try {
        await (prisma as any).produto.upsert({
          where: { sku: p.codigo || `SKU-${p.id}` },
          update: {
            nome: p.nome,
            preco: p.preco || 0,
            estoque: p.estoqueAtual || 0,
          },
          create: {
            nome: p.nome,
            sku: p.codigo || `SKU-${p.id}`,
            preco: p.preco || 0,
            estoque: p.estoqueAtual || 0,
            lojistaId: integracao.lojistaId
          },
        });
        contagem++;
      } catch (e) {
        console.log("Erro ao salvar produto individual:", e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      mensagem: `Sucesso! ${contagem} produtos foram sincronizados e salvos no banco.`,
      quantidade: contagem 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro na sincronização', mensagem: error.message }, { status: 500 });
  }
}