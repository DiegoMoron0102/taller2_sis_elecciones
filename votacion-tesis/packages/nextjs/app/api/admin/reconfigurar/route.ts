import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const res = await fetch(`${BACKEND_URL}/api/admin/reconfigurar`, {
    method: "POST",
    headers: { Authorization: authHeader },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
