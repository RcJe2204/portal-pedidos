-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lojistaId" TEXT NOT NULL,
    "itens" TEXT NOT NULL DEFAULT '[]',
    "total" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "formaPagamento" TEXT,
    "observacao" TEXT,
    "pedidoBlingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_lojistaId_fkey" FOREIGN KEY ("lojistaId") REFERENCES "Lojista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
