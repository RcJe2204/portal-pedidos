import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function extrairDadosDanfe(texto: string) {
  const itens: any[] = [];

  const skuMatch = texto.match(/ITEM\s+(N\d{4,5})\s*-/i);
  const descMatch = texto.match(/ITEM\s+N\d{4,5}\s*-\s*(.+?)\s*-\s*\d/i);
  const qtdMatch = texto.match(/(\d+[.,]?\d*)\s*UN/i);

  if (skuMatch) {
    itens.push({
      sku: skuMatch[1],
      produto: descMatch ? descMatch[1].trim() : "Produto Shopee",
      quantidade: qtdMatch ? Number(qtdMatch[1].replace(",", ".")) : 1,
      categoria_nome: descMatch ? descMatch[1] : "Desconhecida"
    });
  }

  if (itens.length === 0) {
    itens.push({
      sku: "FALHA-EXTRACAO",
      produto: "Item não identificado",
      quantidade: 1,
      categoria_nome: "Desconhecida"
    });
  }

  return itens;
}

function extrairLoja(texto: string) {
  const lojaMatch = texto.match(/LIVRARIA\s+[A-Z ]+LTDA/i);
  return lojaMatch ? lojaMatch[0].trim() : "Loja não encontrada";
}

function extrairObservacoes(texto: string) {
  const obsMatch = texto.match(/INFORMAÇÕES ADICIONAIS[\s\S]+/i);
  return obsMatch ? obsMatch[0].trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    const clienteId = data.get("clienteId") as string;
    const canal = data.get("canal") as string;

    if (!file || !clienteId || !canal) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const texto = buffer.toString("latin1"); 

    const itensExtraidos = extrairDadosDanfe(texto);
    const loja = extrairLoja(texto);
    const observacoesDanfe = extrairObservacoes(texto);

    let total = 0;

    for (const item of itensExtraidos) {
      const produto = await prisma.produto.findUnique({
        where: { sku: item.sku }
      });

      let precoUnit = 0;

      if (produto) {
        precoUnit = Number(produto.precoBase);
      }

      const subtotal = precoUnit * item.quantidade;
      total += subtotal;
    }

    const pedido = await prisma.pedido.create({
      data: {
        lojistaId: clienteId,      
        plataforma: canal,         
        total: total,
        status: "pendente"
      }
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (e: any) {
    console.error("Erro ao importar DANFE Shopee:", e);
    return NextResponse.json(
      { error: "Erro ao processar PDF: " + e.message },
      { status: 500 }
    );
  }
}