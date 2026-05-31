import {useState} from 'react';
import {streamAIChat} from '@/lib/apiClient';

export type Persona = 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  persona: Persona;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Record<Persona, ChatMessage[]>>({
    chatgpt: [],
    gemini: [],
    perplexity: [],
    claude: [],
  });
  const [isStreaming, setIsStreaming] = useState(false);

  async function send(persona: Persona, query: string, subjectName: string, context?: string | null) {
    const userMessage: ChatMessage = {id: `u-${Date.now()}`, sender: 'user', text: query, persona};
    const aiId = `ai-${Date.now()}`;
    setMessages(prev => ({...prev, [persona]: [...prev[persona], userMessage]}));
    setIsStreaming(true);
    try {
      await streamAIChat({query, persona, subjectName, attachmentContent: context || null, vaultContext: null, conversationHistory: []}, token => {
        setMessages(prev => {
          const list = prev[persona];
          const exists = list.some(item => item.id === aiId);
          return {
            ...prev,
            [persona]: exists
              ? list.map(item => (item.id === aiId ? {...item, text: item.text + token} : item))
              : [...list, {id: aiId, sender: 'ai', text: token, persona}],
          };
        });
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return {messages, send, isStreaming};
}
