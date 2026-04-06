"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import toast from "react-hot-toast";

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const siteName = settings?.site_name || "BlissFruitz";
  const address = settings?.address || "123 New Street, Fruit City, India";
  const phone = settings?.contact_phone || "+91 98765 43210";
  const email = settings?.contact_email || "support@blissfruitz.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data?.data?.message || data.message || "Message sent successfully!");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(data.message || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 transition-all">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-8">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
      
      <div className="grid md:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-6">
          {[
            { icon: MapPin, label: "Address", value: address },
            { icon: Phone, label: "Phone", value: phone },
            { icon: Mail, label: "Email", value: email },
            { icon: Clock, label: "Working Hours", value: "Mon–Sat: 8am – 8pm" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-gray-800 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Name</label>
              <input 
                type="text" 
                placeholder="Your name" 
                required
                value={form.name}
                onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                required
                value={form.email}
                onChange={(e) => setForm(f => ({...f, email: e.target.value}))}
                className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all shadow-inner" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Subject</label>
            <input 
              type="text" 
              placeholder="How can we help?" 
              value={form.subject}
              onChange={(e) => setForm(f => ({...f, subject: e.target.value}))}
              className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all shadow-inner" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Message</label>
            <textarea 
              rows={5} 
              placeholder="Write your message here…" 
              required
              value={form.message}
              onChange={(e) => setForm(f => ({...f, message: e.target.value}))}
              className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all shadow-inner resize-none" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-600/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Message</>}
          </button>
        </form>
      </div>
    </div>
  );
}
