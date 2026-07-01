import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Sem código' }, { status: 400 });
  try {
    const auth = Buffer.from(`${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code })
    });
    const data = await res.json();
    const integracao = await prisma.integracao.findFirst();
    if (integracao) {
      await prisma.integracao.update({
        where: { id: integracao.id },
        data: { token: data.access_token, refreshToken: data.refresh_token }
      });
    }
    return NextResponse.redirect(new URL('/admin/clientes', request.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}