import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Conexão direta com o banco da Amazon (RDS) - Plano B infalível
const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

// --- 1. LISTAR PRODUTOS (GET) ---
// Esta função garante que os 287 produtos apareçam na sua tela instantaneamente
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
      estoque: { 
        saldoVirtualTotal: p.estoque || 0 
      },
      situacao: p.situacao || 'A',
      categoria: p.categoria?.nome || 'Bling'
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao carregar lista', mensagem: error.message }, { status: 500 });
  }
}

// --- 2. SINCRONIZAR COM BLING (POST) ---
// Esta função puxa todos os produtos e estoques de forma ultra rápida
export async function POST() {
  try {
    const integracao = await (prisma as any).integracao.findFirst({
      where: { tipo: 'BLING' }
    });

    if (!integracao || !integracao.token) {
      return NextResponse.json({ error: 'Bling não conectado' }, { status: 400 });
    }

    const produtosBling: any[] = [];
    
    // Loop para pegar todas as páginas (até 300 produtos)
    for (let i = 1; i <= 3; i++) {
      const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?pagina=${i}&limite=100&criterio=2`, {
        headers: { 
          'Authorization': `Bearer ${integracao.token}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        produtosBling.push(...data.data);
      }
      if (!data.data || data.data.length < 100) break;
    }

    if (produtosBling.length === 0) {
      return NextResponse.json({ success: true, total: 0, mensagem: "Nenhum produto ativo encontrado." });
    }

    // Salvamento em massa (Transaction) para evitar erro de JSON/Timeout
    await prisma.$transaction(
      produtosBling.map(p => prisma.produto.upsert({
        where: { codigo: String(p.codigo || p.id) },
        update: { 
          nome: p.nome, 
          preco: p.preco || 0,
          situacao: p.situacao || 'A'
        },
        create: {
          codigo: String(p.codigo || p.id),
          nome: p.nome,
          preco: p.preco || 0,
          estoque: 0,
          situacao: p.situacao || 'A',
          lojistaId: integracao.lojistaId,
        }
      }))
    );

    return NextResponse.json({ 
      success: true, 
      totalImportado: produtosBling.length,
      mensagem: `Sucesso! ${produtosBling.length} produtos sincronizados.` 
    });

  } catch (error: any) {
    console.error("Erro na sincronização:", error.message);
    return NextResponse.json({ error: 'Erro interno', detalhes: error.message }, { status: 500 });
  }
}

// --- 3. EDITAR PRODUTO (PATCH) ---
// Permite que você mude nome, preço e estoque direto na tabela
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, preco, estoque } = body;

    const produtoAtualizado = await prisma.produto.update({
      where: { id: id },
      data: {
        nome: nome,
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
      }
    });

    return NextResponse.json({ success: true, produto: produtoAtualizado });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao editar', detalhes: error.message }, { status: 500 });
  }
}