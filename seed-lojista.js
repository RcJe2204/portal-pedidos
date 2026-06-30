const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Criando o lojista ILUMINADA
  const novoLojista = await prisma.lojista.create({
    data: {
      nome: 'ILUMINADA',
      email: 'contato@iluminada.com.br',
      senha: '123', 
      saldo: 500.00, 
      whatsapp: '11999999999',
      tipo: 'lojista'
    },
  })

  console.log('✅ Lojista real criado com sucesso:', novoLojista)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar lojista:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })