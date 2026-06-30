import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Busca um lojista pelo ID
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
      where: { id },
      include: {
        listaPreco: true
      }
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

// PUT: Atualiza todos os dados do lojista
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
    
    const dataToUpdate: any = {
      nome: body.nome,
      cnpj: body.cnpj,
      cidade: body.cidade,
      situacao: body.situacao,
      telefone: body.telefone,
      email: body.email,
    };

    if (body.listaPrecoId && body.listaPrecoId !== "") {
      dataToUpdate.listaPrecoId = body.listaPrecoId;
    } else {
      dataToUpdate.listaPrecoId = null;
    }

    const lojista = await prisma.lojista.update({
      where: { id: id },
      data: dataToUpdate
    });

    return NextResponse.json(lojista);
  } catch (error: any) {
    console.error('Erro ao salvar lojista (PUT):', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'A Lista de Preço selecionada é inválida ou não existe.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Atualiza dados específicos (como apenas o acesso ao portal)
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
        acessoPortal: body.acessoPortal
      }
    });

    return NextResponse.json(lojista);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Exclui o lojista e limpa todos os seus vínculos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.preco_lojista.deleteMany({ where: { cliente_id: id } });
    await prisma.pedidoUpload.deleteMany({ where: { lojistaId: id } });
    await prisma.lojista.delete({ where: { id: id } });

    return NextResponse.json({ message: 'Lojista excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}