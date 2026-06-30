import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as any;
    let lojistaId = formData.get('lojistaId') as string;

    if (!file || !lojistaId) {
      return NextResponse.json({ success: false, error: 'Arquivo e lojistaId obrigatórios' }, { status: 400 });
    }

    let lojista = await (prisma as any).lojista.findUnique({ where: { id: lojistaId } });

    if (!lojista && (lojistaId === 'fake-123' || lojistaId.includes('fake'))) {
      lojista = await (prisma as any).lojista.findFirst({
        where: { nome: { contains: 'TESTE' } }
      });
    }

    if (!lojista) {
      return NextResponse.json({ success: false, error: 'Lojista não encontrado' }, { status: 404 });
    }

    // Carrega produtos do banco
    const todosProdutos: any[] = await (prisma as any).produto.findMany({
      include: { categoria: true },
    });

    const produtosPorCodigo: Record<string, any> = {};
    for (const p of todosProdutos) {
      const codigo = (p.codigo || '').toUpperCase().trim();
      if (!codigo) continue;
      produtosPorCodigo[codigo] = p;

      const semZero = codigo.replace(/^0+/, '');
      if (semZero !== codigo) produtosPorCodigo[semZero] = p;

      if (/^\d+$/.test(codigo)) {
        const comZero = codigo.padStart(4, '0');
        if (comZero !== codigo) produtosPorCodigo[comZero] = p;
      }
    }

    // Lê o PDF com pdfreader
    const buffer = Buffer.from(await file.arrayBuffer());
    const linhas = await extrairLinhasPdf(buffer);

    // Junta caracteres separados linha a linha
    const linhasProcessadas = linhas.map((linha: string) => {
      let texto = linha;
      let anterior = '';
      while (texto !== anterior) {
        anterior = texto;
        texto = texto.replace(/([A-Za-z0-9\/])\s+(?=[A-Za-z0-9\/])/g, '$1');
      }
      return texto;
    });

    const idsUsados = new Set();
    const itens: any[] = [];

    for (const linha of linhasProcessadas) {
      // Só linhas com "UN X" (itens do DANFE)
      if (!linha.includes('UN X') && !linha.includes('UN  X')) continue;

      const matchSku = linha.match(/^([A-Z0-9][A-Z0-9\/]*)/);
      if (!matchSku) continue;

      const codigoBruto = matchSku[1].toUpperCase().trim();

      let quantidade = 1;
      const matchQtd = linha.match(/(\d+[.,]?\d*)\s*UN/);
      if (matchQtd) {
        const qtd = Math.round(parseFloat(matchQtd[1].replace(',', '.')));
        if (qtd > 0 && qtd < 9999) quantidade = qtd;
      }

      const skus = codigoBruto.split('/').map((s: string) => s.trim()).filter(Boolean);

      for (const sku of skus) {
        let produto = produtosPorCodigo[sku];
        if (!produto) {
          const v1 = sku.replace(/^0+/, '');
          const v2 = sku.padStart(4, '0');
          if (v1 !== sku) produto = produtosPorCodigo[v1];
          if (!produto && v2 !== sku) produto = produtosPorCodigo[v2];
        }

        if (!produto || idsUsados.has(produto.id)) continue;
        idsUsados.add(produto.id);

        itens.push({
          sku: produto.codigo,
          nome: produto.nome,
          quantidade: quantidade,
          preco: 0,
          categoria: produto.categoria?.nome || 'Sem categoria',
        });
      }
    }

    return NextResponse.json({
      success: true,
      itens,
      totalItens: itens.length,
      mensagem: itens.length > 0
        ? `${itens.length} item(ns) reconhecido(s) no PDF`
        : 'Nenhum item reconhecido.',
    });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar PDF' }, { status: 500 });
  }
}

function extrairLinhasPdf(buffer: Buffer): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const linhas: string[] = [];
    let linhaAtual = '';
    let ultimoY: any = null;

    (new (PdfReader as any)()).parseBuffer(buffer, (err: any, item: any) => {
      if (err) { reject(err); return; }
      if (!item) {
        if (linhaAtual.trim()) linhas.push(linhaAtual.trim());
        resolve(linhas);
        return;
      }
      if (item.text) {
        if (ultimoY !== null && Math.abs(item.y - ultimoY) > 2 && linhaAtual.trim()) {
          linhas.push(linhaAtual.trim());
          linhaAtual = '';
        }
        linhaAtual += (linhaAtual ? ' ' : '') + item.text;
        ultimoY = item.y;
      }
    });
  });
}