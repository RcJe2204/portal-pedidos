import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });

  try {
    const clientId = '9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8';
    const clientSecret = '3d7463612526fa929d2d9428e50a12a0f862c15b456cb0cafd7521fb7fdc'; // <--- COLOQUE O SEU SECRET AQUI

    const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3000/api/bling/callback'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'Erro ao trocar token');

    // Salva na tabela Integracao que criamos no seu schema
    await prisma.integracao.upsert({
      where: { nome: 'Bling' },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: new Date(Date.now() + data.expires_in * 1000)
      },
      create: {
        nome: 'Bling',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: new Date(Date.now() + data.expires_in * 1000)
      }
    });

    // Volta para a página de produtos
    return NextResponse.redirect(new URL('/admin/produtos', request.url));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}