import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

// Função para BUSCAR os uploads (O que estava dando erro no build)
export async function GET() {
  try {
    const uploads = await prisma.pedidoUpload.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lojista: { select: { nome: true } } } // Agora o Prisma vai aceitar isso!
    });
    return NextResponse.json(uploads);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar uploads' }, { status: 500 });
  }
}

// Função para SALVAR o upload (O código que você me mandou)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const lojistaId = formData.get('lojistaId') as string | null;

    if (!file || !lojistaId) {
      return NextResponse.json({ error: 'Arquivo e ID do lojista são obrigatórios' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pedidos');
    await mkdir(uploadDir, { recursive: true });

    const nomeArquivoUnico = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const fullPath = path.join(uploadDir, nomeArquivoUnico);
    const urlRelativa = `/uploads/pedidos/${nomeArquivoUnico}`;

    await writeFile(fullPath, buffer);

    const registroUpload = await prisma.pedidoUpload.create({
      data: {
        arquivoUrl: urlRelativa,
        lojistaId: lojistaId,
        status: 'pendente',
      },
    });

    return NextResponse.json(registroUpload, { status: 201 });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}