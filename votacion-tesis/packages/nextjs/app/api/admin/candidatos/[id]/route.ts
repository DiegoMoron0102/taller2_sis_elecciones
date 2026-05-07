import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization") ?? "";
    const response = await fetch(`${BACKEND_URL}/api/admin/candidatos/${id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
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
