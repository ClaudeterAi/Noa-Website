import { describe, expect, it } from "vitest";
import { ticketToken, verifyTicket } from "@/server/ticket";

describe("wristband ticket token", () => {
  it("round-trips a reference and rejects tampering", () => {
    process.env.GUEST_SESSION_SECRET ??= "test-secret";
    const t = ticketToken("NOA-A7K2M9");
    expect(t).toMatch(/^NOA-A7K2M9\.[0-9a-f]{12}$/);
    expect(verifyTicket(t)).toBe("NOA-A7K2M9");
    expect(verifyTicket(t.replace(/.$/, (c) => (c === "0" ? "1" : "0")))).toBeNull();   // signature changed
    expect(verifyTicket("NOA-B7K2M9." + t.split(".")[1])).toBeNull();                    // reference changed
    expect(verifyTicket("NOA-A7K2M9")).toBeNull();                                        // no signature
    expect(verifyTicket(t.toLowerCase())).toBe("NOA-A7K2M9");                             // scanners sometimes lowercase
  });
});
