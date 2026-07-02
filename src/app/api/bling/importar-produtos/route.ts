import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Configuração do Prisma com o link direto do banco (Plano B)
const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function POST(request: NextRequest) {
  try {
    // 1. Busca o Token do Bling no banco
    const integracao = await (prisma as any).integracao.findFirst({
      where: { tipo: 'BLING' }
    });

    if (!integracao || !integracao.token) {
      return NextResponse.json({ error: 'Bling não conectado. Acesse /api/bling/auth' }, { status: 400 });
    }

    // 2. Puxa produtos do Bling usando a URL correta (api.bling.com.br)
    // Adicionamos o critério 2 (Ativos) para garantir que venham dados
    const response = await fetch('https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=2', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integracao.token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: 'Bling recusou a conexão', detalhes: errorData }, { status: response.status });
    }

    const blingData = await response.json();
    const produtosBling = blingData.data || [];

    if (produtosBling.length === 0) {
      return NextResponse.json({ success: true, totalImportado: 0, mensagem: "Bling não retornou produtos ativos." });
    }

    // 3. SALVA NO BANCO DE DADOS (Usando os nomes exatos do seu schema.prisma)
    let salvos = 0;
    for (const p of produtosBling) {
      try {
        // No seu schema, o campo único é 'codigo'
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
        salvos++;
      } catch (e: any) {
        console.error(`Erro ao salvar produto ${p.nome}:`, e.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalImportado: salvos, 
      mensagem: `Sucesso! ${salvos} produtos sincronizados.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', mensagem: error.message }, { status: 500 });
  }
}