import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Busca os lojistas no banco (com suporte a filtro do portal)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portalOnly = searchParams.get('portal') === 'true';

    const lojistas = await prisma.lojista.findMany({
      where: portalOnly ? { acessoPortal: true } : {},
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(lojistas);
  } catch (error) {
    console.error('Erro ao buscar lojistas:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Cadastro Manual ou Sincronização Bling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // 1. Processamento de Cadastro Manual (Formulário do Admin)
    if (body && body.nome && body.cnpj) {
      console.log('Processando cadastro manual de lojista:', body.nome);
      const cnpjLimpo = body.cnpj.replace(/\D/g, '');
      
      // Define se tem acesso ao portal (se não enviado, assume true para manual)
      const temAcesso = body.acessoPortal !== undefined ? body.acessoPortal : true;

      const lojistaManual = await prisma.lojista.upsert({
        where: { cnpj: cnpjLimpo },
        update: { 
          nome: body.nome, 
          email: body.email || null, 
          telefone: body.telefone || '', 
          cidade: body.cidade || '',
          senha: body.senha || '123456',
          acessoPortal: temAcesso
        },
        create: { 
          nome: body.nome, 
          email: body.email || null, 
          cnpj: cnpjLimpo, 
          telefone: body.telefone || '', 
          cidade: body.cidade || '', 
          saldo: 0,
          senha: body.senha || '123456',
          acessoPortal: temAcesso
        }
      });
      
      return NextResponse.json(lojistaManual);
    }

    // 2. Sincronização com o Bling
    const integracao = await prisma.integracao.findFirst({ where: { nome: 'Bling' } });
    
    if (!integracao || !integracao.accessToken) {
      return NextResponse.json({ 
        error: 'Bling não conectado e nenhum dado manual enviado.' 
      }, { status: 401 });
    }

    const resBling = await fetch('https://www.bling.com.br/Api/v3/contatos', {
      headers: { 'Authorization': `Bearer ${integracao.accessToken}` }
    });

    if (!resBling.ok) {
      const errorData = await resBling.json();
      return NextResponse.json({ error: errorData.error?.description || 'Erro no Bling' }, { status: resBling.status });
    }

    const dataBling = await resBling.json();
    const contatos = dataBling.data || [];

    const resultados = await Promise.all(
      contatos.map(async (c: any) => {
        const cnpjLimpo = (c.numeroDocumento || String(c.id)).replace(/\D/g, '');
        return await prisma.lojista.upsert({
          where: { cnpj: cnpjLimpo },
          update: { 
            nome: c.nome, 
            email: c.email || null, 
            telefone: c.telefone || '', 
            cidade: c.municipio || '',
            // No update do Bling, não alteramos o acessoPortal para não sobrescrever o que o admin definiu
          },
          create: { 
            nome: c.nome, 
            email: c.email || null, 
            cnpj: cnpjLimpo, 
            telefone: c.telefone || '', 
            cidade: c.municipio || '', 
            saldo: 0,
            senha: '123456',
            acessoPortal: false // Novos contatos do Bling começam desativados
          }
        });
      })
    );

    return NextResponse.json({ total: resultados.length });
  } catch (error: any) {
    console.error('Erro na operação de lojistas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}