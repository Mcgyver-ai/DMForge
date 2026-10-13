import { describe, it, expect, vi } from "vitest";
import { recordAuditEvent } from "@/lib/auditLog";

vi.mock("@/lib/firebaseAdmin", () => {
  const addFn = vi.fn().mockResolvedValue({ id: "mock-audit-id" });
  const collectionFn = vi.fn().mockReturnValue({ add: addFn });
  return {
    getAdminDb: vi.fn().mockReturnValue({ collection: collectionFn }),
    getAdminFieldValue: vi.fn().mockReturnValue({
      serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
    }),
  };
});

describe("recordAuditEvent", () => {
  it("writes structured audit event entry to audit_logs collection", async () => {
    const { getAdminDb } = await import("@/lib/firebaseAdmin");
    await recordAuditEvent({
      eventType: "account.deleted",
      actorId: "user_123",
      details: { reason: "DSAR erasure" },
      ip: "192.0.2.1",
    });

    const db = getAdminDb();
    expect(db.collection).toHaveBeenCalledWith("audit_logs");
    const collection = db.collection("audit_logs");
    expect(collection.add).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "account.deleted",
        actorId: "user_123",
        details: { reason: "DSAR erasure" },
        ip: "192.0.2.1",
        timestamp: "mock-timestamp",
      }),
    );
  });

  it("handles missing actor gracefully by setting anonymous", async () => {
    const { getAdminDb } = await import("@/lib/firebaseAdmin");
    await recordAuditEvent({
      eventType: "test.event",
    });

    const db = getAdminDb();
    const collection = db.collection("audit_logs");
    expect(collection.add).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "test.event",
        actorId: "anonymous",
      }),
    );
  });
});
