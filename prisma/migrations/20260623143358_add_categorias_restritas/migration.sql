/*
  Warnings:

  - You are about to drop the column `restricoes` on the `Lojista` table. All the data in the column will be lost.

*/
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
    "categoriasRestritas" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Lojista_listaPrecoId_fkey" FOREIGN KEY ("listaPrecoId") REFERENCES "ListaPreco" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lojista" ("acessoPortal", "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone", "updatedAt") SELECT "acessoPortal", "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone", "updatedAt" FROM "Lojista";
DROP TABLE "Lojista";
ALTER TABLE "new_Lojista" RENAME TO "Lojista";
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");
CREATE UNIQUE INDEX "Lojista_cnpj_key" ON "Lojista"("cnpj");
CREATE TABLE "new_Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lojistaId" TEXT NOT NULL,
    "itens" TEXT NOT NULL DEFAULT '[]',
    "total" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'aguardando autorização',
    "plataforma" TEXT,
    "formaPagamento" TEXT,
    "observacao" TEXT,
    "pedidoBlingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("createdAt", "formaPagamento", "id", "itens", "lojistaId", "observacao", "pedidoBlingId", "status", "total", "updatedAt") SELECT "createdAt", "formaPagamento", "id", "itens", "lojistaId", "observacao", "pedidoBlingId", "status", "total", "updatedAt" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
