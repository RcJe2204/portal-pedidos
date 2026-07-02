import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

const BLING_CLIENT_ID = '9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8';
const BLING_CLIENT_SECRET = '3d7463612526fa929d2d9428e50a12a0f862c15b456cb0cafd7521fb7fdc';
const BLING_REDIRECT_URI = 'https://main.d66m6u9ly2t4o.amplifyapp.com/api/bling/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código não enviado pelo Bling.' }, { status: 400 });
  }

  try {
    const authHeader = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
        'Accept': '1.0',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: BLING_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na troca do token', detalhes: data }, { status: response.status });
    }

    // TESTE DE BANCO: Vamos ver se o Prisma consegue ler o banco
    let lojista;
    try {
      lojista = await prisma.lojista.findFirst();
    } catch (dbError: any) {
      return NextResponse.json({ 
        error: 'Erro ao conectar no Banco de Dados', 
        mensagem: dbError.message,
        dica: 'Verifique se a DATABASE_URL está correta na AWS Amplify.'
      }, { status: 500 });
    }
    
    if (!lojista) {
      return NextResponse.json({ error: 'Nenhum lojista cadastrado no banco.' }, { status: 500 });
    }

    // Tenta salvar a integração
    try {
      await (prisma as any).integracao.upsert({
        where: { id: 'bling-main-auth' },
        update: {
          token: data.access_token,
          updatedAt: new Date(),
        },
        create: {
          id: 'bling-main-auth',
          tipo: 'BLING',
          token: data.access_token,
          lojistaId: lojista.id,
        },
      });
    } catch (saveError: any) {
      return NextResponse.json({ 
        error: 'Erro ao salvar o token na tabela Integracao', 
        mensagem: saveError.message 
      }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/admin', request.url));

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro crítico desconhecido', mensagem: error.message }, { status: 500 });
  }
}