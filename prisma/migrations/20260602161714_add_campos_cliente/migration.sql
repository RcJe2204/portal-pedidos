/*
  Warnings:

  - You are about to drop the `Categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemPedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preco_Lojista` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Pedido` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `canal` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `cliente_id` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Pedido` table. All the data in the column will be lost.
  - The primary key for the `Produto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `atualizado_em` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `codigo` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `situacao` on the `Produto` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Produto` table. All the data in the column will be lost.
  - Added the required column `lojistaId` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Categoria_nome_key";

-- DropIndex
DROP INDEX "Preco_Lojista_cliente_id_categoria_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Categoria";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Cliente";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ItemPedido";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Preco_Lojista";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Lojista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "saldo" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listaPrecoId" TEXT,
    "cnpj" TEXT,
    "cidade" TEXT,
    "telefone" TEXT,
    "situacao" TEXT DEFAULT 'A'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lojistaId" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pedido_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("id", "status") SELECT "id", "status" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE TABLE "new_Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "descricao" TEXT,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Produto" ("estoque", "id", "nome", "preco") SELECT "estoque", "id", "nome", "preco" FROM "Produto";
DROP TABLE "Produto";
ALTER TABLE "new_Produto" RENAME TO "Produto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");
