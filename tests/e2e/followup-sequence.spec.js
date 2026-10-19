const { test, expect } = require('@playwright/test')

// ponytail: "campaign" in the GOAL spec maps onto the existing `agents`
// collection here — there's no separate campaign model in this codebase.
test('sequence generate/get require the agent to exist', async ({ request }) => {
  const gen = await request.post('/api/agents/does-not-exist/sequences/generate')
  expect(gen.status()).toBe(404)

  // The GET is owner-checked like the PUT, so it needs the agent doc too.
  const list = await request.get('/api/agents/does-not-exist/sequences')
  expect(list.status()).toBe(404)
})
