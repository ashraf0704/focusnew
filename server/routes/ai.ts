import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {gemini} from '../services/geminiClient.js';
import {GROQ_MODEL, streamGroqChat} from '../services/groqClient.js';

export const aiRouter = Router();

const groqTutorPrompt = `You are Focus Buddy's single AI study mentor powered by Groq ${GROQ_MODEL}.
Help students with doubts, notes, code, math, exam prep, and attached study context.
Be clear, accurate, warm, and concise. Use markdown headings, numbered steps, small examples,
and ask one useful follow-up question when it helps. If the user asks for sources, explain what
should be verified and avoid inventing citations.`;

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

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const {query, subjectName, attachmentContent, vaultContext, conversationHistory = []} = req.body || {};
    if (!query && !attachmentContent && !vaultContext) throw new HttpError(400, 'Query is required', 'VALIDATION_ERROR');
    const context = attachmentContent || vaultContext
      ? `The student attached this document for context:\n\n${attachmentContent || vaultContext}\n\nAnswer with this in mind.\n\n`
      : '';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const stream = streamGroqChat([
      {role: 'system', content: groqTutorPrompt},
      ...normalizeHistory(conversationHistory),
      {
        role: 'user',
        content: `${context}Subject: ${subjectName || 'General Studies'}\n\n${query || 'Please analyze the attached context.'}`,
      },
    ]);

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
