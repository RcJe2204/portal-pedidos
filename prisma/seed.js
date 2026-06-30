const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando recuperação...');

  // 1. Recuperar o Lojista teste (SEM ADMIN)
  await prisma.lojista.upsert({
    where: { email: 'teste@teste.com' },
    update: {},
    create: {
      nome: 'teste',
      email: 'teste@teste.com',
      senha: '123',
      acessoPortal: true,
      situacao: 'A'
    },
  });

  // 2. Restaurar a conexão do Bling (Substitua pelos seus dados)
  const CLIENT_ID = '9fa182b9d7809d2561e16cfd6db8f06e8bd3c0a8';
  const CLIENT_SECRET = '3d7463612526fa929d2d9428e50a12a0f862c15b456cb0cafd7521fb7fdc';

  await prisma.integracao.upsert({
    where: { nome: 'Bling' },
    update: {
      accessToken: CLIENT_ID,
      refreshToken: CLIENT_SECRET,
      updatedAt: new Date(),
    },
    create: {
      nome: 'Bling',
      accessToken: CLIENT_ID,
      refreshToken: CLIENT_SECRET,
    },
  });

  console.log('✅ Lojista "teste" e Conexão Bling restaurados!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });