import { ApiGatewayManagementApiClient, PostToConnectionCommand, GoneException } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { after } from "next/server";

/**
 * Live seat map: browsers watching a session hold a WebSocket (API Gateway); the engine pushes
 * state changes here after each hold / release / booking / sweep. Correctness never depends on
 * this — the database is the truth and the map still polls as a fallback. Fire-and-forget.
 */
export type SeatChange = { unitId: string; state: "free" | "held" | "booked" | "reserved" | "closed"; heldUntil?: string };

const configured = () => !!(process.env.WS_MANAGEMENT_ENDPOINT && process.env.WS_TABLE);
let mgmt: ApiGatewayManagementApiClient | null = null, ddb: DynamoDBDocumentClient | null = null;

export async function broadcastSeatChanges(date: string, slot: string, changes: SeatChange[], serverTime = new Date().toISOString()): Promise<number> {
  if (!configured() || !changes.length) return 0;
  const region = process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "eu-central-1";
  mgmt ??= new ApiGatewayManagementApiClient({ region, endpoint: process.env.WS_MANAGEMENT_ENDPOINT });
  ddb ??= DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  const table = process.env.WS_TABLE!;
  const res = await ddb.send(new QueryCommand({ TableName: table, IndexName: "bySession", KeyConditionExpression: "sessionKey = :k", ExpressionAttributeValues: { ":k": `${date}#${slot}` } }));
  const payload = Buffer.from(JSON.stringify({ type: "availability", date, slot, serverTime, changes }));
  let sent = 0;
  await Promise.all((res.Items ?? []).map(async (it) => {
    const id = it.connectionId as string;
    try { await mgmt!.send(new PostToConnectionCommand({ ConnectionId: id, Data: payload })); sent++; }
    catch (e) { if (e instanceof GoneException || (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 410) await ddb!.send(new DeleteCommand({ TableName: table, Key: { connectionId: id } })).catch(() => undefined); }
  }));
  return sent;
}

/**
 * Never let a realtime failure affect the booking path. On Vercel a function is frozen as soon as the
 * response is sent, so the push is scheduled with next/server's after() (runs after the response,
 * kept alive by the platform); outside a request scope (tests, scripts) it simply runs in the background.
 */
export function broadcastSafely(date: string, slot: string, changes: SeatChange[]) {
  const run = () => broadcastSeatChanges(date, slot, changes).catch((e) => console.warn("[realtime] broadcast failed:", e instanceof Error ? e.message : e));
  try { after(run); } catch { void run(); }
}
