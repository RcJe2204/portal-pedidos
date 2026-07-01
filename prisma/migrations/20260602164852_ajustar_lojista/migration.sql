npm run build-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lojista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "senha" TEXT,
    "saldo" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listaPrecoId" TEXT,
    "cnpj" TEXT,
    "cidade" TEXT,
    "telefone" TEXT,
    "situacao" TEXT DEFAULT 'A'
);
INSERT INTO "new_Lojista" ("cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone") SELECT "cidade", "cnpj", "createdAt", "email", "id", "listaPrecoId", "nome", "saldo", "senha", "situacao", "telefone" FROM "Lojista";
DROP TABLE "Lojista";
ALTER TABLE "new_Lojista" RENAME TO "Lojista";
CREATE UNIQUE INDEX "Lojista_email_key" ON "Lojista"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
