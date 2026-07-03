-- CreateTable
CREATE TABLE "Lojista" (
    "id" TEXT NOT NULL,
    "idBling" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cnpj" TEXT,
    "senha" TEXT NOT NULL,
    "telefone" TEXT,
    "cidade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acessoPortal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lojista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "lojistaId" TEXT NOT NULL,
    "plataforma" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "total" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoUpload" (
    "id" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "lojistaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "lojistaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "situacao" TEXT NOT NULL DEFAULT 'A',
    "imagemUrl" TEXT,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListaPreco" (
    "id" TEXT NOT NULL,
    "lojistaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListaPreco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integracao" (
    "id" TEXT NOT NULL,
    "lojistaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "idBling" TEXT,
    "nome" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoLojista" (
    "id" TEXT NOT NULL,
    "lojistaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecoLojista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lojista_idBling_key" ON "Lojista"("idBling");

-- CreateIndex
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lojista_cnpj_key" ON "Lojista"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigo_key" ON "Produto"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_idBling_key" ON "Categoria"("idBling");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoUpload" ADD CONSTRAINT "PedidoUpload_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaPreco" ADD CONSTRAINT "ListaPreco_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integracao" ADD CONSTRAINT "Integracao_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoLojista" ADD CONSTRAINT "PrecoLojista_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoLojista" ADD CONSTRAINT "PrecoLojista_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
