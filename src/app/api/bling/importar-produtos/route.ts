import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const integracao = await prisma.integracao.findFirst();
    if (!integracao) return NextResponse.json({ error: 'Configuração não encontrada.' }, { status: 404 });

    const categoriaPadrao = await prisma.categoria.upsert({
      where: { nome: 'Geral' },
      update: {},
      create: { nome: 'Geral' }
    });

    const token = integracao.accessToken;
    let todosProdutos: any[] = [];
    let pagina = 1;
    let temMais = true;

    console.log('--- INICIANDO BUSCA NO BLING ---');

    while (temMais) {
      // URL limpa, sem critérios, para pegar o que o Bling liberar
      const url = `https://www.bling.com.br/Api/v3/produtos?limite=100&pagina=${pagina}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();
      
      // Isso vai mostrar no seu terminal do VS Code o que o Bling respondeu de verdade
      console.log(`Página ${pagina}:`, JSON.stringify(json).substring(0, 100));

      const itens = json.data || [];

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
        message: "O Bling conectou, mas não enviou produtos. Verifique as PERMISSÕES do Usuário API no painel do Bling." 
      });
    }

    for (const prod of todosProdutos) {
      await prisma.produto.upsert({
        where: { codigo: String(prod.codigo || prod.id) },
        update: {
          nome: prod.nome,
          preco: Number(prod.preco || 0),
          situacao: 'A',
          categoriaId: categoriaPadrao.id
        },
        create: {
          codigo: String(prod.codigo || prod.id),
          nome: prod.nome,
          preco: Number(prod.preco || 0),
          situacao: 'A',
          categoriaId: categoriaPadrao.id
        }
      });
    }

    return NextResponse.json({ success: true, total: todosProdutos.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}