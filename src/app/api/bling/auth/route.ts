import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = '9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8';
  // O redirect_uri deve ser exatamente o caminho da sua pasta callback
  const redirectUri = 'http://localhost:3000/api/bling/callback'; 
  const state = '123';

  const url = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return NextResponse.redirect(url);
}