import { NextRequest, NextResponse } from "next/server";

const BLING_API_URL = 'https://api.bling.com.br/Api/v3';

// Interface para garantir que não teremos erros de digitação
interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * IMPORTANTE: Para AWS Amplify, o ideal é trocar estas funções 
 * por chamadas ao seu banco de dados (Prisma). 
 * Vou manter a lógica de cache, mas com tratamento de erro melhor.
 */
let cachedToken: TokenData | null = null;

export function setToken(data: any) {
  cachedToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };
}

function isTokenExpired(): boolean {
  if (!cachedToken) return true;
  // Margem de segurança de 2 minutos
  return Date.now() >= (cachedToken.expires_at - 120000);
}

async function refreshToken(): Promise<void> {
  if (!cachedToken?.refresh_token) {
    throw new Error('Refresh token ausente. É necessário reautenticar.');
  }

  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  
  // Criando o Basic Auth de forma segura
  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicToken}`,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: cachedToken.refresh_token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Erro ao renovar token Bling:', data);
    throw new Error(data.error_description || 'Falha ao renovar token');
  }

  setToken(data);
}

export async function blingRequest(endpoint: string, options: RequestInit = {}) {
  // 1. Verifica se precisa renovar antes de qualquer coisa
  if (isTokenExpired()) {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Sessão Bling expirada:', error);
      throw new Error('Sessão expirada. Por favor, reconecte o Bling.');
    }
  }

  if (!cachedToken) throw new Error('Token não configurado.');

  // 2. Executa a requisição real
  const response = await fetch(`${BLING_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${cachedToken.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Erro API Bling [${response.status}]:`, errorBody);
    throw new Error(`Bling API Error: ${response.status}`);
  }

  return response.json();
}