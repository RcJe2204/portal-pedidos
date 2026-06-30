import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('x-access-token') || 
                      request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) return NextResponse.json({ error: 'Token não encontrado.' }, { status: 401 })

  async function fetchClientesBling(token: string) {
    let todos: any[] = []
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
        if (lista.length === 0) { temMais = false } else {
          const formatados = lista.map((c: any) => ({
            id: c.id,
            nome: c.nome,
            numeroDocumento: c.numeroDocumento || '',
            email: c.email || '---',
            telefone: c.telefone || c.celular || '---',
            cidade: c.endereco?.municipio || '---',
            situacao: (c.situacao === 'A' || c.situacao === 1 || String(c.situacao) === '1') ? 'A' : 'I',
            origem: 'bling'
          }))
          todos = [...todos, ...formatados]
          pagina++
        }
      }
      return { error: false, data: todos }
    } catch (err) { return { error: true, data: [] } }
  }

  const result = await fetchClientesBling(accessToken)
  
  // Busca os lojistas locais incluindo o vínculo da lista de preço
  const lojistasLocais = await prisma.lojista.findMany({ orderBy: { createdAt: 'desc' } })

  const lojistasFormatados = lojistasLocais.map(l => ({
    id: l.id,
    nome: l.nome,
    email: l.email || '---',
    numeroDocumento: l.cnpj || '',
    situacao: l.situacao || 'A',
    cidade: l.cidade || 'Local',
    telefone: l.telefone || '---',
    listaPrecoId: l.listaPrecoId, // Envia para a interface mostrar se quiser
    origem: 'local'
  }))

  return NextResponse.json({ clientes: [...lojistasFormatados, ...result.data] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const novo = await prisma.lojista.create({
      data: {
        nome: body.nome,
        email: body.email || null,
        cnpj: body.numeroDocumento || body.cnpj || '',
        telefone: body.telefone || '',
        cidade: body.cidade || '',
        situacao: body.situacao || 'A',
        // Vínculo com a lista de preço no momento do cadastro
        listaPrecoId: body.listaPrecoId || null,
        senha: null,
        saldo: 0
      }
    })

    return NextResponse.json({ success: true, cliente: novo })
  } catch (error: any) {
    console.error('Erro ao salvar localmente:', error)
    return NextResponse.json({ error: 'Erro ao salvar cliente no banco local.' }, { status: 500 })
  }
}