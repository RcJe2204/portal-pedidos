import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Listar todas as listas de preço (COM LOJISTA INCLUÍDO)
export async function GET() {
  try {
    const listas = await prisma.listaPreco.findMany({
      include: {
        lojista: true // Ajustado para o nome da relação no seu schema
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(listas);
  } catch (error) {
    console.error('Erro ao listar listas de preço:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar listas de preço.' },
      { status: 500 }
    );
  }
}

// POST: Criar nova lista de preço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nome || !body.lojistaId) {
      return NextResponse.json(
        { error: 'Nome da lista e lojistaId são obrigatórios.' },
        { status: 400 }
      );
    }

    // Ajustado para usar apenas os campos que existem no seu schema.prisma
    const lista = await prisma.listaPreco.create({
      data: {
        nome: body.nome,
        lojistaId: body.lojistaId
      }
    });

    return NextResponse.json(lista, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lista de preço:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lista de preço.' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar lista de preço
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da lista é obrigatório.' },
        { status: 400 }
      );
    }

    const lista = await prisma.listaPreco.update({
      where: { id },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.lojistaId !== undefined && { lojistaId: body.lojistaId }),
      }
    });

    return NextResponse.json(lista);
  } catch (error) {
    console.error('Erro ao atualizar lista de preço:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lista de preço.' },
      { status: 500 }
    );
  }
}

// DELETE: Excluir lista de preço
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da lista é obrigatório.' },
        { status: 400 }
      );
    }

    // No seu schema, o Lojista não possui listaPrecoId, 
    // a relação é direta da ListaPreco para o Lojista.
    await prisma.listaPreco.delete({ where: { id } });

    return NextResponse.json({ message: 'Lista excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir lista de preço:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lista de preço.' },
      { status: 500 }
    );
  }
}