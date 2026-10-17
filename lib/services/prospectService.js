import crypto from "crypto";
import {
  PROSPECT_STATUSES,
  normalizeStatus,
  normalizeChannel,
  onProspectBooked,
} from "@/lib/prospects";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";

function truncate(str, max) {
  if (typeof str !== "string") return str;
  return str.slice(0, max);
}

export const prospectsCol = (db, uid) =>
  db.collection("leads").doc(uid).collection("prospects");

/**
 * Appends a message to a prospect thread and returns the patch for the parent doc.
 */
export async function appendProspectMessage(
  db,
  FieldValue,
  uid,
  prospectRef,
  { direction, body, channel },
) {
  const mid = crypto.randomUUID();
  const at = new Date();
  const msg = {
    id: mid,
    direction: direction === "inbound" ? "inbound" : "outbound",
    body: truncate(String(body || ""), 4000),
    channel: channel || null,
    at,
  };
  await prospectRef
    .collection("messages")
    .doc(mid)
    .set({ ...msg, createdAt: FieldValue.serverTimestamp() });

  const patch = {
    lastMessageAt: at,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (msg.direction === "inbound") {
    patch.latestReply = msg.body;
    patch.latestReplyAt = at;
  }
  return { msg, patch };
}

/**
 * Creates a new prospect.
 */
export async function createProspect({ db, FieldValue, uid, body }) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  if (!body || typeof body !== "object") {
    throw new ValidationError("invalid JSON body");
  }

  const id = crypto.randomUUID();
  const prospect = {
    id,
    uid,
    name: truncate(String(body.name || "Lead"), 100),
    handle: body.handle ? truncate(String(body.handle), 100) : null,
    channel: normalizeChannel(body.channel),
    email: body.email ? truncate(String(body.email), 200) : null,
    phone: body.phone ? truncate(String(body.phone), 40) : null,
    agentId: body.agentId ? truncate(String(body.agentId), 100) : null,
    notes: body.notes ? truncate(String(body.notes), 2000) : null,
    status: normalizeStatus(body.status),
    scheduledAt: null,
    ghlCalendarId: null,
    latestReply: null,
    latestReplyAt: null,
    lastMessageAt: null,
    source: "manual",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await prospectsCol(db, uid).doc(id).set(prospect);
  return {
    id,
    prospect: { ...prospect, createdAt: null, updatedAt: null },
  };
}

/**
 * Lists prospects for a user, sorted by most recent activity.
 */
export async function listProspects({ db, uid, statusFilter, ser }) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  let q = prospectsCol(db, uid);
  if (statusFilter && PROSPECT_STATUSES.includes(statusFilter)) {
    q = q.where("status", "==", statusFilter);
  }
  const qs = await q.get();
  const prospects = qs.docs
    .map((d) => ser(d))
    .sort((a, b) =>
      (b.latestReplyAt || b.updatedAt || "").localeCompare(
        a.latestReplyAt || a.updatedAt || "",
      ),
    );
  return { prospects };
}

/**
 * Retrieves a prospect along with its message history thread.
 */
export async function getProspectWithMessages({ db, uid, prospectId, ser }) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  const ref = prospectsCol(db, uid).doc(prospectId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError("prospect not found");

  const msgs = await ref.collection("messages").get();
  const messages = msgs.docs
    .map((d) => ser(d))
    .sort((a, b) => (a.at || "").localeCompare(b.at || ""));

  return { prospect: ser(snap), messages };
}

/**
 * Updates a prospect and triggers side effects if status transitioned to booked.
 */
export async function updateProspect({
  db,
  FieldValue,
  uid,
  prospectId,
  body,
  after,
  ser,
}) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  const ref = prospectsCol(db, uid).doc(prospectId);
  if (!body || typeof body !== "object") {
    throw new ValidationError("invalid JSON body");
  }

  // Read and write in one transaction: two concurrent "booked" updates (a
  // double-click) must not both see the old status and fire side effects twice.
  const { prev, patch } = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new NotFoundError("prospect not found");

    const prev = snap.data();
    const patch = { updatedAt: FieldValue.serverTimestamp() };
    if (body.name !== undefined)
      patch.name = truncate(String(body.name || "Lead"), 100);
    if (body.handle !== undefined)
      patch.handle = body.handle ? truncate(String(body.handle), 100) : null;
    if (body.email !== undefined)
      patch.email = body.email ? truncate(String(body.email), 200) : null;
    if (body.phone !== undefined)
      patch.phone = body.phone ? truncate(String(body.phone), 40) : null;
    if (body.notes !== undefined)
      patch.notes = body.notes ? truncate(String(body.notes), 2000) : null;
    if (body.channel !== undefined)
      patch.channel = normalizeChannel(body.channel);
    if (body.ghlCalendarId !== undefined) {
      patch.ghlCalendarId = body.ghlCalendarId
        ? truncate(String(body.ghlCalendarId), 100)
        : null;
    }
    if (body.scheduledAt !== undefined) {
      const t = Date.parse(body.scheduledAt);
      patch.scheduledAt = Number.isFinite(t) ? new Date(t).toISOString() : null;
    }
    if (body.status !== undefined) {
      patch.status = normalizeStatus(body.status, prev.status || "new");
    }

    tx.update(ref, patch);
    return { prev, patch };
  });

  const becameBooked = patch.status === "booked" && prev.status !== "booked";
  if (becameBooked) {
    const merged = {
      ...prev,
      ...patch,
      id: prospectId,
      scheduledAt: patch.scheduledAt ?? (prev.scheduledAt || null),
    };
    if (typeof after === "function") {
      after(() =>
        onProspectBooked({
          db,
          FieldValue,
          uid,
          prospect: merged,
        }),
      );
    }
  }

  const fresh = await ref.get();
  return { prospect: ser(fresh), booked: becameBooked };
}

