import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { Card, Button } from './UI';
import { geminiService } from '../services/gemini';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export const AIHelper = ({ profile }: { profile: UserProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.askAcademicQuestion(input, messages, profile);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden border-stone-200 shadow-xl">
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Bot className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900">Academic Buddy</h3>
            <p className="text-xs text-stone-500">Ask me anything about your studies!</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-100">
              <Bot className="w-12 h-12 text-stone-300" />
            </div>
            <div className="space-y-2">
              <p className="text-stone-800 font-medium">Hi {profile.displayName.split(' ')[0]}!</p>
              <p className="text-stone-500 text-sm max-w-[240px]">
                I'm Ace, your academic buddy. I can help with homework, explain difficult concepts, or quiz you on any subject!
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
              <button 
                onClick={() => setInput("Can you explain photosynthesis?")}
                className="text-xs p-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                "Explain photosynthesis"
              </button>
              <button 
                onClick={() => setInput("Help me with a quadratic equation")}
                className="text-xs p-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                "Help with quadratics"
              </button>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
                }`}>
                  <div className="markdown-body">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-xs text-stone-500">Ace is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-stone-100 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask an academic question..."
            className="w-full p-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-stone-400 mt-2 text-center">
          Ace is an AI academic buddy and can make mistakes. Always verify facts.
        </p>
      </form>
    </Card>
  );
};
