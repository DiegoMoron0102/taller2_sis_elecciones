import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const response = await fetch(`${BACKEND_URL}/api/admin/habilitar-escrutinio`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
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
