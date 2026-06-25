// Quick LLM smoke test
const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

async function test(baseURL) {
  console.log('\n=== Testing baseURL:', baseURL);
  try {
    const provider = createOpenAI({
      apiKey: process.env.EMERGENT_LLM_KEY,
      baseURL,
    });
    const result = await generateText({
      model: provider('gemini-2.5-flash'),
      prompt: 'Say "hello" in one word.',
    });
    console.log('SUCCESS:', result.text);
    return true;
  } catch (e) {
    console.log('FAIL:', e.message?.substring(0, 200));
    return false;
  }
}

(async () => {
  require('dotenv').config({ path: '/app/.env' });
  console.log('Key:', process.env.EMERGENT_LLM_KEY?.substring(0, 20));
  const urls = [
    'https://integrations.emergentagent.com/llm/v1',
    'https://api.emergentintegrations.com/v1',
    'https://llm.emergentagent.com/v1',
    'https://integrations.emergent.sh/llm/v1',
  ];
  for (const u of urls) await test(u);
})();
