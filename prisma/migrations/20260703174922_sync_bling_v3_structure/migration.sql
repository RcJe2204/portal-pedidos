/*
  Warnings:

  - You are about to drop the `Categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Integracao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ListaPreco` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lojista` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoUpload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrecoLojista` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Produto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Categoria" DROP CONSTRAINT "Categoria_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Integracao" DROP CONSTRAINT "Integracao_lojistaId_fkey";

-- DropForeignKey
ALTER TABLE "ListaPreco" DROP CONSTRAINT "ListaPreco_lojistaId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_lojistaId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoUpload" DROP CONSTRAINT "PedidoUpload_lojistaId_fkey";

-- DropForeignKey
ALTER TABLE "PrecoLojista" DROP CONSTRAINT "PrecoLojista_lojistaId_fkey";

-- DropForeignKey
ALTER TABLE "PrecoLojista" DROP CONSTRAINT "PrecoLojista_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_lojistaId_fkey";

-- DropTable
DROP TABLE "Categoria";

-- DropTable
DROP TABLE "Integracao";

-- DropTable
DROP TABLE "ListaPreco";

-- DropTable
DROP TABLE "Lojista";

-- DropTable
DROP TABLE "Pedido";

-- DropTable
DROP TABLE "PedidoUpload";

-- DropTable
DROP TABLE "PrecoLojista";

-- DropTable
DROP TABLE "Produto";

-- CreateTable
CREATE TABLE "lojistas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "logoUrl" TEXT,
    "apiKey" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lojistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bling_tokens" (
    "id" TEXT NOT NULL,
    "lojista_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "token_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bling_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "lojista_id" TEXT NOT NULL,
    "id_bling" TEXT,
    "numero" TEXT,
    "cliente_nome" TEXT,
    "cliente_doc" TEXT,
    "valor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "data_pedido" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "upload_id" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "sku" TEXT,
    "descricao" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco_unit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoria_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_preco" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listas_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precos_lojista" (
    "id" TEXT NOT NULL,
    "lojista_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "lista_preco_id" TEXT,
    "preco" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desconto_max" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precos_lojista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracoes" (
    "id" TEXT NOT NULL,
    "lojista_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "config" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_upload" (
    "id" TEXT NOT NULL,
    "lojista_id" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'CSV',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processados" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lojistas_email_key" ON "lojistas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lojistas_cnpj_key" ON "lojistas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "lojistas_apiKey_key" ON "lojistas"("apiKey");

-- CreateIndex
CREATE INDEX "pedidos_lojista_id_idx" ON "pedidos"("lojista_id");

-- CreateIndex
CREATE INDEX "pedidos_id_bling_idx" ON "pedidos"("id_bling");

-- CreateIndex
CREATE INDEX "pedidos_numero_idx" ON "pedidos"("numero");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_produto_id_idx" ON "itens_pedido"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE INDEX "precos_lojista_lojista_id_idx" ON "precos_lojista"("lojista_id");

-- CreateIndex
CREATE INDEX "precos_lojista_produto_id_idx" ON "precos_lojista"("produto_id");

-- CreateIndex
CREATE INDEX "precos_lojista_lista_preco_id_idx" ON "precos_lojista"("lista_preco_id");

-- CreateIndex
CREATE UNIQUE INDEX "precos_lojista_lojista_id_produto_id_lista_preco_id_key" ON "precos_lojista"("lojista_id", "produto_id", "lista_preco_id");

-- CreateIndex
CREATE INDEX "integracoes_lojista_id_idx" ON "integracoes"("lojista_id");

-- CreateIndex
CREATE INDEX "pedidos_upload_lojista_id_idx" ON "pedidos_upload"("lojista_id");

-- AddForeignKey
ALTER TABLE "bling_tokens" ADD CONSTRAINT "bling_tokens_lojista_id_fkey" FOREIGN KEY ("lojista_id") REFERENCES "lojistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_lojista_id_fkey" FOREIGN KEY ("lojista_id") REFERENCES "lojistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "pedidos_upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_lojista" ADD CONSTRAINT "precos_lojista_lojista_id_fkey" FOREIGN KEY ("lojista_id") REFERENCES "lojistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_lojista" ADD CONSTRAINT "precos_lojista_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos_lojista" ADD CONSTRAINT "precos_lojista_lista_preco_id_fkey" FOREIGN KEY ("lista_preco_id") REFERENCES "listas_preco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracoes" ADD CONSTRAINT "integracoes_lojista_id_fkey" FOREIGN KEY ("lojista_id") REFERENCES "lojistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_upload" ADD CONSTRAINT "pedidos_upload_lojista_id_fkey" FOREIGN KEY ("lojista_id") REFERENCES "lojistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
