"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Minimize2, Maximize2, Sparkles, Wand2, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatBotProps {
  apiEndpoint: string;
  title: string;
  placeholder?: string;
  initialMessage?: string;
  theme?: "admin" | "customer";
}

export function ChatBot({ 
  apiEndpoint, 
  title, 
  placeholder = "How can I help you today?", 
  initialMessage,
  theme = "customer"
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    // @ts-ignore - 'api' still works at runtime in this version but is missing from types
    api: apiEndpoint,
    initialMessages: initialMessage ? [{ id: "init", role: "assistant", parts: [{ type: "text", text: initialMessage }] }] : []
  } as any);

  const isLoading = status === "streaming" || status === "submitted";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const currentInput = input;
    setInput("");
    try {
      await sendMessage({ text: currentInput });
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(currentInput);
    }
  };

  const handleQuickQuery = async (query: string) => {
    if (isLoading) return;
    try {
      await sendMessage({ text: query });
    } catch (e) {
      console.error("AI Action failed:", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const primaryColor = theme === "admin" ? "bg-indigo-600" : "bg-green-600";
  const lightColor = theme === "admin" ? "bg-indigo-50" : "bg-green-50";
  const iconColor = theme === "admin" ? "text-indigo-600" : "text-green-600";
  const badgeIcon = theme === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased text-gray-900">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 20, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center gap-3 text-white transition-all hover:scale-105 active:scale-95 group overflow-hidden relative border-2 border-white/20 backdrop-blur-md",
              primaryColor
            )}
          >
            {/* Animated Glow */}
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rotate-[45deg]" />
            
            {theme === "admin" ? (
              <ShieldCheck className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            ) : (
              <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            )}
            <div className="text-left hidden sm:block pr-2">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Bliss-Core</p>
              <p className="font-bold text-sm">Ask AI Guide</p>
            </div>
            
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            layout
            className={cn(
              "bg-white border-2 border-white/20 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-2xl ring-1 ring-black/5",
              isExpanded ? "w-[650px] h-[750px]" : "w-[400px] h-[600px]"
            )}
          >
            {/* Elegant Premium Header */}
            <div className={cn("px-6 py-6 flex items-center justify-between text-white shrink-0 relative", primaryColor)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10 ring-1 ring-white/20">
                  {theme === "admin" ? <ShieldCheck className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base leading-tight tracking-tight">{title}</h3>
                    <div className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10 flex items-center gap-1 shadow-sm font-sans">
                      {badgeIcon} Core V2
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 opacity-90">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase opacity-80">Sync Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2.5 hover:bg-white/15 rounded-2xl transition-all hover:scale-110 active:scale-90"
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 hover:bg-white/15 rounded-2xl transition-all hover:scale-110 active:scale-90"
                  title="Close support"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white scrollbar-thin scrollbar-thumb-gray-200"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className={cn("w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-2 shadow-xl ring-1 ring-black/5 animate-shimmer", lightColor)}>
                    <Bot className={cn("w-10 h-10 animate-float", iconColor)} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-black text-lg tracking-tight">Bliss-Core Guidance Hub</p>
                    <p className="text-gray-500 text-xs leading-relaxed max-w-[240px] font-medium mx-auto">
                      Ask about {theme === "admin" ? "store automation, inventory, or platform intelligence" : "seasonal catalogs, shipping, or quality assurance"}.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full pt-4">
                    {theme === "admin" ? (
                      ["Setup Email", "Change Theme", "Update Stock"].map(q => (
                        <button key={q} onClick={() => handleQuickQuery(q)} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all text-left flex items-center justify-between group shadow-sm">
                          {q} <Wand2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    ) : (
                      ["Track my order", "Freshness Policy", "Shipping Fees"].map(q => (
                        <button key={q} onClick={() => handleQuickQuery(q)} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-green-200 hover:text-green-600 transition-all text-left flex items-center justify-between group shadow-sm">
                          {q} <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {messages.map((m: any) => (
                <div 
                  key={m.id} 
                  className={cn(
                    "flex flex-col max-w-[88%] transition-all",
                    m.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-5 py-3.5 rounded-[1.75rem] text-sm leading-relaxed shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-black/5 font-medium whitespace-pre-wrap",
                    m.role === "user" 
                      ? cn("text-white rounded-tr-none shadow-indigo-100", primaryColor) 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100/50"
                  )}>
                    {m.parts ? m.parts.map((part: any, i: number) => (
                      <span key={i}>
                        {part.type === "text" && part.text}
                      </span>
                    )) : m.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 px-2">
                    {m.role !== "user" && <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", primaryColor)} />}
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic opacity-60">
                      {m.role === "user" ? "Client Hub" : "AI Agent v2"}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-[1.75rem] rounded-tl-none flex items-center gap-3 shadow-md ring-1 ring-black/5">
                    <div className="flex space-x-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]", primaryColor)} />
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]", primaryColor)} />
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", primaryColor)} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Processing Core</span>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Input Hub */}
            <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0 z-10">
              <div className="relative flex items-end gap-3 px-4 py-2.5 bg-gray-50/80 rounded-3xl border border-gray-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-inner">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  disabled={isLoading}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  className="flex-1 max-h-32 bg-transparent border-none py-2 text-sm font-medium focus:ring-0 outline-none scrollbar-none resize-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!input?.trim() || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-20 shadow-xl active:scale-90 hover:scale-105 shrink-0 mb-1 ring-2 ring-white/50",
                    primaryColor
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-4 group cursor-default">
                 <ShieldCheck className="w-3 h-3 text-gray-300 group-hover:text-amber-500 transition-colors" />
                 <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    Secured by Bliss-Core Advanced Intelligence Hub
                 </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
