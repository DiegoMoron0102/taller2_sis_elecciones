import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const { searchParams } = new URL(req.url);
    const limite = searchParams.get("limite") ?? "50";
    const response = await fetch(`${BACKEND_URL}/api/admin/logs-auditoria?limite=${limite}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Proxy error", mensaje: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
