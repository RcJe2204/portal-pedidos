const BLING_API_URL = 'https://api.bling.com.br/Api/v3';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// 1. Proteção contra erro de SSR (Server-Side Rendering)
export function getStoredToken(): TokenData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('bling_token');
  return stored ? JSON.parse(stored) : null;
}

export function storeToken(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  if (typeof window === 'undefined') return;
  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    // Calcula o tempo exato de expiração
    expires_at: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem('bling_token', JSON.stringify(token));
}

// 2. Verificação de expiração com margem de segurança de 5 minutos
function isTokenExpired(token: TokenData): boolean {
  const CINCO_MINUTOS = 300000; 
  return Date.now() >= (token.expires_at - CINCO_MINUTOS);
}

export async function blingRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  let token = getStoredToken();
  
  if (!token) {
    // Em vez de apenas dar erro, podemos redirecionar para o login
    console.error('Token não encontrado. Redirecionando para autorização...');
    if (typeof window !== 'undefined') window.location.href = '/api/bling/auth';
    throw new Error('Token não encontrado');
  }

  // 3. Auto-refresh automático antes da requisição falhar
  if (isTokenExpired(token)) {
    try {
      token = await refreshToken(token.refresh_token);
    } catch (err) {
      if (typeof window !== 'undefined') window.location.href = '/api/bling/auth';
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
  }

  const response = await fetch(`${BLING_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro Bling: ${response.status} - ${errorData}`);
  }

  return response.json();
}

async function refreshToken(refresh_token: string): Promise<TokenData> {
  const response = await fetch('/api/bling/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });

  if (!response.ok) throw new Error('Falha ao renovar token');

  const data = await response.json();
  storeToken(data); // Usa a função de armazenamento padronizada
  return getStoredToken()!;
}

// --- Funções de Atalho ---
export const bling = {
  produtos: {
    listar: () => blingRequest('/produtos?limite=100'),
  },
  pedidos: {
    listar: (params?: string) => blingRequest(`/pedidos${params ? `?${params}` : ''}`),
    criar: (dados: any) => blingRequest('/pedidos', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  }
};