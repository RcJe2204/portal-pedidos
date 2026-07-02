import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function GET() {
  try {
    // Busca os produtos que o Bling acabou de salvar no banco
    const produtos = await prisma.produto.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Traduz o formato do banco para o formato que a sua página (p.estoque.saldoVirtualTotal) entende
    const resultado = produtos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      preco: p.preco,
      // Aqui está o segredo: transformamos o número em objeto para a tela não quebrar
      estoque: { 
        saldoVirtualTotal: p.estoque || 0 
      },
      situacao: p.situacao || 'A',
      categoria: null
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao listar:', error);
    return NextResponse.json({ error: 'Erro ao carregar lista' }, { status: 500 });
  }
}

// Mantemos o POST aqui também para o botão de sincronizar continuar funcionando
export async function POST(request: NextRequest) {
  // ... (mantenha a lógica de sincronização que enviamos antes)
}