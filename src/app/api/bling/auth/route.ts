// Forçando Build para ativar variáveis de ambiente BLING_CLIENT_ID e REDIRECT_URI
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = process.env.BLING_CLIENT_ID;
  const redirectUri = process.env.BLING_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ 
      error: "Configurações BLING_CLIENT_ID ou BLING_REDIRECT_URI ausentes na AWS." 
    }, { status: 500 });
  }

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
    state: "portal_pedidos_seguro",
    scope: scopes
  });

  return NextResponse.redirect(`https://www.bling.com.br/Api/v3/oauth/authorize?${params.toString()}`);
}