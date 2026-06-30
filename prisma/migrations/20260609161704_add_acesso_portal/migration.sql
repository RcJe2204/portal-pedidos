/*
  Warnings:

  - You are about to drop the `Pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `descricao` on the `Produto` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Lojista` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigo` to the `Produto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Pedido";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PedidoUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arquivoUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "dadosExtraidos" TEXT,
    "lojistaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PedidoUpload_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaPreco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "precosPorCategoria" TEXT NOT NULL DEFAULT '{}',
    "lojistasVinculados" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Integracao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresIn" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "preco_lojista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente_id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "preco" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "preco_lojista_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Lojista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lojista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'A',
    "senha" TEXT,
    "saldo" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "listaPrecoId" TEXT,
    "acessoPortal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lojista_listaPrecoId_fkey" FOREIGN KEY ("listaPrecoId") REFERENCES "ListaPreco" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lojista" ("cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone") SELECT "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", coalesce("situacao", 'A') AS "situacao", "telefone" FROM "Lojista";
DROP TABLE "Lojista";
ALTER TABLE "new_Lojista" RENAME TO "Lojista";
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");
CREATE UNIQUE INDEX "Lojista_cnpj_key" ON "Lojista"("cnpj");
CREATE TABLE "new_Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "imagemUrl" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoriaId" TEXT,
    CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Produto" ("createdAt", "estoque", "id", "nome", "preco") SELECT "createdAt", "estoque", "id", "nome", "preco" FROM "Produto";
DROP TABLE "Produto";
ALTER TABLE "new_Produto" RENAME TO "Produto";
CREATE UNIQUE INDEX "Produto_codigo_key" ON "Produto"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Integracao_nome_key" ON "Integracao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "preco_lojista_cliente_id_categoria_key" ON "preco_lojista"("cliente_id", "categoria");
