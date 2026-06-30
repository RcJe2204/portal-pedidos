const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// LISTA OFICIAL ATUALIZADA (Sem prefixos H/GL e sem categoria Geral)
const dados = [
  { sku: "1010", cat: "DIVERSOS" },
  { sku: "0063", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0064", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0065", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0066", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0067", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0068", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0075", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0076", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0077", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0078", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0079", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0080", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0081", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0082", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0083", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0084", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0085", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0086", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0087", cat: "ARC LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "0088", cat: "ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0530", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0532", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0534", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0536", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0538", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "0540", cat: "PELUCIA ARC LETRAS GRANDES GEOGRAFICA" },
  { sku: "CAPA10", cat: "CAPA" },
  { sku: "CAPA11", cat: "CAPA" },
  { sku: "E0001", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0002", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0003", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0004", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0005", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0006", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0007", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0008", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0009", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0010", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0011", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0012", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0013", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0014", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0015", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0016", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0017", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0018", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0019", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0020", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0021", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0022", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0023", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0024", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0025", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0026", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0027", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0028", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0029", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0030", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0031", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0032", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0033", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0034", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0035", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0036", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0037", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0038", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0039", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0040", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0041", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0042", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0043", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0044", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0045", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0046", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0047", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0048", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0049", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0050", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0051", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0052", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0053", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0054", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0055", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0056", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0057", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0058", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0059", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0060", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E0061", cat: "LETRAS MÉDIAS ARC KINGS" },
  { sku: "E0062", cat: "LETRAS HIPERGIGANTES ARC KINGS" },
  { sku: "E-U0001", cat: "JUMBO / ULTRA GIGANTE" },
  { sku: "E-U0005", cat: "JUMBO / ULTRA GIGANTE" },
  { sku: "E-U0015", cat: "JUMBO / ULTRA GIGANTE" },
  { sku: "E-U0021", cat: "JUMBO / ULTRA GIGANTE" },
  { sku: "E-U0029", cat: "JUMBO / ULTRA GIGANTE" },
  { sku: "0500", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0501", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0502", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0503", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0504", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0505", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0506", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0507", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0508", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0509", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0512", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0513", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0516", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0517", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0518", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0519", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0522", cat: "GLITTER LETRAS MÉDIAS ARC" },
  { sku: "0523", cat: "GLITTER LETRAS HIPERGIGANTE ARC" },
  { sku: "0001", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0002", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0003", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0004", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0005", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0006", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0007", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0008", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0009", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0010", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0011", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0012", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0013", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0014", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0015", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0016", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0017", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0018", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0019", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0020", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0023", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0024", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0025", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0026", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0027", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0028", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0029", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0030", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0031", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0032", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0033", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0034", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0035", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0036", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0037", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0038", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0039", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0040", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0041", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0042", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "0043", cat: "LETRAS MÉDIAS ARC KINGS ANTIGO HDC" },
  { sku: "0044", cat: "LETRAS HIPER GIGANTE ANTIGO HDC" },
  { sku: "I0001", cat: "LETRAS MÉDIAS ARC KINGS ILUMINADA" },
  { sku: "I0003", cat: "LETRAS MÉDIAS ARC KINGS ILUMINADA" },
  { sku: "I0005", cat: "LETRAS MÉDIAS ARC KINGS ILUMINADA" },
  { sku: "I0007", cat: "LETRAS MÉDIAS ARC KINGS ILUMINADA" },
  { sku: "I0009", cat: "LETRAS MÉDIAS ARC KINGS ILUMINADA" },
  { sku: "L900", cat: "PREMIUM MEGA GIGANTE GEOGRAFICA" },
  { sku: "L902", cat: "PREMIUM MEGA GIGANTE GEOGRAFICA" },
  { sku: "L904", cat: "PREMIUM MEGA GIGANTE GEOGRAFICA" },
  { sku: "L906", cat: "PREMIUM MEGA GIGANTE GEOGRAFICA" },
  { sku: "LV0001", cat: "DIVERSOS" },
  { sku: "N0001", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0002", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0005", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0006", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0021", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0022", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0029", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0030", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0051", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0052", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0063", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0064", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0065", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0066", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0067", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0068", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0069", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0070", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0071", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0072", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0073", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0074", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0075", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0076", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0077", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0078", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0079", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0080", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0081", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0082", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0083", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0084", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0085", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0086", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "N0087", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "N0088", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0530", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0532", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0534", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0536", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0538", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "0540", cat: "PELUCIA NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "NHDC1", cat: "NVI LETRAS MÉDIAS GEOGRAFICA" },
  { sku: "NHDC2", cat: "NVI LETRAS GRANDES GEOGRAFICA" },
  { sku: "PE0001", cat: "MINI CAPA DURA" },
  { sku: "PE0005", cat: "MINI CAPA DURA" },
  { sku: "PG0500", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0502", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0504", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0506", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0508", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0512", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0516", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0518", cat: "MINI CAPA DURA LUXO" },
  { sku: "PG0522", cat: "MINI CAPA DURA LUXO" },
  { sku: "PH0001", cat: "MINI CAPA DURA" },
  { sku: "PH0029", cat: "MINI CAPA DURA" },
  { sku: "PH0039", cat: "MINI CAPA DURA" },
  { sku: "PH0041", cat: "MINI CAPA DURA" },
  { sku: "PH0043", cat: "MINI CAPA DURA" },
];

async function main() {
  console.log('🛡️ Iniciando filtragem por Lista de Preços (Corrigido: situacao)...\n');

  // PASSO 1: Resetar todos os produtos para "Inativo"
  console.log('⏳ Ocultando todos os produtos para aplicar o filtro...');
  await prisma.produto.updateMany({
    data: { situacao: 'I' } // CORREÇÃO: 'situacao' em vez de 'situa'
  });

  // PASSO 2: Criar/Atualizar Categorias
  const nomesUnicos = [...new Set(dados.map(d => d.cat))];
  const categoriasCriadas = {};
  for (const nome of nomesUnicos) {
    const categoria = await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
    categoriasCriadas[nome] = categoria.id;
  }

  let ativados = 0;
  let naoEncontrados = 0;

  // PASSO 3: Ativar apenas os produtos da lista
  for (const item of dados) {
    const categoriaId = categoriasCriadas[item.cat];
    
    // Busca no banco usando o SKU exatamente como está na lista (já limpo)
    const produto = await prisma.produto.findFirst({
      where: { codigo: item.sku }
    });

    if (produto) {
      await prisma.produto.update({
        where: { id: produto.id },
        data: { 
          categoriaId: categoriaId,
          situacao: 'A' // CORREÇÃO: 'situacao' em vez de 'situa'
        },
      });
      ativados++;
    } else {
      naoEncontrados++;
    }
  }

  console.log(`\n✅ Filtro aplicado com sucesso!`);
  console.log(`🚀 ${ativados} produtos da sua lista estão ATIVOS.`);
  console.log(`🚫 Todos os outros produtos foram ocultados.`);
  console.log(`📊 Total de produtos processados: ${dados.length}`);
}

main()
  .catch(e => console.error('❌ Erro:', e))
  .finally(() => prisma.$disconnect());