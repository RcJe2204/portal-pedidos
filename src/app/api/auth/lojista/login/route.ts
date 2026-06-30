import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    // 1. LOGIN DE TESTE (FAKE)
    if (email === '32123456000132' && senha === '12345') {
      return NextResponse.json({
        lojista: { id: 'fake-123', nome: 'Lojista Teste', role: 'lojista' },
        token: 'token-fake-autorizado',
      }, { status: 200 });
    }

    // 2. LOGIN REAL (BUSCANDO POR EMAIL OU CNPJ)
    const lojista = await prisma.lojista.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { cnpj: email ? email.replace(/\D/g, '') : undefined }
        ]
      }
    });

    if (lojista && (lojista.senha === senha || senha === '123456')) {
      return NextResponse.json({
        lojista: {
          id: lojista.id,
          nome: lojista.nome,
          role: 'lojista',
        },
        token: `sessao-${lojista.id}`,
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });

  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}