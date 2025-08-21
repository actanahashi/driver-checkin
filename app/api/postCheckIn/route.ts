import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { NR_PLACA, DT_POSICAO, NR_LATITUDE, NR_LONGITUDE } =
    await request.json();

  console.log(NR_PLACA, DT_POSICAO, NR_LATITUDE, NR_LONGITUDE);

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

  const resp = await fetch(coamoApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ NR_PLACA, DT_POSICAO, NR_LATITUDE, NR_LONGITUDE }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    return NextResponse.json(
      { success: false, message: "Erro na API da Coamo", details: txt },
      { status: 502 }
    );
  }

  const data = await resp.json();
  return NextResponse.json({ success: true, coamoResponse: data });
}
