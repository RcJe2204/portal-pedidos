import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || DB_URL,
    },
  },
});

export async function POST(request: NextRequest) {
  try {
    const integracao = await (prisma as any).integracao.findFirst({
      where: { tipo: 'BLING' }
    });

    if (!integracao || !integracao.token) {
      return NextResponse.json({ error: 'Bling não conectado.' }, { status: 400 });
    }

    // Mudamos a URL para pegar produtos de qualquer data e situação
    const response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100&criterio=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integracao.token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na comunicação com Bling' }, { status: response.status });
    }

    const data = await response.json();
    const produtos = data.data || [];

    // Se vieram produtos, vamos apenas avisar quantos foram encontrados por enquanto
    return NextResponse.json({ 
      success: true, 
      mensagem: `Encontramos ${produtos.length} produtos no seu Bling!`,
      quantidade: produtos.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', mensagem: error.message }, { status: 500 });
  }
}