import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID do lojista não fornecido' }, { status: 400 });
    }

    const lojista = await prisma.lojista.findUnique({
      where: { id }
    });

    if (!lojista) {
      return NextResponse.json({ error: 'Lojista não encontrado' }, { status: 404 });
    }

    return NextResponse.json(lojista);
  } catch (error: any) {
    console.error('Erro ao buscar lojista (GET):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do lojista não fornecido' }, { status: 400 });
    }

    const body = await request.json();
    
    const lojista = await prisma.lojista.update({
      where: { id: id },
      data: {
        nome: body.nome,
        documento: body.cnpj ?? body.documento,
        email: body.email,
      }
    });

    return NextResponse.json(lojista);
  } catch (error: any) {
    console.error('Erro ao salvar lojista (PUT):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const lojista = await prisma.lojista.update({
      where: { id: id },
      data: {
        saldo: body.saldo
      }
    });

    return NextResponse.json(lojista);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.pedidoUpload.deleteMany({ where: { lojistaId: id } });
    await prisma.lojista.delete({ where: { id: id } });

    return NextResponse.json({ message: 'Lojista excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}