import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Conexão direta para garantir que a página veja o banco da Amazon
const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function GET() {
  try {
    // 1. Busca todos os produtos no banco
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: 'asc' },
    });

    console.log(`[DEBUG] Produtos encontrados no banco: ${produtos.length}`);

    // 2. Formata os dados exatamente como o seu frontend espera
    // O segredo aqui é o estoque.saldoVirtualTotal
    const resultado = produtos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      preco: p.preco || 0,
      estoque: { 
        saldoVirtualTotal: p.estoque || 0 
      },
      situacao: p.situacao || 'A',
      categoria: 'Bling'
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao carregar lista', mensagem: error.message }, { status: 500 });
  }
}

// Mantemos o POST aqui também para o botão de sincronizar ter um "porto seguro"
export async function POST(request: NextRequest) {
  try {
    const integracao = await (prisma as any).integracao.findFirst({ where: { tipo: 'BLING' } });
    if (!integracao || !integracao.token) return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });

    const response = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=2', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${integracao.token}`, 'Accept': 'application/json' },
    });

    const blingData = await response.json();
    const produtosBling = blingData.data || [];

    let salvos = 0;
    for (const p of produtosBling) {
      await prisma.produto.upsert({
        where: { codigo: String(p.codigo || p.id) },
        update: { nome: p.nome, preco: p.preco || 0, estoque: p.estoqueAtual || 0 },
        create: {
          codigo: String(p.codigo || p.id),
          nome: p.nome,
          preco: p.preco || 0,
          estoque: p.estoqueAtual || 0,
          lojistaId: integracao.lojistaId,
        },
      });
      salvos++;
    }

    return NextResponse.json({ success: true, totalImportado: salvos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}