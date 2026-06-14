import {HttpError} from '../middleware/errorHandler.js';

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new HttpError(500, 'Groq API key is not configured', 'GROQ_KEY_MISSING');
  return apiKey;
}

export async function* streamGroqChat(messages: GroqMessage[], modelName: string = GROQ_MODEL) {
  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.45,
      max_tokens: 1400,
      top_p: 0.95,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new HttpError(response.status || 500, `Groq chat failed${detail ? `: ${detail}` : ''}`, 'GROQ_CHAT_FAILED');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const {value, done} = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, {stream: true});
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event.split('\n').find(line => line.startsWith('data: '));
      if (!dataLine) continue;

      const data = dataLine.slice(6).trim();
      if (!data || data === '[DONE]') return;

      const parsed = JSON.parse(data) as GroqStreamChunk;
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) yield token;
    }
  }
}
