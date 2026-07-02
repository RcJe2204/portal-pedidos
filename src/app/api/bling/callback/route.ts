import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

const BLING_CLIENT_ID = '9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8';
const BLING_CLIENT_SECRET = '3d7463612526fa929d2d9428e50a12a0f862c15b456cb0cafd7521fb7fdc';
const BLING_REDIRECT_URI = 'https://main.d66m6u9ly2t4o.amplifyapp.com/api/bling/callback';

export async function GET(request: NextRequest) {
  // Pega a URL completa que o Bling enviou
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Se não achar o código, vamos mostrar o que o Bling enviou para diagnosticar
  if (!code) {
    return NextResponse.json({ 
      error: 'Bling não enviou o código de autorização.',
      url_recebida: request.url,
      ajuda: 'Verifique se a URL de Callback no Bling é idêntica à BLING_REDIRECT_URI do código.'
    }, { status: 400 });
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
      return NextResponse.json({ error: 'Erro na troca do token no Bling', detalhes: data }, { status: response.status });
    }

    // Busca o lojista para salvar
    const lojista = await prisma.lojista.findFirst();
    if (!lojista) {
      return NextResponse.json({ error: 'Nenhum lojista encontrado no banco.' }, { status: 500 });
    }

    // Salva o token usando os campos do seu schema.prisma
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

    // Se chegou aqui, deu certo! Redireciona para o admin
    return NextResponse.redirect(new URL('/admin', request.url));

  } catch (error) {
    console.error('Erro crítico no callback:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o token.' }, { status: 500 });
  }
}