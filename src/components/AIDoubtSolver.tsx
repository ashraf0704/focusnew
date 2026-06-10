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

export default function AIDoubtSolver({subjects, activeSubjectId, presetContext, onClearPresetContext}: AIDoubtSolverProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      id: 'groq-welcome',
      sender: 'ai',
      text: "Hi, I am Focus Buddy's Groq Llama 70B study mentor. Ask a doubt, attach notes, or snap a question and I will break it down clearly.",
      timestamp: new Date(),
    },
  ]);

  const activeSubject = subjects.find(subject => subject.id === activeSubjectId) || subjects[0] || {name: 'General Studies'};
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    setRecognition(rec);
  }, []);

  const suggestions = [
    `Summarize the key facts about ${activeSubject.name}`,
    `Explain ${activeSubject.name} like I am new to it`,
    'Create 3 flashcard questions from this topic',
    'Show me a step-by-step coding solution',
  ];

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
          text: 'The Groq stream completed without text. Try again with a little more context.',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: error instanceof Error ? error.message : 'Groq request failed. Please try again.',
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
              <p className="font-semibold leading-snug">Ask <strong className="text-brand-vibrant">Groq Llama 70B</strong> here.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="w-14 h-14 rounded-full bg-brand-primary text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-300 relative pointer-events-auto cursor-pointer"
          id="ai-floating-assistant-hub-trigger"
          title="Clarify doubts with Groq Llama 70B"
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
                    <h4 className="font-sans font-black text-sm uppercase tracking-wide">Groq Llama 70B Study Chatbot</h4>
                    <p className="text-[10px] text-brand-bg/75">llama-3.3-70b-versatile with files, voice, and photo prompts</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-brand-bg/90 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5">
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              <div className="px-4 py-2 bg-brand-bg border-b border-brand-outline flex items-center justify-between text-[11px] text-brand-muted shrink-0 select-none">
                <span><strong className="text-brand-dark">Current Solver:</strong> Groq Llama 70B</span>
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
                        <p className="whitespace-pre-wrap">{message.text}</p>
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
                      <span className="text-[10px] text-brand-muted italic">Groq Llama 70B is thinking...</span>
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
                  {suggestions.map(suggestion => (
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
                  <button type="button" onClick={handleToggleVoice} className={`p-2.5 rounded-xl border transition ${isRecording ? 'bg-rose-100 border-rose-300 text-rose-600' : 'border-brand-outline hover:bg-slate-50 text-brand-muted hover:text-brand-dark'}`} title="Speak to type">
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <input value={inputMessage} onChange={event => setInputMessage(event.target.value)} placeholder={isRecording ? 'Listening...' : 'Ask Groq Llama 70B...'} className="flex-1 border border-brand-outline text-xs px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-brand-muted/75 bg-slate-50/50" />
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
