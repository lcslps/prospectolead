import { MessageTemplate, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_TEMPLATES: Array<Pick<MessageTemplate, 'nome' | 'conteudo' | 'servico'>> = [
  {
    nome: 'Primeiro contato - genérica',
    servico: 'soluções para o seu segmento',
    conteudo: `Oi, {empresa}! Tudo bem?

Encontrei vocês pesquisando por {nicho} aqui em {cidade}/{estado}.

Trabalho com {servico} e achei que poderia fazer sentido para a {empresa}.

Posso te mostrar uma ideia sem compromisso?`,
  },
  {
    nome: 'Primeiro contato - curta',
    servico: 'soluções para o seu segmento',
    conteudo: `Oi, {empresa}! Encontrei vocês procurando por {nicho} em {cidade} e gostaria de apresentar algo que tem feito resultado para negócios como o de vocês. Posso te enviar uma ideia?`,
  },
];

async function main(): Promise<void> {
  const count = await prisma.messageTemplate.count();
  if (count > 0) {
    console.log(`Já existem ${count} templates. Seed ignorado.`);
    return;
  }

  for (const template of SEED_TEMPLATES) {
    await prisma.messageTemplate.create({ data: template });
  }

  console.log(`Seed concluído: ${SEED_TEMPLATES.length} templates criados.`);
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());