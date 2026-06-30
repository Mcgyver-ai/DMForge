# DMForge Backlog

- ✅ Rate limiting — sliding-window limiter (`lib/rateLimit.js`) wired into `handleRoute` in the catch-all API route: 60 req/min per uid, 20 req/min per IP for unauthenticated requests, 429 `{ error: "rate_limit_exceeded" }` on breach.
- ✅ Zapier / webhook outbound — `users/{uid}/webhooks` CRUD (`POST`/`GET /api/webhooks`, `DELETE /api/webhooks/:id`) + `triggerWebhooks()` in `lib/webhooks.js`, fired (fire-and-forget, HMAC-SHA256 signed) from `/result/save` when `state.booked` is true.
- ✅ Follow-up sequence builder — "campaign" mapped to the existing `agents` collection (no separate campaign model exists). `agents/{id}/sequences` + Gemini-generated Day 1/3/7 sequence (`POST/GET /api/agents/:id/sequences[/generate]`, `PUT .../sequences/:seqId`), inline expandable panel + edit on the dashboard agent cards.
- ⛔ Inbox view — SKIPPED. Spec needs `leads/{uid}/prospects` with `latestReply`/`latestReplyAt` (ongoing reply tracking). Nothing in this codebase ingests inbound replies — `results` are one-shot saved transcripts from the demo simulator, not a live conversation thread. Building an inbox here means designing the missing reply-ingestion pipeline first; flagged per user decision rather than faked.
- [ ] Email outreach channel
- [ ] LinkedIn OAuth connect
- [ ] Team / agency seats
- [ ] SMS appointment reminders
- [ ] White-label mode
- [ ] GoHighLevel integration
