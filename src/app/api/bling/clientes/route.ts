import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('x-access-token') ||
                      request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) return NextResponse.json({ error: 'Token não encontrado.' }, { status: 401 })

  async function fetchESalvarClientesBling(token: string) {
    let todosSalvos: any[] = []
    let pagina = 1
    let temMais = true

    try {
      while (temMais && pagina <= 3) {
        const url = `https://api.bling.com.br/Api/v3/contatos?limite=100&pagina=${pagina}`
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        })

        if (!res.ok) { temMais = false; break; }

        const json = await res.json()
        const lista = json.data || []

        if (lista.length === 0) {
          temMais = false
        } else {
          for (const c of lista) {
            const email = c.email || `${c.id}@bling.com.br`
            const documento = c.numeroDocumento || ''

            const lojista = await prisma.lojista.upsert({
              where: { email },
              update: {
                nome: c.nome,
                documento,
              },
              create: {
                nome: c.nome,
                email,
                documento,
                senha: '123',
                saldo: 0,
              }
            })
            todosSalvos.push(lojista)
          }
          pagina++
        }
      }
      return { error: false, data: todosSalvos }
    } catch (err) {
      console.error('Erro na sincronização de lojistas:', err)
      return { error: true, data: [] }
    }
  }

  await fetchESalvarClientesBling(accessToken)

  const lojistasNoBanco = await prisma.lojista.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const formatadosParaOFront = lojistasNoBanco.map(l => ({
    id: l.id,
    nome: l.nome,
    email: l.email || '---',
    numeroDocumento: l.documento || '',
    situacao: 'A',
    cidade: 'Local',
    telefone: '---',
    origem: 'local'
  }))

  return NextResponse.json({ clientes: formatadosParaOFront })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const novo = await prisma.lojista.create({
      data: {
        nome: body.nome,
        email: body.email || '',
        documento: body.numeroDocumento || body.documento || '',
        senha: body.senha || '123',
        saldo: 0,
      }
    })
    return NextResponse.json({ success: true, cliente: novo })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao salvar cliente no banco local.' }, { status: 500 })
  }
}