import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extrai SKU (ex: N0065), quantidade e descrição do item de DANFE Shopee
function extrairDadosDanfe(texto: string) {
  const itens: any[] = [];

  // SKU: aparece como “ITEM N0065 -”
  const skuMatch = texto.match(/ITEM\s+(N\d{4,5})\s*-/i);

  // Descrição do item (linha inteira após o SKU)
  const descMatch = texto.match(/ITEM\s+N\d{4,5}\s*-\s*(.+?)\s*-\s*\d/i);

  // Quantidade: “1,00 UN”
  const qtdMatch = texto.match(/(\d+[.,]?\d*)\s*UN/i);

  if (skuMatch) {
    itens.push({
      sku: skuMatch[1],
      produto: descMatch ? descMatch[1].trim() : "Produto Shopee",
      quantidade: qtdMatch ? Number(qtdMatch[1].replace(",", ".")) : 1,
      categoria_nome: descMatch ? descMatch[1] : "Desconhecida"
    });
  }

  // Caso não encontre nada → fallback
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

// Nome da loja emissora (ex: LIVRARIA ESCAPE LTDA)
function extrairLoja(texto: string) {
  const lojaMatch = texto.match(/LIVRARIA\s+[A-Z ]+LTDA/i);
  return lojaMatch ? lojaMatch[0].trim() : "Loja não encontrada";
}

// Observações (parte final da DANFE)
function extrairObservacoes(texto: string) {
  const obsMatch = texto.match(/INFORMAÇÕES ADICIONAIS[\s\S]+/i);
  return obsMatch ? obsMatch[0].trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    const clienteId = data.get("clienteId") as string; // ID do lojista (UUID String)
    const canal = data.get("canal") as string;

    if (!file || !clienteId || !canal) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const texto = buffer.toString("latin1"); 

    const itensExtraidos = extrairDadosDanfe(texto);
    const loja = extrairLoja(texto);
    const observacoesDanfe = extrairObservacoes(texto);

    const itensParaSalvar = [];
    let total = 0;

    for (const item of itensExtraidos) {
      // Busca preço na tabela preco_lojista (conforme seu schema)
      const precoPersonalizado = await prisma.preco_lojista.findFirst({
        where: { 
          cliente_id: clienteId,
          categoria: item.categoria_nome 
        }
      });

      const precoUnit = precoPersonalizado?.preco ?? 0;
      const subtotal = precoUnit * item.quantidade;

      total += subtotal;

      itensParaSalvar.push({
        codigo: item.sku,
        nome: item.produto,
        quantidade: item.quantidade,
        precoUnitario: precoUnit,
        subtotal
      });
    }

    // === CRIAR PEDIDO (ALINHADO AO SCHEMA.PRISMA) ===
    const pedido = await prisma.pedido.create({
      data: {
        lojistaId: clienteId,      // Nome correto no schema
        plataforma: canal,         // Nome correto no schema
        total: total,
        status: "aguardando autorização", // Status padrão do seu schema
        observacao: `Loja: ${loja} | ${observacoesDanfe}`, // 'origem' não existe, vai para observação
        itens: JSON.stringify(itensParaSalvar) // Salva como String conforme o schema
      }
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (e) {
    console.error("Erro ao importar DANFE Shopee:", e);
    return NextResponse.json(
      { error: "Erro ao processar PDF" },
      { status: 500 }
    );
  }
}