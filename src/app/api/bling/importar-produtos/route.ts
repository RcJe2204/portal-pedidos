import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // AJUSTE: Buscamos a primeira integração disponível em vez de filtrar por 'nome'
    const integracao = await prisma.integracao.findFirst();
    
    if (!integracao) {
      return NextResponse.json({ error: 'Configuração não encontrada.' }, { status: 404 });
    }

    // Garante que existe uma categoria padrão chamada 'Geral'
    let categoriaPadrao = await prisma.categoria.findFirst({
      where: { nome: 'Geral' }
    });

    if (!categoriaPadrao) {
      categoriaPadrao = await prisma.categoria.create({
        data: { nome: 'Geral' }
      });
    }

    const token = integracao.token;
    let todosProdutos: any[] = [];
    let pagina = 1;
    let temMais = true;

    console.log('--- INICIANDO BUSCA NO BLING ---');

    while (temMais) {
      const url = `https://www.bling.com.br/Api/v3/produtos?limite=100&pagina=${pagina}`;
      
      const respostaBling = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const dadosJson = await respostaBling.json();
      const itens = dadosJson.data || [];

      if (itens.length === 0) {
        temMais = false;
      } else {
        todosProdutos.push(...itens);
        pagina++;
      }
      if (pagina > 20) temMais = false;
    }

    if (todosProdutos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Nenhum produto encontrado no Bling." 
      });
    }

    // Salva ou atualiza cada produto no banco de dados
    for (const produto of todosProdutos) {
      await prisma.produto.upsert({
        where: { codigo: String(produto.codigo || produto.id) },
        update: {
          nome: produto.nome,
          preco: Number(produto.preco || 0),
          situacao: 'A',
          categoriaId: categoriaPadrao.id,
          lojistaId: integracao.lojistaId
        },
        create: {
          codigo: String(produto.codigo || produto.id),
          nome: produto.nome,
          preco: Number(produto.preco || 0),
          situacao: 'A',
          categoriaId: categoriaPadrao.id,
          lojistaId: integracao.lojistaId
        }
      });
    }

    return NextResponse.json({ success: true, total: todosProdutos.length });

  } catch (erro: any) {
    console.error('Erro na importação:', erro);
    return NextResponse.json({ error: erro.message }, { status: 500 });
  }
}