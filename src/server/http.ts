import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UnitUnavailableError } from "./booking";

export function json<T>(data: T, init?: ResponseInit) { return NextResponse.json(data, init); }

export function error(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => null);
  return schema.parse(body);
}

/** Maps domain errors to HTTP without leaking stack traces. */
export function handle(e: unknown) {
  if (e instanceof ZodError) return error(422, "VALIDATION_ERROR", "Invalid request", e.issues);
  if (e instanceof UnitUnavailableError) return error(409, "UNIT_UNAVAILABLE", e.message, { unitId: e.unitId });
  console.error(e);
  return error(500, "INTERNAL", "Something went wrong");
}
