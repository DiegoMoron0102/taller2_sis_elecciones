import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("foto") as File | null;
  const indice = formData.get("indice") as string | null;

  if (!file || !indice) {
    return NextResponse.json({ error: "Se requieren 'foto' e 'indice'" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido. Use JPG, PNG o WebP." }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `candidato-${indice}.${ext}`;
  const publicDir = path.join(process.cwd(), "public", "candidatos");
  const filePath = path.join(publicDir, filename);

  await fs.mkdir(publicDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

  const fotoUrl = `/candidatos/${filename}`;

  const backendRes = await fetch(`${BACKEND_URL}/api/admin/candidatos/${id}/foto`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ fotoUrl }),
  });

  if (!backendRes.ok) {
    await fs.unlink(filePath).catch(() => null);
    const err = await backendRes.json();
    return NextResponse.json({ error: err.mensaje ?? "Error al actualizar la BD" }, { status: 500 });
  }

  return NextResponse.json({ mensaje: "Foto subida correctamente", fotoUrl });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const backendRes = await fetch(`${BACKEND_URL}/api/admin/candidatos/${id}/foto`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ fotoUrl: null }),
  });

  if (!backendRes.ok) {
    const err = await backendRes.json();
    return NextResponse.json({ error: err.mensaje ?? "Error al eliminar la foto" }, { status: 500 });
  }

  return NextResponse.json({ mensaje: "Foto eliminada" });
}
