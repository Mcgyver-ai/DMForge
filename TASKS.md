# DMForge Backlog

- ✅ Rate limiting — sliding-window limiter (`lib/rateLimit.js`) wired into `handleRoute` in the catch-all API route: 60 req/min per uid, 20 req/min per IP for unauthenticated requests, 429 `{ error: "rate_limit_exceeded" }` on breach.
- [ ] Zapier / webhook outbound
- [ ] Follow-up sequence builder
- [ ] Inbox view
- [ ] Email outreach channel
- [ ] LinkedIn OAuth connect
- [ ] Team / agency seats
- [ ] SMS appointment reminders
- [ ] White-label mode
- [ ] GoHighLevel integration
