import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });
  }

  try {
    // 1. Troca o código pelo token no Bling
    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || 'Erro ao obter token');
    }

    // 2. Salva ou atualiza a integração no banco
    // AJUSTE: Buscamos a primeira integração em vez de filtrar por 'nome'
    const integracaoExistente = await prisma.integracao.findFirst();

    if (integracaoExistente) {
      await prisma.integracao.update({
        where: { id: integracaoExistente.id },
        data: {
          token: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in
        }
      });
    } else {
      // Se não existir nenhuma, criamos a primeira (precisa de um lojistaId válido)
      const lojista = await prisma.lojista.findFirst();
      if (!lojista) throw new Error('Nenhum lojista cadastrado para vincular a integração');

      await prisma.integracao.create({
        data: {
          token: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          lojistaId: lojista.id,
          tipo: 'BLING'
        }
      });
    }

    // 3. Redireciona de volta para o painel
    return NextResponse.redirect(new URL('/admin/clientes', request.url));

  } catch (error: any) {
    console.error('Erro no callback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}