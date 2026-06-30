import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

// --- FUNÇÃO PARA O ADMIN VER A LISTA ---
export async function GET() {
  try {
    const uploads = await prisma.pedidoUpload.findMany({
      include: {
        lojista: {
          select: { nome: true, cnpj: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(uploads);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar lista' }, { status: 500 });
  }
}

// --- FUNÇÃO PARA O LOJISTA ENVIAR O PDF ---
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const lojistaId = formData.get('lojistaId') as string | null;

    if (!file || !lojistaId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pedidos');
    await mkdir(uploadDir, { recursive: true });

    const nomeArquivoUnico = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const fullPath = path.join(uploadDir, nomeArquivoUnico);
    const urlRelativa = `/uploads/pedidos/${nomeArquivoUnico}`;

    await writeFile(fullPath, buffer);

    const registro = await prisma.pedidoUpload.create({
      data: {
        arquivoUrl: urlRelativa,
        lojistaId: lojistaId,
        status: 'pendente',
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no upload' }, { status: 500 });
  }
}