const { test, expect } = require('@playwright/test')

// ponytail: "campaign" in the GOAL spec maps onto the existing `agents`
// collection here — there's no separate campaign model in this codebase.
test('sequence generate/get require the agent to exist', async ({ request }) => {
  const gen = await request.post('/api/agents/does-not-exist/sequences/generate')
  expect(gen.status()).toBe(404)

  const list = await request.get('/api/agents/does-not-exist/sequences')
  const data = await list.json()
  expect(list.status()).toBe(200)
  expect(data.sequence).toEqual([])
})
