import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = "9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8";
  // Garantindo que o redirecionamento aponte para a Amazon
  const redirectUri = "https://main.d66m6u9ly2t4o.amplifyapp.com/api/bling/callback";
  
  // O Bling exige o parâmetro 'state'. Vamos usar um valor padrão '123'
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "123" 
  });

  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}