import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

const DB_URL = "postgresql://postgres:Rcje12345!@portal-pedidos-db.cvuim8mgqyf7.sa-east-1.rds.amazonaws.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || DB_URL } },
});

export async function POST(request: NextRequest) {
  try {
    const integracao = await (prisma as any).integracao.findFirst({
      where: { tipo: 'BLING' }
    });

    if (!integracao || !integracao.token) {
      return NextResponse.json({ error: 'Bling não conectado.' }, { status: 400 });
    }

    // TENTATIVA 1: Busca simples (Padrão)
    const response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integracao.token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // Se vier zero, vamos retornar o objeto 'data' inteiro para eu analisar
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ 
        success: true, 
        mensagem: "O Bling retornou 0 produtos.",
        debug_bling: data, // Isso vai me mostrar se o Bling mandou algum aviso oculto
        verificacao: [
          "1. Você tem produtos cadastrados no Bling?",
          "2. Eles estão com o status 'Ativo'?",
          "3. No Bling, vá em 'Configurações -> Usuários' e veja se o seu usuário tem permissão de API para Produtos."
        ]
      });
    }

    return NextResponse.json({ 
      success: true, 
      mensagem: `Sucesso! Encontramos ${data.data.length} produtos.`,
      quantidade: data.data.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno', mensagem: error.message }, { status: 500 });
  }
}