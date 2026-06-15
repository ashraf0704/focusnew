import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {AlertCircle, Brain, BookOpen, Camera, FileImage, FileText, Mic, MicOff, Paperclip, Send, Sparkles, X} from 'lucide-react';
import {streamAIChat} from '../api';
import {Subject} from '../types';

interface AIDoubtSolverProps {
  subjects: Subject[];
  activeSubjectId?: string;
  presetContext?: {content: string; name: string} | null;
  onClearPresetContext?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachmentName?: string;
  attachmentType?: string;
}

type AIModel = 'groq-llama' | 'gemini' | 'claude' | 'gemini-flash' | 'deepseek-coder' | 'qwen-coder' | 'gemini-coder' | 'frontend-expert' | 'database-guru' | 'funny-buddy';

const VERIFIED_YOUTUBE_IDS = new Set([
  'WUvTyaaNkzM', // Calculus
  'LwCRRUa8yTU', // Algebra
  'xxpc-HPKN28', // Statistics
  '8mAITcNt710', // CS50
  'ix9cRaBkVe0', // Python
  '7_LPdttKXPc', // Internet Works
  'ZihywtixUYo', // Physics Map
  'b1t41Q3xRM8', // Physics Course
  'p7bzE1E5PMY', // Quantum Mechanics
  'FSyAehMdpyI', // Chemistry
  'bSMx0NS0XfY', // Organic Chemistry
  'uVFCOfSuPTo', // Crash Course Chemistry
  'ea3BsRSCKV8', // Biology
  'zwibgNGe4aY', // DNA/Genetics
  'Ae4MadKPJhg', // Anatomy
  'Yocja_N5s1I', // World History
  '7VT3ySE6-aI', // Modern History of India
  'xuCn8ux2gbs', // Empires
  'EMEqpuJNhME', // Economics
  'aO9-8zjQ7Rk', // Microeconomics
  'p7HKvqRI_Bo', // Stock Markets
  '6vcIPMbKHVo', // English Grammar
  'qmSCH4gPfdE', // Essay Writing
  '9hHMiR7ZUoY', // IELTS
  'YiLUYf4HDh4', // UI/UX Design
  'FTFaQWZBqQ8', // Figma Tutorial
  '_Hp_dI0__qE', // Design Fundamentals
  '_f-qkGJBPts', // Feynman
  'Z-zNHHpXoMM', // Spaced Repetition
  'Hu4Yvq-g7_Y', // Deep Work Focus
]);

