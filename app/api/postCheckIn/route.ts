import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { NR_PLACA, DT_POSICAO, NR_LATITUDE, NR_LONGITUDE } =
      await request.json();

    if (!NR_PLACA || !DT_POSICAO || !NR_LATITUDE || !NR_LONGITUDE) {
      return NextResponse.json(
        { success: false, message: "Payload inválido" },
        { status: 400 }
      );
    }

    const coamoApiUrl = process.env.COAMO_API_URL;
    if (!coamoApiUrl) {
      return NextResponse.json(
        { success: false, message: "COAMO_API_URL não configurada" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    const resp = await fetch(coamoApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ NR_PLACA, DT_POSICAO, NR_LATITUDE, NR_LONGITUDE }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro na API da Coamo",
          status: resp.status,
          details: text,
        },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json({ success: true, coamoResponse: data });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro no servidor",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
