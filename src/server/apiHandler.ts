import { NextRequest, NextResponse } from "next/server";
import { ApiError, BadRequest, Forbidden } from "./apiError";

const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * CSRF defense for state-changing requests. Real browsers (including the
 * Capacitor WebView, which loads the real HTTPS origin) send `Origin` on
 * every fetch/XHR with a mutating method, not just cross-origin ones, so
 * requiring it here doesn't break legitimate same-origin calls. Falls back
 * to `Referer` for the rare client that omits `Origin`; requests with
 * neither header are rejected rather than allowed through unchecked.
 */
function checkOrigin(req: NextRequest): void {
  if (!MUTATING_METHODS.has(req.method)) return;

  const allowed = allowedOrigins();
  const origin = req.headers.get("origin");
  if (origin) {
    if (!allowed.includes(origin)) throw Forbidden("Origem não permitida.");
    return;
  }

  const referer = req.headers.get("referer");
  let refererOrigin: string | null = null;
  try {
    refererOrigin = referer ? new URL(referer).origin : null;
  } catch {
    refererOrigin = null;
  }
  if (!refererOrigin || !allowed.includes(refererOrigin)) {
    throw Forbidden("Origem não permitida.");
  }
}

type EmptyParams = Record<never, string>;
type Handler<P extends object = EmptyParams> = (
  req: NextRequest,
  ctx: { params: Promise<P> },
) => Promise<unknown>;

/** Wraps a route handler with Origin/CSRF checks and a consistent JSON envelope. */
export function withApi<P extends object = EmptyParams>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      checkOrigin(req);
      const data = await handler(req, ctx);
      return NextResponse.json({ ok: true, data });
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
      }
      console.error("Unhandled API error:", err);
      return NextResponse.json({ ok: false, error: "Erro interno do servidor." }, { status: 500 });
    }
  };
}

export async function parseJsonBody<T>(req: NextRequest, schema: { parse(v: unknown): T }): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw BadRequest("Corpo do pedido inválido (JSON esperado).");
  }
  try {
    return schema.parse(raw);
  } catch {
    throw BadRequest("Dados inválidos.");
  }
}
