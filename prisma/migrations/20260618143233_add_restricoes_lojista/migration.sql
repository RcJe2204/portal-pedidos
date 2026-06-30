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
    "restricoes" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Lojista_listaPrecoId_fkey" FOREIGN KEY ("listaPrecoId") REFERENCES "ListaPreco" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lojista" ("acessoPortal", "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone", "updatedAt") SELECT "acessoPortal", "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone", "updatedAt" FROM "Lojista";
DROP TABLE "Lojista";
ALTER TABLE "new_Lojista" RENAME TO "Lojista";
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");
CREATE UNIQUE INDEX "Lojista_cnpj_key" ON "Lojista"("cnpj");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
