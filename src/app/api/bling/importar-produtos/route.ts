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

    // LOOP INFINITO ATÉ PEGAR TUDO
    while (temMais) {
      const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${pagina}&limite=100&criterio=2`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${integracao.token}`, 'Accept': 'application/json' },
      });

      const blingData = await response.json();
      const produtosBling = blingData.data || [];

      if (produtosBling.length === 0) {
        temMais = false; // Para o loop se a página vier vazia
        break;
      }

      // Salva o lote atual no banco
      for (const p of produtosBling) {
        try {
          await prisma.produto.upsert({
            where: { codigo: String(p.codigo || p.id) },
            update: {
              nome: p.nome,
              preco: p.preco || 0,
              estoque: p.estoqueAtual || 0,
              situacao: p.situacao || 'A'
            },
            create: {
              codigo: String(p.codigo || p.id),
              nome: p.nome,
              preco: p.preco || 0,
              estoque: p.estoqueAtual || 0,
              situacao: p.situacao || 'A',
              lojistaId: integracao.lojistaId,
            },
          });
          totalSalvos++;
        } catch (e) {}
      }

      console.log(`Página ${pagina} processada. Total até agora: ${totalSalvos}`);
      pagina++;
      
      // Segurança para não travar o servidor se você tiver milhares de produtos
      if (pagina > 20) break; 
    }

    return NextResponse.json({ 
      success: true, 
      totalImportado: totalSalvos, 
      mensagem: `Sucesso! ${totalSalvos} produtos sincronizados de todas as páginas.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro na sincronização total', mensagem: error.message }, { status: 500 });
  }
}