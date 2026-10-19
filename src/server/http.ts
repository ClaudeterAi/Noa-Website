import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { CartLimitError, UnitReservedError, UnitUnavailableError } from "./booking";
import { CapacityReachedError, SaleNotOpenError, TypeNotOnSaleError } from "./events/ticketing";

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
  if (e instanceof Error && e.message === "DATABASE_URL is not set") return error(503, "NOT_CONFIGURED", "The booking engine is not configured on this deployment yet");
  if (e instanceof ZodError) return error(422, "VALIDATION_ERROR", "Invalid request", e.issues);
  if (e instanceof SaleNotOpenError) return error(409, e.state === "closed" ? "SALES_CLOSED" : "SALES_NOT_OPEN", e.message, { opensAt: e.opensAt });
  if (e instanceof TypeNotOnSaleError) return error(409, "TYPE_NOT_ON_SALE", e.message, { typeId: e.typeId });
  if (e instanceof CapacityReachedError) return error(409, "SOLD_OUT", e.message, { cap: e.cap });
  if (e instanceof CartLimitError) return error(409, "CART_LIMIT", e.message, { limit: e.limit });
  if (e instanceof UnitReservedError) return error(409, "UNIT_RESERVED", e.message, { unitId: e.unitId, releaseAt: e.releaseAt.toISOString() });
  if (e instanceof UnitUnavailableError) return error(409, "UNIT_UNAVAILABLE", e.message, { unitId: e.unitId });
  console.error(e);
  return error(500, "INTERNAL", "Something went wrong");
}