function extractYouTubeVideoIds(text: string): Array<{ id: string; url: string }> {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
  const matches: Array<{ id: string; url: string }> = [];
  const foundIds = new Set<string>();
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const videoId = match[1];
    const rawUrl = match[0];
    if (videoId && !foundIds.has(videoId)) {
      foundIds.add(videoId);
      // ONLY allow verified working videos in the embedded iframe list
      if (VERIFIED_YOUTUBE_IDS.has(videoId)) {
        const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        matches.push({ id: videoId, url: fullUrl });
      }
    }
  }
  return matches;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <div key={`code-${i}`} className="my-2 rounded-lg overflow-hidden border border-slate-200 bg-[#1e1e2e] text-xs">
          {lang && <div className="px-3 py-1 text-[9px] text-slate-400 bg-[#2a2a3a] uppercase tracking-widest font-mono">{lang}</div>}
          <pre className="p-3 overflow-x-auto font-mono text-[11px] text-green-300 leading-relaxed">{codeLines.join('\n')}</pre>
        </div>
      );
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h3) {
      result.push(<p key={`h3-${i}`} className="font-black text-[11px] text-brand-dark mt-3 mb-1">{inlineMarkdown(h3[1])}</p>);
      i++; continue;
    }
    if (h2) {
      result.push(<p key={`h2-${i}`} className="font-black text-xs text-brand-dark mt-3 mb-1 border-b border-brand-outline/50 pb-0.5">{inlineMarkdown(h2[1])}</p>);
      i++; continue;
    }
    if (h1) {
      result.push(<p key={`h1-${i}`} className="font-black text-sm text-brand-dark mt-3 mb-1">{inlineMarkdown(h1[1])}</p>);
      i++; continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      result.push(
        <ul key={`ul-${i}`} className="my-1.5 space-y-0.5 pl-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-1.5 items-start text-[11px]">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      result.push(
        <ol key={`ol-${i}`} className="my-1.5 space-y-0.5 pl-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-1.5 items-start text-[11px]">
              <span className="text-brand-primary font-bold shrink-0 min-w-[14px]">{num + idx}.</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      result.push(<hr key={`hr-${i}`} className="my-2 border-brand-outline/50" />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push(<br key={`br-${i}`} />);
      i++; continue;
    }

    // Normal paragraph
    result.push(
      <p key={`p-${i}`} className="text-[11px] leading-relaxed">{inlineMarkdown(line)}</p>
    );
    i++;
  }

  return result;
}

function inlineMarkdown(text: string): React.ReactNode[] {
  // Split by inline code, bold, italic, links, bare URLs in order
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx} className="bg-slate-100 border border-slate-200 text-[10px] px-1 py-0.5 rounded font-mono text-brand-dark">{part.slice(1, -1)}</code>;
    }
    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx} className="font-black text-brand-dark">{part.slice(2, -2)}</strong>;
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx} className="italic text-brand-muted">{part.slice(1, -1)}</em>;
    }
    // Markdown link [label](url)
    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (mdLink) {
      return (
        <a key={idx} href={mdLink[2]} target="_blank" rel="noopener noreferrer"
          className="text-[#3a5a40] hover:text-[#588157] font-bold underline cursor-pointer break-all"
        >{mdLink[1]}</a>
      );
    }
    // Bare URL
    if (part.match(/^https?:\/\/[^\s]+$/)) {
      return (
        <a key={idx} href={part} target="_blank" rel="noopener noreferrer"
          className="text-[#3a5a40] hover:text-[#588157] font-bold underline cursor-pointer break-all"
        >{part}</a>
      );
    }
    return part;
  });
}


function YoutubeEmbed({ videoId, watchUrl }: { videoId: string; watchUrl: string }) {
  const [errored, setErrored] = React.useState(false);
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <span className="text-2xl">🎬</span>
        <p className="text-[11px] text-brand-muted font-medium">Embedded preview unavailable.</p>
        <a
          href={youtubeWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#3a5a40] hover:text-[#588157] font-black underline"
        >
          ▶ Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-md border border-slate-200/80 bg-black w-full max-w-[400px]" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={embedSrc}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        onError={() => setErrored(true)}
      />
    </div>
  );
}

