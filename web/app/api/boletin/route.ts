import { NextResponse } from "next/server";
import { getWriteDb } from "@/lib/db-write";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL = 254;

export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  if (typeof email !== "string" || email.length > MAX_EMAIL || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
  }

  const normalizado = email.trim().toLowerCase();
  try {
    const db = getWriteDb();
    db.prepare(
      `INSERT INTO suscriptores (email, creado_en) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET activo = 1`
    ).run(normalizado, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[boletin] error al suscribir:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno; intenta más tarde." },
      { status: 500 }
    );
  }
}
