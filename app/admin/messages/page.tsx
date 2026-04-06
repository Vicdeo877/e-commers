"use client";

import { useEffect, useState } from "react";
import { adminGetMessages, adminMarkMessageRead } from "@/lib/api";
import { Mail, MailOpen, Calendar, User, MessageCircle, MoreVertical, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMessages = async (p: number) => {
    try {
      setLoading(true);
      const data = await adminGetMessages(p);
      setMessages(data.messages || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      toast.error("Could not load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(page);
  }, [page]);

  const toggleRead = async (id: number) => {
    try {
      await adminMarkMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Inquiries</h1>
          <p className="text-gray-500 text-sm mt-1 italic">Messages received via the contact form.</p>
        </div>
      </div>

      {loading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span className="text-sm">Fetching messages…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`bg-card rounded-3xl border ${m.isRead ? 'border-card opacity-80' : 'border-indigo-200 border-2 dark:border-indigo-900/50'} shadow-sm p-6 hover:shadow-md transition-all`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.isRead ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600'}`}>
                      {m.isRead ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{m.subject || "No Subject"}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1 font-medium"><User className="w-3 h-3" /> {m.name}</span>
                        <span className="flex items-center gap-1 font-medium"><MessageCircle className="w-3 h-3" /> {m.email}</span>
                        <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> {new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl text-sm text-foreground whitespace-pre-wrap leading-relaxed italic border border-gray-100 dark:border-slate-700">
                    &ldquo;{m.message}&rdquo;
                  </div>
                </div>

                {!m.isRead && (
                  <button 
                    onClick={() => toggleRead(m.id)}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-4 py-2 rounded-xl transition-colors hover:bg-indigo-100"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
              <Mail className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No messages found</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${
                    page === i + 1
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-card border border-card text-gray-500 hover:border-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