export default function AIDoubtSolver({subjects, activeSubjectId, presetContext, onClearPresetContext}: AIDoubtSolverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('groq-llama');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [attachedAttachment, setAttachedAttachment] = useState<{
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'code' | 'zip';
    content: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Hi, I am your general Llama ChatGPT study assistant. Ask a doubt, attach study notes, or snap a question to get started.",
      timestamp: new Date(),
    },
  ]);

  const activeSubject = subjects.find(subject => subject.id === activeSubjectId) || subjects[0] || {name: 'General Studies'};
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print system switch notice on model change
  useEffect(() => {
    let welcomeText = '';
    if (selectedModel === 'deepseek-coder') {
      welcomeText = "Hello! I am your Coding & Computer Science mentor. Send me programming questions, code files, or algorithm doubts and I'll write clean, efficient, and well-documented solutions.";
    } else if (selectedModel === 'qwen-coder') {
      welcomeText = "Greetings! I am Qwen3 Coder, a specialized multi-lingual syntax and code efficiency expert. Ask me to translate code, explain syntax, or optimize performance!";
    } else if (selectedModel === 'gemini-coder') {
      welcomeText = "Welcome! I am your Gemini Code Architect. I specialize in system design, software architecture patterns, refactoring, and code review. Let's design something robust.";
    } else if (selectedModel === 'frontend-expert') {
      welcomeText = "Hey there! I am your Frontend & UI Specialist. Ask me anything about React 19, TypeScript, CSS layout, Vite configurations, or performance tuning!";
    } else if (selectedModel === 'database-guru') {
      welcomeText = "Hello! I am your Database & SQL Guru. I can help you design database schemas, write optimized SQL queries, handle database normalizations, or advise on storage strategies.";
    } else if (selectedModel === 'funny-buddy') {
      welcomeText = "Yo! 🤡 I am your Sarcastic Meme-Lord Study Buddy. Ask me anything, but expect a light roasting, bad memes, and absolute exhaustion. Let's fail together! 🚀";
    } else if (selectedModel === 'gemini') {
      welcomeText = "Hi, I am Gemini 2.0. I can help with multimodal reasoning, detailed structural breakdowns, and explain complex academic topics in a clear, organized format.";
    } else if (selectedModel === 'claude') {
      welcomeText = "Hello! I am Claude, your analytical reasoning and deep tutoring assistant. Ask me to break down complex literature, write detailed code, or analyze difficult academic problems step-by-step.";
    } else if (selectedModel === 'gemini-flash') {
      welcomeText = "Hi, I am Gemini Flash. I am built for speed, concise study reviews, quick question guidance, and active recall practice. How can I help you study efficiently today?";
    } else {
      welcomeText = "Hi, I am your general Llama ChatGPT study assistant. Ask a doubt, attach study notes, or snap a question to get started.";
    }
    // Prevent adding duplicate welcome message during initialization
    if (messages.length > 1 || messages[0]?.text !== welcomeText) {
      setMessages(prev => [
        ...prev,
        {
          id: `sys-switch-${Date.now()}`,
          sender: 'ai',
          text: welcomeText,
          timestamp: new Date(),
        }
      ]);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (!presetContext) return;
    setIsOpen(true);
    const ext = presetContext.name.split('.').pop()?.toLowerCase() || 'pdf';
    const type = ['png', 'jpg', 'jpeg', 'svg'].includes(ext)
      ? 'image'
      : ['cpp', 'py', 'java', 'js', 'html', 'css', 'ts'].includes(ext)
        ? 'code'
        : ['zip', 'rar'].includes(ext)
          ? 'zip'
          : ['doc', 'docx', 'txt'].includes(ext)
            ? 'doc'
            : 'pdf';

    setAttachedAttachment({name: presetContext.name, type, content: presetContext.content});
    setInputMessage(`Explain the key concepts inside ${presetContext.name}.`);
    onClearPresetContext?.();
  }, [presetContext, onClearPresetContext]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;       // keep listening until manually stopped
    rec.interimResults = true;   // emit results while still speaking
    rec.lang = 'en-US';

    // Track the "committed" final text separately from live interim text
    let finalTranscript = '';

    rec.onstart = () => {
      finalTranscript = '';      // reset on each new session
      setIsRecording(true);
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);

    rec.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show committed text + live interim preview together
      setInputMessage(finalTranscript + interimTranscript);
    };

    setRecognition(rec);
  }, []);

  const getSuggestions = () => {
    if (selectedModel === 'deepseek-coder') {
      return [
        'Write a quicksort code snippet',
        'Explain Big-O time/space complexity',
        'Help me debug a syntax/runtime error',
        'Optimize this algorithm for memory usage',
      ];
    }
    if (selectedModel === 'qwen-coder') {
      return [
        'Translate code from Python to TypeScript',
        'Explain the dynamic imports feature in ES15',
        'Write a thread-safe singleton in Java',
        'Review this code for runtime syntax bugs',
      ];
    }
    if (selectedModel === 'gemini-coder') {
      return [
        'What is MVC vs Clean Architecture?',
        'How to apply SOLID principles to a project',
        'Draw a system design for a chat application',
        'Design a robust error handling middleware',
      ];
    }
    if (selectedModel === 'frontend-expert') {
      return [
        'Build a responsive glassmorphism navbar in CSS',
        'Explain React 19 useActionState hook',
        'Optimize my webpack/vite config file',
        'Create a service worker caching strategy',
      ];
    }
    if (selectedModel === 'database-guru') {
      return [
        'Design a schema for a student enrollment DB',
        'Write a SQL query with window functions',
        'How does indexing work in PostgreSQL?',
        'When to use MongoDB vs PostgreSQL',
      ];
    }
    if (selectedModel === 'funny-buddy') {
      return [
        'Give me a terrible programming joke',
        'Roast my study schedule',
        'Help me study while procrastinating',
        'Explain recursion using memes',
      ];
    }
    if (selectedModel === 'gemini') {
      return [
        `Structural breakdown of ${activeSubject.name}`,
        'Solve a mock practice question step-by-step',
        'Summarize this subject into core bullet points',
      ];
    }
    if (selectedModel === 'claude') {
      return [
        'Analyze this logical reasoning question',
        'Help me structure this essay outline',
        'Explain this mathematical concept step-by-step',
      ];
    }
    if (selectedModel === 'gemini-flash') {
      return [
        `Quick summary of ${activeSubject.name}`,
        'Create a quick 3-question quiz for me',
        'Clarify this concept in two sentences',
      ];
    }
    return [
      `Summarize the key facts about ${activeSubject.name}`,
      `Explain ${activeSubject.name} like I am new to it`,
      'Create 3 flashcard questions from this topic',
    ];
  };

  const handleToggleVoice = () => {
    if (!recognition) return;
    if (isRecording) recognition.stop();
    else recognition.start();
  };

  const handleLocalFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const type = ['jpg', 'jpeg', 'png', 'svg'].includes(extension)
      ? 'image'
      : ['cpp', 'py', 'java', 'js', 'ts'].includes(extension)
        ? 'code'
        : ['zip', 'rar'].includes(extension)
          ? 'zip'
          : ['doc', 'docx', 'txt'].includes(extension)
            ? 'doc'
            : 'pdf';

    setAttachedAttachment({
      name: file.name,
      type,
      content: `[Uploaded study file: ${file.name}]. The student wants help understanding or solving doubts from this material.`,
    });
    setInputMessage(`Explain the essential points in "${file.name}".`);
  };

  const handleCameraSnapshot = () => {
    const snapshot = {
      name: 'Snapshot_Homework_Question.jpg',
      type: 'image' as const,
      content: 'OCR snapshot placeholder from a homework/photo question. Ask the student for missing details if the image content is unclear.',
    };
    setAttachedAttachment(snapshot);
    setInputMessage('Please solve or explain this snapped homework question.');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !attachedAttachment) return;

    const userText = inputMessage.trim() || `Please analyze ${attachedAttachment?.name || 'this attachment'}.`;
    const attachment = attachedAttachment;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: attachment ? `${userText}\n\nAttached: ${attachment.name}` : userText,
      timestamp: new Date(),
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };
    const historyBeforeSend = messages;
    const aiMessageId = `ai-${Date.now()}`;

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setAttachedAttachment(null);
    setIsTyping(true);

    let receivedToken = false;
    try {
      await streamAIChat(
        {
          query: userText,
          subjectName: activeSubject.name,
          attachmentContent: attachment?.content || null,
          vaultContext: null,
          model: selectedModel,
          conversationHistory: historyBeforeSend.slice(-10).map(message => ({
            role: message.sender === 'user' ? 'user' : 'assistant',
            content: message.text,
          })),
        },
        token => {
          receivedToken = true;
          setIsTyping(false);
          setMessages(prev => {
            const exists = prev.some(message => message.id === aiMessageId);
            return exists
              ? prev.map(message => message.id === aiMessageId ? {...message, text: message.text + token} : message)
              : [...prev, {id: aiMessageId, sender: 'ai', text: token, timestamp: new Date()}];
          });
        },
      );

      if (!receivedToken) {
        setMessages(prev => [...prev, {
          id: aiMessageId,
          sender: 'ai',
          text: 'The AI stream completed without text. Try again with a little more context.',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: error instanceof Error ? error.message : 'AI request failed. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2.5 ${isOpen ? 'z-[60]' : 'z-40'}`}>
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{opacity: 0, scale: 0.8, y: 10}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.8, y: 10}}
              className="bg-brand-primary p-3 rounded-2xl shadow-xl border border-white/10 text-white flex items-center gap-3 select-none text-xs max-w-[280px]"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="font-semibold leading-snug">Ask <strong className="text-brand-vibrant">Focus Buddy AI</strong> here.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="w-14 h-14 rounded-full bg-brand-primary text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-300 relative pointer-events-auto cursor-pointer"
          id="ai-floating-assistant-hub-trigger"
          title="Clarify doubts with multi-agent AI"
        >
          {isOpen ? <X size={24} /> : (
            <div className="relative">
              <Brain size={26} className="animate-pulse" />
              <span className="absolute -top-2.5 -right-2.5 text-[10px] bg-rose-500 font-extrabold text-white px-1.5 py-0.5 rounded-full ring-2 ring-white">AI</span>
            </div>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer">
            <motion.div
              onClick={event => event.stopPropagation()}
              initial={{opacity: 0, scale: 0.95, y: 15}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 15}}
              transition={{duration: 0.25}}
              className="bg-white w-full max-w-2xl h-[580px] sm:h-[650px] rounded-3xl border border-brand-outline shadow-2xl overflow-hidden flex flex-col cursor-default"
              id="ai-doubt-solver-pop-up"
            >
              <div className="p-4 bg-brand-primary text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-lg"><Sparkles size={16} className="text-brand-vibrant" /></div>
                  <div>
                    <h4 className="font-sans font-black text-sm uppercase tracking-wide">
                      {selectedModel === 'deepseek-coder' 
                        ? 'DeepSeek Coder (CS/Algorithms)' 
                        : selectedModel === 'qwen-coder'
                          ? 'Qwen3 Coder (Languages)'
                          : selectedModel === 'gemini-coder'
                            ? 'Gemini Code Architect'
                            : selectedModel === 'frontend-expert'
                              ? 'Frontend Specialist'
                              : selectedModel === 'database-guru'
                                ? 'Database & SQL Guru'
                                : selectedModel === 'funny-buddy'
                                  ? 'Sarcastic Meme-Lord'
                                  : selectedModel === 'gemini' 
                                    ? 'Gemini 2.0 AI' 
                                    : selectedModel === 'claude'
                                      ? 'Claude AI Assistant'
                                      : selectedModel === 'gemini-flash'
                                        ? 'Gemini Flash AI'
                                        : 'Llama 3.3 ChatGPT Assistant'}
                    </h4>
                    <p className="text-[10px] text-brand-bg/75">
                      {selectedModel === 'deepseek-coder' 
                        ? 'Specialized software engineering & algorithm mentor' 
                        : selectedModel === 'qwen-coder'
                          ? 'Boilerplate-free syntax and multi-lingual expert'
                          : selectedModel === 'gemini-coder'
                            ? 'System design patterns and clean architecture architect'
                            : selectedModel === 'frontend-expert'
                              ? 'React 19, TypeScript, CSS, and performance specialist'
                              : selectedModel === 'database-guru'
                                ? 'Relational design, indexing, and SQL optimization guru'
                                : selectedModel === 'funny-buddy'
                                  ? 'Study companion that roasts you and tells jokes'
                                  : selectedModel === 'gemini' 
                                    ? 'Google intelligent reasoning and multimodal chatbot' 
                                    : selectedModel === 'claude'
                                      ? 'Anthropic high-reasoning and creative assistant'
                                      : selectedModel === 'gemini-flash'
                                        ? 'Google high-speed study & reasoning tutor'
                                        : 'High-speed general purpose conversational assistant'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-brand-bg/90 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              <div className="px-4 py-2 bg-brand-bg border-b border-brand-outline flex items-center justify-between text-[11px] text-brand-muted shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <strong className="text-brand-dark">Active AI:</strong>
                  <select 
                    value={selectedModel} 
                    onChange={e => setSelectedModel(e.target.value as AIModel)}
                    className="bg-white border border-brand-outline rounded-lg px-2 py-1 text-brand-dark font-semibold outline-none focus:ring-1 focus:ring-brand-primary text-[10px] cursor-pointer max-w-[220px]"
                  >
                    <option value="groq-llama">💬 ChatGPT Mode (Llama 3.3)</option>
                    <option value="gemini">✨ Gemini AI Mode (Gemini 2.0)</option>
                    <option value="claude">🧡 Claude AI Mode</option>
                    <option value="gemini-flash">⚡ Gemini Flash AI</option>
                    <option value="deepseek-coder">💻 DeepSeek CS/Algorithms</option>
                    <option value="qwen-coder">🚀 Qwen3 Syntax Coder</option>
                    <option value="gemini-coder">📐 Gemini Code Architect</option>
                    <option value="frontend-expert">🎨 Frontend & UI Specialist</option>
                    <option value="database-guru">🗄️ Database & SQL Guru</option>
                    <option value="funny-buddy">🤡 Sarcastic Meme-Lord</option>
                  </select>
                </div>
                <span className="flex items-center gap-1 text-brand-primary bg-[#E9EDC9]/30 px-2 py-0.5 rounded-full font-bold truncate">
                  <BookOpen size={10} />
                  {activeSubject.name}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#E9EDC9]/10">
                {messages.map(message => {
                  const isUser = message.sender === 'user';
                  return (
                    <div key={message.id} className={`flex gap-2.5 items-start max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border shadow-xs select-none ${isUser ? 'bg-slate-100 border-slate-300' : 'border-brand-primary bg-[#E9EDC9]/60'}`}>
                        {isUser ? '👤' : '🧠'}
                      </div>
                      <div className={`rounded-2xl p-3.5 text-xs shadow-xxs ${isUser ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white border border-brand-outline text-brand-dark rounded-tl-none leading-relaxed'}`}>
                        {isUser 
                          ? <p className="whitespace-pre-wrap text-[11px]">{message.text}</p>
                          : <div className="space-y-0.5">{renderMarkdown(message.text)}</div>
                        }
                        {!isUser && (() => {
                          const ytVideos = extractYouTubeVideoIds(message.text);
                          if (ytVideos.length === 0) return null;
                          return (
                            <div className="mt-3.5 space-y-3.5">
                              {ytVideos.map(video => (
                                <div key={video.id}>
                                  <YoutubeEmbed videoId={video.id} watchUrl={video.url} />
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {message.attachmentName && (
                          <div className={`mt-2.5 p-2 rounded-xl border flex items-center gap-2 select-none ${isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-brand-outline text-brand-dark'}`}>
                            {message.attachmentType === 'image' ? <FileImage size={15} /> : <FileText size={15} />}
                            <span className="text-[10px] font-mono font-black truncate max-w-[180px]">{message.attachmentName}</span>
                          </div>
                        )}
                        <div className={`text-[8px] mt-1.5 text-right block font-mono ${isUser ? 'text-white/60' : 'text-brand-muted/75'}`}>
                          {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-2.5 items-start max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border shadow-xs border-brand-primary bg-[#E9EDC9]/60">🧠</div>
                    <div className="bg-white border border-brand-outline text-brand-dark rounded-2xl rounded-tl-none p-3.5 text-xs shadow-xxs">
                      <span className="text-[10px] text-brand-muted italic">
                        {selectedModel === 'deepseek-coder' 
                          ? 'Coding AI is writing code...' 
                          : selectedModel === 'qwen-coder'
                            ? 'Qwen3 Coder is typing syntax...'
                            : selectedModel === 'gemini-coder'
                              ? 'Gemini Architect is refactoring...'
                              : selectedModel === 'frontend-expert'
                                ? 'Frontend Specialist is designing UI...'
                                : selectedModel === 'database-guru'
                                  ? 'Database Guru is querying schemas...'
                                  : selectedModel === 'funny-buddy'
                                    ? 'Sarcastic Buddy is crying in emojis...'
                                    : selectedModel === 'gemini' 
                                      ? 'Gemini AI is analyzing...' 
                                      : selectedModel === 'claude'
                                        ? 'Claude AI is reasoning...'
                                        : selectedModel === 'gemini-flash'
                                          ? 'Gemini Flash is summarizing...'
                                          : 'Llama ChatGPT is responding...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {attachedAttachment && (
                <div className="px-4 py-2 border-t border-brand-outline/80 bg-[#E9EDC9]/20 flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {attachedAttachment.type === 'image' ? <FileImage size={15} className="text-emerald-600" /> : <FileText size={15} className="text-indigo-600" />}
                    <span className="text-[10px] text-brand-dark font-black truncate">Attached: {attachedAttachment.name}</span>
                  </div>
                  <button onClick={() => setAttachedAttachment(null)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Remove attachment">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="px-4 py-2 border-t border-brand-outline/85 bg-brand-bg/50 shrink-0 select-none">
                <div className="flex flex-wrap gap-1.5">
                  {getSuggestions().map(suggestion => (
                    <button key={suggestion} onClick={() => setInputMessage(suggestion)} type="button" className="text-[10px] bg-white border border-brand-outline rounded-xl px-2.5 py-1 text-brand-dark hover:border-brand-primary hover:bg-brand-primary/5 transition font-medium cursor-pointer">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white border-t border-brand-outline shrink-0">
                <form onSubmit={event => { event.preventDefault(); handleSendMessage(); }} className="flex gap-2 items-center">
                  <input type="file" ref={fileInputRef} onChange={handleLocalFileSelection} className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,.cpp,.js,.ts" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl border border-brand-outline hover:bg-slate-50 transition text-brand-muted hover:text-brand-dark" title="Upload notes">
                    <Paperclip size={14} />
                  </button>
                  <button type="button" onClick={handleCameraSnapshot} className="p-2.5 rounded-xl border border-brand-outline hover:bg-slate-50 transition text-brand-muted hover:text-brand-dark" title="Snap homework prompt">
                    <Camera size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`p-2.5 rounded-xl border transition relative ${isRecording ? 'bg-rose-100 border-rose-300 text-rose-600' : 'border-brand-outline hover:bg-slate-50 text-brand-muted hover:text-brand-dark'}`}
                    title={isRecording ? 'Stop recording' : 'Speak to type'}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 rounded-xl animate-ping bg-rose-300 opacity-30" />
                    )}
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <input 
                    value={inputMessage} 
                    onChange={event => setInputMessage(event.target.value)} 
                    placeholder={
                      isRecording 
                        ? '🎙 Listening… speak now' 
                        : selectedModel === 'deepseek-coder' 
                          ? 'Ask DeepSeek Coding AI...' 
                          : selectedModel === 'qwen-coder'
                            ? 'Ask Qwen3 Coder AI...'
                            : selectedModel === 'gemini-coder'
                              ? 'Ask Gemini Code Architect...'
                              : selectedModel === 'frontend-expert'
                                ? 'Ask Frontend Specialist...'
                                : selectedModel === 'database-guru'
                                  ? 'Ask Database Guru...'
                                  : selectedModel === 'funny-buddy'
                                    ? 'Distract the Meme-Lord AI...'
                                    : selectedModel === 'gemini' 
                                      ? 'Ask Gemini AI...' 
                                      : selectedModel === 'claude'
                                        ? 'Ask Claude AI...'
                                        : selectedModel === 'gemini-flash'
                                          ? 'Ask Gemini Flash AI...'
                                          : 'Ask Llama ChatGPT...'
                    } 
                    className={`flex-1 border text-xs px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-1 placeholder:text-brand-muted/75 bg-slate-50/50 transition-colors ${
                      isRecording 
                        ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30 text-rose-700 placeholder:text-rose-400' 
                        : 'border-brand-outline focus:ring-brand-primary'
                    }`} 
                  />
                  <button type="submit" disabled={(!inputMessage.trim() && !attachedAttachment) || isTyping} className={`p-2.5 rounded-2xl transition duration-150 flex items-center justify-center ${(inputMessage.trim() || attachedAttachment) && !isTyping ? 'bg-brand-primary hover:bg-[#4A4A3A] text-white' : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'}`}>
                    <Send size={15} />
                  </button>
                </form>
              </div>

              <div className="px-4 py-1.5 bg-slate-50 border-t border-brand-soft-border text-[9px] text-brand-muted text-center select-none flex items-center justify-center gap-1.5">
                <AlertCircle size={10} className="text-amber-500 font-bold" />
                <span>AI can make mistakes. Verify complex equations and high-stakes answers.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
