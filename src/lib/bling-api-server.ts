const BLING_API_URL = 'https://api.bling.com.br/Api/v3'

let cachedToken: {
  access_token: string
  refresh_token: string
  expires_at: number
} | null = null

function getToken(): typeof cachedToken {
  return cachedToken
}

function setToken(data: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  cachedToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

function isTokenExpired(): boolean {
  if (!cachedToken) return true
  return Date.now() >= cachedToken.expires_at - 60000
}

async function refreshToken(): Promise<void> {
  if (!cachedToken) throw new Error('Token não encontrado')

  const clientId = process.env.BLING_CLIENT_ID
  const clientSecret = process.env.BLING_CLIENT_SECRET
  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicToken}`,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: cachedToken.refresh_token,
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao renovar token')
  }

  const data = await response.json()
  setToken(data)
}

export async function blingRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  if (isTokenExpired()) {
    await refreshToken()
  }

  if (!cachedToken) {
    throw new Error('Token não configurado. Faça a autenticação primeiro.')
  }

  const url = `${BLING_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${cachedToken.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`Erro Bling ${response.status}:`, text)
    throw new Error(`Erro Bling: ${response.status}`)
  }

  return response.json()
}