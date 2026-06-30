import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importação correta sem chaves

export async function POST(request: Request) {
  try {
    // 1. Tenta pegar o token do cabeçalho (enviado pela página)
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // 2. Se não houver token na página, busca automaticamente no banco de dados
    if (!token || token === 'undefined' || token === 'null') {
      const integracao = await prisma.integracao.findFirst({
        where: { nome: 'Bling' },
        select: { accessToken: true }
      });

      if (!integracao || !integracao.accessToken) {
        return NextResponse.json(
          { error: 'Conexão do Bling não encontrada no banco. Por favor, conecte o Bling primeiro.' }, 
          { status: 401 }
        );
      }

      token = integracao.accessToken;
    }

    // 3. Busca os contatos no Bling
    const resBling = await fetch('https://www.bling.com.br/Api/v3/contatos?tipo=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resBling.ok) {
      const errorData = await resBling.json();
      return NextResponse.json(
        { error: 'Erro na API do Bling', details: errorData }, 
        { status: resBling.status }
      );
    }

    const dataBling = await resBling.json();
    const contatos = dataBling.data || [];

    // 4. Salva ou Atualiza no banco (Modelo Lojista)
    const resultados = await Promise.all(
      contatos.map(async (c: any) => {
        const docIdentificador = c.numeroDocumento || String(c.id);
        const emailCliente = c.email || `sem-email-${c.id}@bling.com.br`;

        return await prisma.lojista.upsert({
          where: { cnpj: docIdentificador }, // Agora o Prisma aceita pois cnpj é @unique
          update: {
            nome: c.nome,
            email: emailCliente,
            telefone: c.telefone || c.celular || '',
            cidade: c.municipio || '',
            situacao: 'A'
          },
          create: {
            nome: c.nome,
            email: emailCliente,
            cnpj: docIdentificador,
            telefone: c.telefone || c.celular || '',
            cidade: c.municipio || '',
            situacao: 'A',
            saldo: 0
          }
        });
      })
    );

    return NextResponse.json({ 
      message: 'Sincronização concluída com sucesso', 
      total: resultados.length 
    });

  } catch (error: any) {
    console.error('Erro crítico na sincronização:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}