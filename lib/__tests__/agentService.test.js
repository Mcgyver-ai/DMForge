import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAgentAccessDenied,
  createAgent,
  listAgentSequences,
} from "../services/agentService";
import {
  ValidationError,
  AppError,
  ForbiddenError,
  NotFoundError,
} from "../errors";

// Mock chatJSON and logger
vi.mock("@/lib/llm", () => ({
  chatJSON: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
  logError: vi.fn(),
}));

import { chatJSON } from "@/lib/llm";

describe("Agent Service (lib/services/agentService.js)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAgentAccessDenied", () => {
    it("allows access to anonymous agents (ownerUid is null)", () => {
      const agent = { id: "agent-1", ownerUid: null };
      expect(isAgentAccessDenied(agent, null)).toBe(false);
      expect(isAgentAccessDenied(agent, { uid: "user-1" })).toBe(false);
    });

    it("allows access to owned agents if caller matches ownerUid", () => {
      const agent = { id: "agent-2", ownerUid: "user-123" };
      expect(isAgentAccessDenied(agent, { uid: "user-123" })).toBe(false);
    });

    it("denies access to owned agents if caller is signed out or different user", () => {
      const agent = { id: "agent-2", ownerUid: "user-123" };
      expect(isAgentAccessDenied(agent, null)).toBe(true);
      expect(isAgentAccessDenied(agent, { uid: "other-user" })).toBe(true);
    });
  });

  describe("createAgent", () => {
    it("creates an agent with clean script and stores in Firestore", async () => {
      const mockScript = {
        intro: "Hey, saw your message!",
        questions: [{ key: "goal", ask: "What is your goal?", why: "Qualify" }],
        bookingMessage: "Ready for a quick strategy call?",
        tonePrompt: "Casual and direct",
        disqualifyResponse: "All the best with your journey.",
      };

      chatJSON.mockResolvedValueOnce(mockScript);

      const mockDoc = { set: vi.fn().mockResolvedValue({}) };
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue(mockDoc),
        }),
      };
      const mockFieldValue = {
        serverTimestamp: vi.fn().mockReturnValue("TIMESTAMP"),
      };

      const input = {
        niche: "Fitness",
        offer: "10-week coaching $1500",
        agentName: "Alex",
      };

      const result = await createAgent({
        db: mockDb,
        FieldValue: mockFieldValue,
        ownerUid: "coach-1",
        ownerEmail: "coach@test.com",
        input,
      });

      expect(result.id).toBeDefined();
      expect(result.agentName).toBe("Alex");
      expect(result.script).toEqual(mockScript);
      expect(mockDb.collection).toHaveBeenCalledWith("agents");
      expect(mockDoc.set).toHaveBeenCalledTimes(1);
    });

    it("retries when script contains placeholders and throws 502 if placeholders survive", async () => {
      const leakingScript = {
        intro: "Hey [Name], thanks for following!",
        questions: [],
        bookingMessage: "Book call",
        tonePrompt: "Friendly",
        disqualifyResponse: "Bye",
      };

      // Both initial and retry leak
      chatJSON
        .mockResolvedValueOnce(leakingScript)
        .mockResolvedValueOnce(leakingScript);

      const mockDb = { collection: vi.fn() };
      const mockFieldValue = { serverTimestamp: vi.fn() };

      await expect(
        createAgent({
          db: mockDb,
          FieldValue: mockFieldValue,
          input: { niche: "SaaS", offer: "SEO Consulting" },
        }),
      ).rejects.toThrow(AppError);

      expect(chatJSON).toHaveBeenCalledTimes(2);
    });

    it("rejects invalid inputs before calling LLM", async () => {
      const mockDb = { collection: vi.fn() };
      const mockFieldValue = { serverTimestamp: vi.fn() };

      await expect(
        createAgent({
          db: mockDb,
          FieldValue: mockFieldValue,
          input: { niche: "" },
        }),
      ).rejects.toThrow(ValidationError);

      expect(chatJSON).not.toHaveBeenCalled();
    });
  });
});

describe("listAgentSequences", () => {
  function agentDb(agent) {
    const seqGet = vi.fn(async () => ({
      docs: [{ data: () => ({ dayOffset: 3 }) }, { data: () => ({ dayOffset: 1 }) }],
    }));
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => (agent ? { exists: true, data: () => agent } : { exists: false }),
          collection: () => ({ get: seqGet }),
        }),
      }),
    };
    return { db, seqGet };
  }

  it("404s when the agent does not exist", async () => {
    const { db } = agentDb(null);
    await expect(listAgentSequences({ db, agentId: "a1", user: null })).rejects.toThrow(NotFoundError);
  });

  it("403s for a non-owner without reading the sequence", async () => {
    const { db, seqGet } = agentDb({ ownerUid: "owner-1" });
    await expect(
      listAgentSequences({ db, agentId: "a1", user: { uid: "intruder" } }),
    ).rejects.toThrow(ForbiddenError);
    await expect(listAgentSequences({ db, agentId: "a1", user: null })).rejects.toThrow(ForbiddenError);
    expect(seqGet).not.toHaveBeenCalled();
  });

  it("returns the sorted sequence to the owner and for anonymous agents", async () => {
    const owned = agentDb({ ownerUid: "owner-1" });
    expect(await listAgentSequences({ db: owned.db, agentId: "a1", user: { uid: "owner-1" } })).toEqual([
      { dayOffset: 1 },
      { dayOffset: 3 },
    ]);
    const anon = agentDb({ ownerUid: null });
    expect(await listAgentSequences({ db: anon.db, agentId: "a1", user: null })).toHaveLength(2);
  });
});
