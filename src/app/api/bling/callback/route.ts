import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Código de autorização não encontrado" }, { status: 400 });
  }

  try {
    const clientId = process.env.BLING_CLIENT_ID;
    const clientSecret = process.env.BLING_CLIENT_SECRET;
    const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // 1. Troca o código pelo Token no Bling
    const response = await fetch("https://www.bling.com.br/Api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicToken}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || "Erro ao obter token");
    }

    // 2. Garante que existe um lojista
    let lojista = await prisma.lojista.findFirst();

    if (!lojista) {
      lojista = await prisma.lojista.create({
        data: {
          nome: "Lojista Mestre",
          email: "admin@portal.com",
          senha: "mudar_depois",
        }
      });
    }

    // 3. Verifica se já existe um token para este lojista
    const tokenExistente = await prisma.blingToken.findFirst({
      where: { lojistaId: lojista.id }
    });

    if (tokenExistente) {
      // Atualiza o token existente
      await prisma.blingToken.update({
        where: { id: tokenExistente.id },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      });
    } else {
      // Cria um novo token
      await prisma.blingToken.create({
        data: {
          lojistaId: lojista.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      });
    }

    return NextResponse.redirect(new URL("/dashboard?auth=success", request.url));
  } catch (error: any) {
    console.error("Erro no Callback do Bling:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}