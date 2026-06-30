const BLING_API_URL = 'https://api.bling.com.br/Api/v3'

interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
}

export function getStoredToken(): TokenData | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('bling_token')
  return stored ? JSON.parse(stored) : null
}

export function storeToken(data: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
  localStorage.setItem('bling_token', JSON.stringify(token))
}

function isTokenExpired(token: TokenData): boolean {
  return Date.now() >= token.expires_at - 60000
}

export async function blingRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  let token = getStoredToken()
  if (!token) throw new Error('Token não encontrado')

  if (isTokenExpired(token)) {
    token = await refreshToken(token.refresh_token)
  }

  const response = await fetch(`${BLING_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Erro Bling: ${response.status} - ${await response.text()}`)
  }

  return response.json()
}

async function refreshToken(refresh_token: string): Promise<TokenData> {
  const response = await fetch('/api/bling/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  })

  if (!response.ok) throw new Error('Falha ao renovar token')

  const data = await response.json()
  const newToken: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
  localStorage.setItem('bling_token', JSON.stringify(newToken))
  return newToken
}

export async function listarProdutos() {
  return blingRequest('/produtos?limite=100')
}

export async function listarPedidos(params?: string) {
  return blingRequest(`/pedidos${params ? `?${params}` : ''}`)
}

export async function criarPedido(dados: any) {
  return blingRequest('/pedidos', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}