/**
 * Deletes a prospect and its subcollection messages.
 */
export async function deleteProspect({ db, uid, prospectId }) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  // recursiveDelete pages through the messages; one batch caps at 500 writes.
  await db.recursiveDelete(prospectsCol(db, uid).doc(prospectId));
  return { ok: true };
}

/**
 * Appends a message to a prospect and advances lead status.
 */
export async function addProspectMessage({
  db,
  FieldValue,
  uid,
  prospectId,
  messageData,
}) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  const ref = prospectsCol(db, uid).doc(prospectId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError("prospect not found");
  if (!messageData?.body) throw new ValidationError("body required");

  const { msg, patch } = await appendProspectMessage(
    db,
    FieldValue,
    uid,
    ref,
    messageData,
  );

  const prev = snap.data();
  if (
    msg.direction === "inbound" &&
    ["new", "contacted"].includes(prev.status)
  ) {
    patch.status = "replied";
  }
  if (msg.direction === "outbound" && prev.status === "new") {
    patch.status = "contacted";
  }

  await ref.update(patch);
  return {
    message: {
      ...msg,
      at: msg.at instanceof Date ? msg.at.toISOString() : msg.at,
    },
  };
}

/**
 * Generates or retrieves an inbound reply ingestion token for the user.
 */
export async function getOrCreateInboundToken({
  db,
  FieldValue,
  uid,
  baseUrl,
}) {
  if (!uid) throw new UnauthorizedError("unauthorized");
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  let token = userSnap.exists ? userSnap.data().inboundToken : null;

  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    await userRef.set({ inboundToken: token }, { merge: true });
    await db
      .collection("inbound_tokens")
      .doc(token)
      .set({ uid, createdAt: FieldValue.serverTimestamp() });
  }

  const base =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://www.dmforge.org";
  return { token, url: `${base}/api/inbound/${token}` };
}

/**
 * Ingests an inbound reply from any external webhook/parser, matching or creating the prospect.
 */
export async function ingestInboundReply({ db, FieldValue, token, body }) {
  const tokSnap = await db.collection("inbound_tokens").doc(token).get();
  if (!tokSnap.exists) throw new NotFoundError("invalid token");

  const uid = tokSnap.data().uid;
  if (!body || !body.message) throw new ValidationError("message required");

  const channel = normalizeChannel(body.channel);
  const handle = body.handle ? truncate(String(body.handle), 100) : null;
  const email = body.email ? truncate(String(body.email), 200) : null;
  const phone = body.phone ? truncate(String(body.phone), 40) : null;

  if (!handle && !email && !phone) {
    throw new ValidationError("one of handle, email, phone required");
  }

  const col = prospectsCol(db, uid);
  // Match-or-create in one transaction: Meta delivers a lead's quick
  // back-to-back messages as concurrent webhooks, and two separate
  // lookups would both miss and create two prospects for one person.
  const { matchRef, created } = await db.runTransaction(async (tx) => {
    const matchResults = await Promise.all(
      [
        ["handle", handle],
        ["email", email],
        ["phone", phone],
      ]
        .filter(([, v]) => v)
        .map(([f, v]) =>
          tx.get(col.where("channel", "==", channel).where(f, "==", v).limit(1)),
        ),
    );
    const firstMatch = matchResults.find((r) => !r.empty);
    if (firstMatch) return { matchRef: firstMatch.docs[0].ref, created: false };

    const id = crypto.randomUUID();
    const ref = col.doc(id);
    tx.set(ref, {
      id,
      uid,
      name: truncate(
        String(body.name || handle || email || phone || "Lead"),
        100,
      ),
      handle,
      channel,
      email,
      phone,
      agentId: null,
      notes: null,
      status: "replied",
      scheduledAt: null,
      ghlCalendarId: null,
      latestReply: null,
      latestReplyAt: null,
      lastMessageAt: null,
      source: "inbound",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { matchRef: ref, created: true };
  });

  const { patch } = await appendProspectMessage(db, FieldValue, uid, matchRef, {
    direction: "inbound",
    body: body.message,
    channel,
  });

  if (!created) {
    const cur = (await matchRef.get()).data();
    if (["new", "contacted"].includes(cur.status)) patch.status = "replied";
  }

  await matchRef.update(patch);
  return { ok: true, prospectId: matchRef.id, created };
}
