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
    return NextResponse.json({ error: 'Código não encontrado na URL. Inicie pelo link /auth' }, { status: 400 });
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
        code,
        redirect_uri: BLING_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro no Bling', details: data }, { status: response.status });
    }

    // Salvando no banco usando 'as any' para evitar erros de tipagem no build
    await (prisma as any).integracao.upsert({
      where: { tipo: 'BLING' },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        updatedAt: new Date(),
      },
      create: {
        tipo: 'BLING',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      },
    });

    return NextResponse.redirect(new URL('/admin', request.url));
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}