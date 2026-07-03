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
            // SALVAMENTO NO BANCO USANDO O NOVO CAMPO idBling
            const lojista = await prisma.lojista.upsert({
              where: { idBling: String(c.id) },
              update: {
                nome: c.nome,
                email: c.email || `${c.id}@bling.com.br`,
                cnpj: c.numeroDocumento || '',
                telefone: c.telefone || c.celular || '',
                cidade: c.endereco?.municipio || '',
                status: 'ativo'
              },
              create: {
                idBling: String(c.id),
                nome: c.nome,
                email: c.email || `${c.id}@bling.com.br`,
                cnpj: c.numeroDocumento || '',
                telefone: c.telefone || c.celular || '',
                cidade: c.endereco?.municipio || '',
                status: 'ativo',
                senha: '123' // Senha padrão inicial
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

  // Executa a busca e o salvamento
  const result = await fetchESalvarClientesBling(accessToken)
  
  // Busca todos os lojistas que agora estão garantidos no banco
  const lojistasNoBanco = await prisma.lojista.findMany({ 
    orderBy: { createdAt: 'desc' } 
  })

  const formatadosParaOFront = lojistasNoBanco.map(l => ({
    id: l.id,
    nome: l.nome,
    email: l.email || '---',
    numeroDocumento: l.cnpj || '',
    situacao: l.status === 'ativo' ? 'A' : 'I',
    cidade: l.cidade || 'Local',
    telefone: l.telefone || '---',
    origem: l.idBling ? 'bling' : 'local'
  }))

  return NextResponse.json({ clientes: formatadosParaOFront })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const novo = await prisma.lojista.create({
      data: {
        nome: body.nome,
        email: body.email || "",
        cnpj: body.numeroDocumento || body.cnpj || '',
        telefone: body.telefone || '',
        cidade: body.cidade || '',
        status: body.situacao || 'ativo',
        senha: body.senha || "123",
        saldo: 0,
        acessoPortal: false
      }
    })
    return NextResponse.json({ success: true, cliente: novo })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao salvar cliente no banco local.' }, { status: 500 })
  }
}