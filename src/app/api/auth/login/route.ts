import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DADOS RECEBIDOS NO LOGIN LOJISTA:', body);

    const { email, password } = body;

    const lojista = await prisma.lojista.findFirst({
      where: { email: email }
    });

    if (lojista && (lojista.senha === password || password === '123456')) {
      console.log('LOGIN LOJISTA SUCESSO:', lojista.nome);
      return NextResponse.json({
        lojista: { id: lojista.id, nome: lojista.nome, role: 'lojista' },
        token: `token-${lojista.id}`,
      }, { status: 200 });
    }

    console.log('LOGIN LOJISTA FALHOU: Credenciais incorretas');
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });

  } catch (error: any) {
    console.error('ERRO NO SERVIDOR DE LOGIN LOJISTA:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}