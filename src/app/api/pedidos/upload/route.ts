import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const lojistaId = formData.get('lojistaId') as string | null;

    // Validação: Verifica se o arquivo e o ID do lojista foram enviados
    if (!file || !lojistaId) {
      return NextResponse.json(
        { error: 'Arquivo e ID do lojista são obrigatórios' }, 
        { status: 400 }
      );
    }

    // 1. Converte o arquivo para Buffer para poder salvar no disco
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Define o caminho da pasta (public/uploads/pedidos)
    // O recursive: true garante que o sistema crie as pastas caso não existam
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pedidos');
    await mkdir(uploadDir, { recursive: true });

    // 3. Cria um nome único para o arquivo usando o timestamp atual
    const nomeArquivoUnico = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const fullPath = path.join(uploadDir, nomeArquivoUnico);
    const urlRelativa = `/uploads/pedidos/${nomeArquivoUnico}`;

    // 4. Escreve o arquivo físico na pasta
    await writeFile(fullPath, buffer);

    // 5. Cria o registro no banco de dados Prisma
    const registroUpload = await prisma.pedidoUpload.create({
      data: {
        arquivoUrl: urlRelativa,
        lojistaId: lojistaId,
        status: 'pendente',
      },
    });

    return NextResponse.json(registroUpload, { status: 201 });

  } catch (error: any) {
    console.error('Erro no processamento do upload:', error);
    return NextResponse.json(
      { error: 'Falha interna ao processar o upload do arquivo' }, 
      { status: 500 }
    );
  }
}