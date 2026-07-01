import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importação correta conforme seu projeto

export async function POST(request: Request) {
  try {
    // 1. Tenta pegar o token do cabeçalho (enviado pela página)
    let token = request.headers.get('Authorization')?.replace('Bearer ', '');

    // 2. Se não houver token na página, busca automaticamente no banco de dados
    if (!token || token === 'undefined' || token === 'null') {
      // AJUSTE: Trocado 'nome' por 'tipo' e 'accessToken' por 'token' conforme o schema
      const integracao = await prisma.integracao.findFirst({
        where: { tipo: 'BLING' },
        select: { token: true }
      });

      if (!integracao || !integracao.token) {
        return NextResponse.json(
          { error: 'Conexão do Bling não encontrada no banco. Por favor, conecte o Bling primeiro.' },
          { status: 401 }
        );
      }

      token = integracao.token;
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
        const docIdentificador = (c.numeroDocumento || String(c.id)).replace(/\D/g, '');
        const emailCliente = c.email || `sem-email-${c.id}@bling.com.br`;

        return await prisma.lojista.upsert({
          where: { cnpj: docIdentificador }, // Agora o Prisma aceita pois cnpj é @unique
          update: {
            nome: c.nome,
            email: emailCliente,
            telefone: c.telefone || c.celular || '',
            cidade: c.municipio || '',
            status: 'ativo' // AJUSTE: Trocado 'situacao' por 'status' conforme o schema
          },
          create: {
            nome: c.nome,
            email: emailCliente,
            cnpj: docIdentificador,
            telefone: c.telefone || c.celular || '',
            cidade: c.municipio || '',
            status: 'ativo', // AJUSTE: Trocado 'situacao' por 'status' conforme o schema
            saldo: 0,
            senha: '123456' // AJUSTE: Senha é obrigatória no seu schema
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