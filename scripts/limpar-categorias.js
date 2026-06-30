const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

function question(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const count = await prisma.produto.count({
      where: {
        categoriaId: {
          not: null,
        },
      },
    });

    console.log(`Existem ${count} produtos com categoriaId preenchido.`);

    if (count === 0) {
      console.log('Nenhum produto para atualizar.');
      return;
    }

    const resposta = await question(
      `Tem certeza que deseja limpar a categoria de ${count} produtos? (s/N) `
    );

    if (resposta.trim().toLowerCase() === 's') {
      const resultado = await prisma.produto.updateMany({
        where: {
          categoriaId: {
            not: null,
          },
        },
        data: {
          categoriaId: null,
        },
      });

      console.log(`${resultado.count} produtos tiveram a categoria limpa.`);
    } else {
      console.log('Operação cancelada.');
    }
  } catch (error) {
    console.error('Erro ao processar:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();