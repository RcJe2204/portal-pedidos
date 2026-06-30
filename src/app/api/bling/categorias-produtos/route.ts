import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const refreshToken = request.headers.get('x-refresh-token')

  if (!authHeader) {
    return NextResponse.json({ error: 'Token não encontrado. Reconecte o Bling.', precisaReconectar: true }, { status: 401 })
  }

  let currentToken = authHeader.replace('Bearer ', '')
  let currentRefreshToken = refreshToken || ''

  async function renovarToken(): Promise<boolean> {
    if (!currentRefreshToken) return false
    try {
      const clientId = process.env.BLING_CLIENT_ID
      const clientSecret = process.env.BLING_CLIENT_SECRET
      const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

      const res = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicToken}`,
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
        }),
      })

      if (!res.ok) return false

      const data = await res.json()
      currentToken = data.access_token
      currentRefreshToken = data.refresh_token || currentRefreshToken
      return true
    } catch {
      return false
    }
  }

  try {
    let todasCategorias: any[] = []
    let pagina = 1
    let tokenRenovado = false

    while (true) {
      const response = await fetch(
        `https://api.bling.com.br/Api/v3/grupos-produtos?limite=100&pagina=${pagina}`,
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.status === 401 && !tokenRenovado) {
        const renovou = await renovarToken()
        if (renovou) {
          tokenRenovado = true
          const retry = await fetch(
            `https://api.bling.com.br/Api/v3/grupos-produtos?limite=100&pagina=${pagina}`,
            {
              headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
          if (retry.ok) {
            const text = await retry.text()
            let data
            try { data = JSON.parse(text) } catch { data = {} }
            const cats = data.data || []
            if (cats.length === 0) break
            todasCategorias = [...todasCategorias, ...cats]
            pagina++
            continue
          }
        }
        return NextResponse.json({
          error: 'Token expirado e não foi possível renovar. Reconecte o Bling.',
          precisaReconectar: true
        }, { status: 401 })
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error(`Bling API error ${response.status}:`, errorText)
        throw new Error(`Erro na API Bling: ${response.status}`)
      }

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        console.error('Resposta não-JSON do Bling:', text.substring(0, 500))
        throw new Error('Resposta inválida da API Bling')
      }

      const cats = data.data || []
      if (cats.length === 0) break

      todasCategorias = [...todasCategorias, ...cats]
      pagina++
    }

    return NextResponse.json({
      data: todasCategorias,
      novoToken: tokenRenovado ? currentToken : undefined,
      novoRefreshToken: tokenRenovado ? currentRefreshToken : undefined,
    })
  } catch (err: any) {
    console.error('Erro ao buscar grupos de produtos:', err)
    const msg = (err.message || '').toLowerCase()
    if (msg.includes('401') || msg.includes('token') || msg.includes('auth') || msg.includes('unauthorized')) {
      return NextResponse.json({
        error: 'Token expirado. Reconecte o Bling.',
        precisaReconectar: true
      }, { status: 401 })
    }
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}