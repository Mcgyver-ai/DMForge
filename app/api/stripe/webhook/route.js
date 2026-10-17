import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb, getAdminFieldValue } from "@/lib/firebaseAdmin";
import { logError } from "@/lib/logger";
import { findSubscriberDocId } from "@/lib/services/billingService";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  const stripe = getStripe();
  let event;
  try {
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else if (process.env.NODE_ENV !== "production") {
      // Allow unsigned webhooks only in development (e.g. Stripe CLI forwarding)
      console.warn(
        "STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)",
      );
      event = JSON.parse(body);
    } else {
      return NextResponse.json(
        { error: "Webhook signature verification required in production" },
        { status: 400 },
      );
    }
  } catch (err) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const db = getAdminDb();
  const FV = getAdminFieldValue();

  // Idempotency: Stripe retries and may deliver an event twice. create() is
  // atomic and throws ALREADY_EXISTS (gRPC code 6) if we've claimed it before.
  const claimRef = event.id
    ? db.collection("processed_stripe_events").doc(event.id)
    : null;
  if (claimRef) {
    try {
      await claimRef.create({
        type: event.type,
        processedAt: FV.serverTimestamp(),
      });
    } catch (err) {
      if (err?.code === 6)
        return NextResponse.json({ received: true, duplicate: true });
      logError("stripe webhook idempotency claim failed", err, {
        eventType: event.type,
      });
      return NextResponse.json({ error: "temporary failure" }, { status: 500 });
    }
  }

  async function syncSubscription(email, uid, subOrSession) {
    const sub =
      subOrSession.object === "subscription"
        ? subOrSession
        : await stripe.subscriptions.retrieve(subOrSession.subscription);
    const docId =
      uid ||
      (email &&
        (await db.collection("users").where("email", "==", email).limit(1).get())
          .docs[0]?.id) ||
      sub.customer;
    await db
      .collection("users")
      .doc(docId)
      .set(
        {
          uid: uid || null,
          email,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          plan: sub.metadata?.planKey || "pro_monthly",
          status: sub.status,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
          updatedAt: FV.serverTimestamp(),
        },
        { merge: true },
      );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const email = s.customer_details?.email || s.metadata?.email;
        const uid = s.metadata?.uid;
        if (email && s.subscription) await syncSubscription(email, uid, s);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const email = sub.metadata?.email;
        const uid = sub.metadata?.uid;
        if (email) await syncSubscription(email, uid, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const docId = await findSubscriberDocId({
          db,
          uid: sub.metadata?.uid,
          email: sub.metadata?.email,
          customerId: sub.customer,
        });
        // No user to downgrade: retrying can never succeed, so log and 200.
        if (!docId) {
          logError(
            "subscription.deleted: no user found",
            new Error("unmatched subscription"),
            { subscriptionId: sub.id, customerId: sub.customer },
          );
          break;
        }
        await db
          .collection("users")
          .doc(docId)
          .set(
            {
              status: "canceled",
              plan: "free",
              updatedAt: FV.serverTimestamp(),
            },
            { merge: true },
          );
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        // Invoice-level events are the correct hook for surfacing renewal/dunning
        // state (Stripe transitions subscription.status to past_due/unpaid on
        // failed renewal, which this reuses the same sync path to record).
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const email = sub.metadata?.email;
          const uid = sub.metadata?.uid;
          if (email) await syncSubscription(email, uid, sub);
        }
        break;
      }
    }
  } catch (e) {
    console.error("webhook handler", e);
    logError("webhook handler error", e, { eventType: event.type });
    Sentry.captureException(e);
    // Release the claim and 500 so Stripe redelivers; a 200 here would drop the update.
    if (claimRef)
      await claimRef
        .delete()
        .catch((delErr) =>
          logError("stripe webhook claim release failed", delErr),
        );
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
