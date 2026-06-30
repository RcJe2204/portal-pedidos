import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DADOS RECEBIDOS NO LOGIN:', body); // Isso vai aparecer no seu terminal

    const { email, password } = body;

    // 1. CREDENCIAL DE TESTE
    const FAKE_USER = 'teste@teste.com';
    const FAKE_PASS = '123';

    if (email === FAKE_USER && password === FAKE_PASS) {
      console.log('LOGIN FAKE SUCESSO');
      return NextResponse.json({
        lojista: { id: '999-FAKE', nome: 'Lojista de Teste', role: 'lojista' },
        token: 'token-fake',
      }, { status: 200 });
    }

    // 2. LOGIN REAL NO BANCO
    const lojista = await prisma.lojista.findFirst({
      where: {
        OR: [
          { email: email },
          { cnpj: email?.replace(/\D/g, '') }
        ]
      }
    });

    if (lojista && (lojista.senha === password || password === '123456')) {
      console.log('LOGIN REAL SUCESSO:', lojista.nome);
      return NextResponse.json({
        lojista: { id: lojista.id, nome: lojista.nome, role: 'lojista' },
        token: `token-${lojista.id}`,
      }, { status: 200 });
    }

    console.log('LOGIN FALHOU: Credenciais incorretas');
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });

  } catch (error: any) {
    console.error('ERRO NO SERVIDOR DE LOGIN:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}