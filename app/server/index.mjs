import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(distDir));

async function generatePhrases() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiKey || !model) throw new Error('Missing OpenRouter env.');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Generate absurd, funny, PG-13 brainrot meme phrases for a typing game. Return valid JSON only with key phrases as an array of 8 strings. Each phrase should be 4-9 words, lowercase, and easy to type but silly.',
        },
        { role: 'user', content: 'Generate a fresh phrase pack.' },
      ],
    }),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'OpenRouter request failed.');
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content.');
  const parsed = JSON.parse(content);
  return parsed.phrases;
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/phrase-pack', async (_req, res) => {
  try {
    const phrases = await generatePhrases();
    return res.json({ phrases, model: process.env.OPENROUTER_MODEL, fallback: false });
  } catch (error) {
    return res.json({
      error: error.message || 'Phrase generation failed.',
      fallback: true,
      phrases: [
        'skibidi goblin tax audit',
        'sigma hamster in the vents',
        'grimace shake ate my homework',
        'ohio wizard with wifi boots',
        'rizz astronaut lost in ohio',
        'baby gronk stole the moon',
        'npc raccoon with drip',
        'gyatt tornado in aisle five',
      ],
    });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Gas Pump Simulator listening on ${port}`);
});
