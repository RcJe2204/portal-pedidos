import { NextRequest, NextResponse } from "next/server";

// Força a rota a ser sempre dinâmica (essencial para AWS Amplify)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Busca das variáveis de ambiente da AWS (mais seguro e flexível)
  const clientId = process.env.BLING_CLIENT_ID;
  const redirectUri = process.env.BLING_REDIRECT_URI;
  
  // Validação de segurança
  if (!clientId || !redirectUri) {
    return NextResponse.json({ 
      error: "Configurações BLING_CLIENT_ID ou BLING_REDIRECT_URI ausentes na AWS." 
    }, { status: 500 });
  }

  // Scopes oficiais da API V3 (Ajustados para o que seu portal precisa)
  const scopes = [
    'pedidos.vendas.read',
    'pedidos.vendas.write',
    'produtos.read',
    'produtos.write',
    'estoques.read',
    'contatos.read'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "seguranca_portal_123", // Opcional: pode ser um hash aleatório
    scope: scopes
  });

  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?${params.toString()}`;

  // Redireciona para o Bling com a URL montada corretamente
  return NextResponse.redirect(authUrl);
}