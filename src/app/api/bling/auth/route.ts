import { NextRequest, NextResponse } from "next/server";

const BLING_CLIENT_ID = process.env.BLING_CLIENT_ID;
const BLING_REDIRECT_URI = process.env.BLING_REDIRECT_URI;
const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";

export async function GET(request: NextRequest) {
  if (!BLING_CLIENT_ID) {
    return NextResponse.json(
      { error: "BLING_CLIENT_ID não configurado." },
      { status: 500 }
    );
  }

  if (!BLING_REDIRECT_URI) {
    return NextResponse.json(
      { error: "BLING_REDIRECT_URI não configurado." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: BLING_CLIENT_ID,
    redirect_uri: BLING_REDIRECT_URI,
  });

  const authUrl = `${BLING_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}