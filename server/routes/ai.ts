import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {gemini} from '../services/geminiClient.js';

export const aiRouter = Router();

const prompts = {
  chatgpt: 'You are ChatGPT, an academic study assistant. Structure answers as clear numbered bullet points with code examples where relevant. Use markdown.',
  gemini: 'You are Gemini AI, a deep-reasoning academic tutor. Provide analytical breakdowns with logical steps, headers, and edge cases. Use markdown.',
  perplexity: 'You are Perplexity AI. Always cite academic sources like [Source 1: Stanford CS229]. Synthesize research into student-friendly summaries.',
  claude: 'You are Claude, an empathetic tutor. Use analogies, Socratic questioning, plain-English explanations, and a warm encouraging tone.',
};

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const {query, persona = 'chatgpt', subjectName, attachmentContent, vaultContext, conversationHistory = []} = req.body || {};
    if (!query && !attachmentContent && !vaultContext) throw new HttpError(400, 'Query is required', 'VALIDATION_ERROR');
    const personaKey = persona in prompts ? persona as keyof typeof prompts : 'chatgpt';
    const context = attachmentContent || vaultContext
      ? `The student attached this document for context:\n\n${attachmentContent || vaultContext}\n\nAnswer with this in mind.\n\n`
      : '';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const stream = await gemini.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: [
        ...conversationHistory,
        {role: 'user', parts: [{text: `${context}Subject: ${subjectName || 'General Studies'}\n\n${query || 'Please analyze the attached context.'}`}]},
      ],
      config: {systemInstruction: prompts[personaKey]},
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      if (text) res.write(`data: ${JSON.stringify({token: text})}\n\n`);
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
