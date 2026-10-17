import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProspect,
  listProspects,
  getProspectWithMessages,
  updateProspect,
  deleteProspect,
  addProspectMessage,
  getOrCreateInboundToken,
  ingestInboundReply,
} from "../services/prospectService";
import { ValidationError, NotFoundError, UnauthorizedError } from "../errors";

vi.mock("@/lib/prospects", () => ({
  PROSPECT_STATUSES: [
    "new",
    "contacted",
    "replied",
    "qualified",
    "booked",
    "lost",
  ],
  PROSPECT_CHANNELS: ["instagram", "messenger", "email", "sms", "manual"],
  normalizeStatus: (s, fallback = "new") =>
    ["new", "contacted", "replied", "qualified", "booked", "lost"].includes(s)
      ? s
      : fallback,
  normalizeChannel: (c, fallback = "manual") =>
    ["instagram", "messenger", "email", "sms", "manual"].includes(c) ? c : fallback,
  onProspectBooked: vi.fn(),
}));

import { onProspectBooked } from "@/lib/prospects";

describe("Prospect Service (lib/services/prospectService.js)", () => {
  let mockDb;
  let mockFieldValue;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFieldValue = {
      serverTimestamp: vi.fn().mockReturnValue("TIMESTAMP"),
    };
  });

  describe("createProspect", () => {
    it("creates a prospect successfully", async () => {
      const mockSet = vi.fn().mockResolvedValue({});
      mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            collection: vi.fn().mockReturnValue({
              doc: vi.fn().mockReturnValue({ set: mockSet }),
            }),
          }),
        }),
      };

      const res = await createProspect({
        db: mockDb,
        FieldValue: mockFieldValue,
        uid: "user-1",
        body: { name: "Lead 1", channel: "instagram" },
      });

      expect(res.id).toBeDefined();
      expect(res.prospect.name).toBe("Lead 1");
      expect(res.prospect.channel).toBe("instagram");
      expect(mockSet).toHaveBeenCalledTimes(1);
    });

    it("throws UnauthorizedError if uid is missing", async () => {
      await expect(
        createProspect({
          db: {},
          FieldValue: mockFieldValue,
          uid: null,
          body: {},
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("updateProspect", () => {
    function txDb(prevData, freshData) {
      const ref = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => freshData }),
      };
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => prevData }),
        update: vi.fn(),
      };
      const db = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            collection: vi.fn().mockReturnValue({
              doc: vi.fn().mockReturnValue(ref),
            }),
          }),
        }),
        runTransaction: vi.fn(async (fn) => fn(tx)),
      };
      return { db, tx };
    }

    const bookedBody = { status: "booked", scheduledAt: "2026-10-01T14:00:00Z" };

    it("updates prospect and triggers onProspectBooked when transitioning to booked", async () => {
      const { db, tx } = txDb(
        { status: "qualified", name: "John Coach", scheduledAt: null },
        { status: "booked", name: "John Coach", scheduledAt: "2026-10-01T14:00:00Z" },
      );
      const mockAfter = vi.fn((fn) => fn());

      const res = await updateProspect({
        db,
        FieldValue: mockFieldValue,
        uid: "user-1",
        prospectId: "p-1",
        body: bookedBody,
        after: mockAfter,
        ser: (d) => d.data(),
      });

      expect(res.booked).toBe(true);
      expect(tx.update).toHaveBeenCalledTimes(1);
      expect(mockAfter).toHaveBeenCalledTimes(1);
      expect(onProspectBooked).toHaveBeenCalledTimes(1);
    });

    it("does not fire booked side effects when the transaction reads an already-booked prospect", async () => {
      // The second of two concurrent "booked" clicks: its transaction sees the
      // first one's write, so it must not send reminders/webhooks again.
      const { db } = txDb({ status: "booked" }, { status: "booked" });
      const mockAfter = vi.fn((fn) => fn());

      const res = await updateProspect({
        db,
        FieldValue: mockFieldValue,
        uid: "user-1",
        prospectId: "p-1",
        body: bookedBody,
        after: mockAfter,
        ser: (d) => d.data(),
      });

      expect(res.booked).toBe(false);
      expect(mockAfter).not.toHaveBeenCalled();
      expect(onProspectBooked).not.toHaveBeenCalled();
    });

    it("404s inside the transaction when the prospect is gone", async () => {
      const db = {
        collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({}) }) }) }),
        runTransaction: async (fn) => fn({ get: async () => ({ exists: false }), update: vi.fn() }),
      };
      await expect(
        updateProspect({ db, FieldValue: mockFieldValue, uid: "user-1", prospectId: "p-1", body: bookedBody }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("ingestInboundReply", () => {
    function inboundDb({ match = null } = {}) {
      const messageSet = vi.fn().mockResolvedValue({});
      const prospectRef = (id) => ({
        id,
        collection: () => ({ doc: () => ({ set: messageSet }) }),
        get: vi.fn().mockResolvedValue({ data: () => ({ status: "contacted" }) }),
        update: vi.fn().mockResolvedValue({}),
      });
      const query = { where: () => query, limit: () => query };
      const tx = {
        get: vi.fn().mockResolvedValue(match ? { empty: false, docs: [{ ref: prospectRef(match) }] } : { empty: true, docs: [] }),
        set: vi.fn(),
      };
      const db = {
        collection: (name) => ({
          doc: (id) =>
            name === "inbound_tokens"
              ? { get: async () => ({ exists: true, data: () => ({ uid: "user-1" }) }) }
              : { collection: () => ({ ...query, doc: (pid) => prospectRef(pid) }) },
        }),
        runTransaction: vi.fn(async (fn) => fn(tx)),
      };
      return { db, tx };
    }

    it("creates the prospect inside the match transaction when no match exists", async () => {
      const { db, tx } = inboundDb();
      const res = await ingestInboundReply({
        db,
        FieldValue: mockFieldValue,
        token: "tok",
        body: { channel: "instagram", handle: "lead1", message: "hi" },
      });
      expect(db.runTransaction).toHaveBeenCalledTimes(1);
      expect(tx.set).toHaveBeenCalledTimes(1);
      expect(res.created).toBe(true);
    });

    it("reuses the matched prospect without creating another", async () => {
      const { db, tx } = inboundDb({ match: "p-existing" });
      const res = await ingestInboundReply({
        db,
        FieldValue: mockFieldValue,
        token: "tok",
        body: { channel: "instagram", handle: "lead1", message: "are you there" },
      });
      expect(tx.set).not.toHaveBeenCalled();
      expect(res).toEqual({ ok: true, prospectId: "p-existing", created: false });
    });
  });

  describe("getOrCreateInboundToken", () => {
    it("creates and returns an inbound token for user", async () => {
      const mockUserSet = vi.fn().mockResolvedValue({});
      const mockTokenSet = vi.fn().mockResolvedValue({});

      mockDb = {
        collection: vi.fn((name) => {
          if (name === "users") {
            return {
              doc: vi.fn().mockReturnValue({
                get: vi
                  .fn()
                  .mockResolvedValue({ exists: true, data: () => ({}) }),
                set: mockUserSet,
              }),
            };
          }
          if (name === "inbound_tokens") {
            return {
              doc: vi.fn().mockReturnValue({ set: mockTokenSet }),
            };
          }
          return {};
        }),
      };

      const res = await getOrCreateInboundToken({
        db: mockDb,
        FieldValue: mockFieldValue,
        uid: "user-1",
        baseUrl: "http://localhost:3000",
      });

      expect(res.token).toHaveLength(48); // 24 bytes hex
      expect(res.url).toContain(`/api/inbound/${res.token}`);
      expect(mockUserSet).toHaveBeenCalledTimes(1);
      expect(mockTokenSet).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteProspect", () => {
    it("recursively deletes the prospect with all its messages", async () => {
      const prospectRef = { path: "leads/user-1/prospects/p-1" };
      mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            collection: vi.fn().mockReturnValue({
              doc: vi.fn().mockReturnValue(prospectRef),
            }),
          }),
        }),
        recursiveDelete: vi.fn().mockResolvedValue(undefined),
      };

      const res = await deleteProspect({ db: mockDb, uid: "user-1", prospectId: "p-1" });

      expect(res.ok).toBe(true);
      expect(mockDb.recursiveDelete).toHaveBeenCalledWith(prospectRef);
    });
  });
});
