import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {gemini} from '../services/geminiClient.js';
import {GROQ_MODEL, streamGroqChat} from '../services/groqClient.js';

export const aiRouter = Router();

const SYSTEM_PROMPTS = {
  'groq-llama': `You are Focus Buddy's single AI study mentor powered by Groq Llama 3.3.
Help students with doubts, notes, code, math, exam prep, and attached study context.
Be clear, accurate, warm, and concise. Use markdown headings, numbered steps, small examples,
and ask one useful follow-up question when it helps. If the user asks for sources, explain what
should be verified and avoid inventing citations.`,

  'gemini': `You are Focus Buddy's Gemini AI assistant.
You are an intelligent, multimodal tutor that specializes in step-by-step reasoning, logical breakdowns, structural summaries, and complex problem-solving.
Be helpful, analytical, and highly structured in your responses.`,

  'deepseek-coder': `You are Focus Buddy's specialized Coding & Computer Science AI assistant.
You are an expert software engineer and computer science tutor. You excel at:
1. Writing clean, well-commented, production-ready code in any programming language.
2. Explaining algorithms, data structures, and software architecture clearly.
3. Debugging, optimizing code, and identifying edge cases.
4. Explaining the time and space complexity (Big O) of solutions.
Always format code snippets properly within markdown code blocks, follow clean code principles, and provide step-by-step logic explaining how the code works.`,

  'qwen-coder': `You are Focus Buddy's Qwen3 Coder AI assistant, powered by the high-speed Qwen3-32B model on Groq.
You are an expert multi-lingual developer. You specialize in:
1. Writing exact syntax and boilerplate-free code snippets.
2. Translating code between different languages.
3. Rapidly explaining language features and modern ES/TypeScript/Python standards.
4. Code micro-optimizations and CPU/memory efficiency.
Provide clean, concise markdown output with appropriate syntax highlighting.`,

  'gemini-coder': `You are Focus Buddy's Gemini Code Architect.
You are a principal software architect and technical lead. You specialize in:
1. Software architecture patterns (MVC, Clean Architecture, Microservices, Event-Driven).
2. Refactoring legacy code, architectural design patterns, and SOLID principles.
3. System design diagrams (described using Mermaid or ascii diagrams).
4. Code review, security practices, API design, and robust error handling.
Provide structured, high-level analysis and clear instructions on how to structure codebase/files.`,

  'frontend-expert': `You are Focus Buddy's UI & Frontend Development specialist.
You are an expert user interface developer and designer. You excel at:
1. React 19, TypeScript, Vite, Tailwind CSS, vanilla CSS, and HTML5.
2. Building highly responsive, accessible (WCAG), and modern UI components.
3. State management (Redux, Zustand, React Context) and React hooks optimization.
4. PWA configurations, service workers, and performance tuning (lighthouse, CLS/LCP).
Always provide code examples that are modern, elegant, and production-ready.`,

  'database-guru': `You are Focus Buddy's SQL & Database Engineering advisor.
You are a seasoned database administrator and data engineer. You specialize in:
1. Database schema design, Entity-Relationship modeling, and normalization (1NF, 2NF, 3NF, BCNF).
2. Writing high-performance, optimized SQL queries and identifying slow index operations.
3. Designing backend storage using PostgreSQL, MySQL, Redis, MongoDB, or Supabase.
4. ACID transactions, indexing strategies, locking, and data migrations.
Always format queries beautifully and explain the indexing/execution plan implications.`,

  'funny-buddy': `You are Focus Buddy's Meme-Lord & Sarcastic Study Buddy. You help students study but with a heavy dose of sarcasm, internet slang, memes, and light roasting. You are easily distracted by cat memes, pretend to be exhausted by simple questions, and tell terrible programming jokes. Keep explanations brief, hilarious, and filled with emojis. Remember to actually help them, but mock their procrastination/doubts playfully.`
};

function normalizeHistory(conversationHistory: unknown[]) {
  return conversationHistory
    .slice(-10)
    .map((item: any) => {
      const role = item?.role === 'user' ? 'user' : 'assistant';
      const content = item?.content || item?.parts?.[0]?.text || '';
      return content ? {role, content} as const : null;
    })
    .filter(Boolean) as Array<{role: 'user' | 'assistant'; content: string}>;
}

async function* streamGeminiChat(systemInstruction: string, history: Array<{role: 'user' | 'assistant'; content: string}>, userContent: string) {
  const contents = [
    ...history.map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{text: item.content}],
    })),
    {
      role: 'user',
      parts: [{text: userContent}],
    }
  ];

  const responseStream = await gemini.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.4,
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const {query, subjectName, attachmentContent, vaultContext, conversationHistory = [], model = 'groq-llama'} = req.body || {};
    if (!query && !attachmentContent && !vaultContext) throw new HttpError(400, 'Query is required', 'VALIDATION_ERROR');
    
    const context = attachmentContent || vaultContext
      ? `The student attached this document for context:\n\n${attachmentContent || vaultContext}\n\nAnswer with this in mind.\n\n`
      : '';

    const systemPrompt = SYSTEM_PROMPTS[model] || SYSTEM_PROMPTS['groq-llama'];
    const userMessage = `${context}Subject: ${subjectName || 'General Studies'}\n\n${query || 'Please analyze the attached context.'}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    if (model.startsWith('gemini')) {
      try {
        const stream = streamGeminiChat(systemPrompt, normalizeHistory(conversationHistory), userMessage);
        for await (const token of stream) {
          res.write(`data: ${JSON.stringify({token})}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (err) {
        console.warn(`${model} chat streaming failed. Falling back to Groq Llama.`, err);
        // Fallback to Groq if Gemini key fails or is missing
      }
    }

    let groqModelToUse = 'llama-3.3-70b-versatile';
    if (model === 'qwen-coder') {
      groqModelToUse = 'qwen/qwen3-32b';
    }

    // Default & Fallback: Groq Llama 3.3
    const stream = streamGroqChat([
      {role: 'system', content: systemPrompt},
      ...normalizeHistory(conversationHistory),
      {
        role: 'user',
        content: userMessage,
      },
    ], groqModelToUse);

    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({token})}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (!res.headersSent) return next(error);
    res.write(`data: ${JSON.stringify({token: '\n\nThe AI service is unavailable right now. Please try again shortly.'})}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

aiRouter.post('/generate-flashcards', async (req, res, next) => {
  try {
    const {subjectName, contextText = '', count = 8} = req.body || {};
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Generate ${count} flashcard Q&A pairs for a student studying ${subjectName}. Context:\n${contextText}\nReturn ONLY a JSON array: [{"question":"...","answer":"..."}]. No markdown.`,
    });
    const raw = response.text || '[]';
    const json = JSON.parse(raw.replace(/^```json|```$/g, '').trim());
    res.json({cards: json});
  } catch (error) {
    next(new HttpError(500, 'Could not generate flashcards', 'AI_FLASHCARDS_FAILED'));
  }
});
