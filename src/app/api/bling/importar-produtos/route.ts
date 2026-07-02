import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";

// Link do banco de reserva caso a variável da Amazon falhe
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
    // 1. Busca a integração do Bling no banco
    const integracao = await (prisma as any).integracao.findFirst({
      where: { tipo: 'BLING' }
    });

    if (!integracao || !integracao.token) {
      return NextResponse.json({ 
        error: 'Bling não conectado', 
        dica: 'Acesse /api/bling/auth para conectar primeiro.' 
      }, { status: 400 });
    }

    // 2. Faz a chamada real para o Bling (puxando os 10 primeiros produtos como teste)
    const response = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${integracao.token}`,
        'Accept': 'application/json',
      },
    });

    // Se o Bling responder algo que não é JSON, o erro "Unexpected end of JSON input" acontece aqui.
    // Por isso, vamos verificar se a resposta está OK antes de tentar ler o JSON.
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: 'O Bling recusou a conexão', 
        status: response.status,
        detalhes: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    // 3. Retorna o sucesso para o seu painel
    return NextResponse.json({ 
      success: true, 
      mensagem: 'Sincronização iniciada com sucesso!',
      produtos_encontrados: data.data?.length || 0 
    });

  } catch (error: any) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json({ 
      error: 'Erro interno na sincronização', 
      mensagem: error.message 
    }, { status: 500 });
  }
}