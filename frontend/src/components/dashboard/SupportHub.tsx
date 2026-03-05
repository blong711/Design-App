"use client";

import { useState } from "react";
import { HelpCircle, MessageSquare, Book, ChevronDown, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const FAQS = [
    {
        q: "How do I request a design revision?",
        a: "Every design includes unlimited revisions. Simply click on a design from your 'My Designs' dashboard, scroll down to the comments section, and describe what changes you'd like to see. Your designer will be notified immediately."
    },
    {
        q: "What is the typical turnaround time?",
        a: "Most design requests are completed within 2-4 business days, depending on the complexity of the project and your selected package. You will receive an email notification once your design is ready for review."
    },
    {
        q: "What file formats will I receive?",
        a: "By default, designers provide original source files (AI, PSD, or Figma), along with high-quality exports in PNG, JPG, and PDF formats. You can request specific formats in your design brief."
    },
    {
        q: "How can I top up my balance?",
        a: "Go to your 'Transactions' page and click on 'Add Funds'. You can choose your preferred payment method to add credit to your account, which can then be used to pay for new design requests."
    }
];

export default function SupportHub() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) return;

        setSending(true);
        setStatus(null);
        try {
            // Reusing notifications endpoint for support messages for now, 
            // but realistically this could go to a separate 'support_tickets' table
            await api.post("/notifications", {
                message: `[SUPPORT REQUEST] ${subject}: ${message}`,
                type: 'info',
                is_active: false // Admins see this as an archival request
            });
            setStatus({ text: "Support request sent successfully! We will get back to you soon.", type: 'success' });
            setSubject("");
            setMessage("");
        } catch (err) {
            setStatus({ text: "Failed to send support request. Please try again.", type: 'error' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 overflow-hidden">
            {/* Hero Section */}
            <div className="relative rounded-[3rem] bg-foreground/5 border border-border p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

                <div className="max-w-xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Help & Support
                    </div>
                    <h1 className="text-5xl font-black text-foreground tracking-tight leading-none">How can we help?</h1>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                        Find answers in our library or reach out to our team of experts directly for personalized assistance.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
                        <HelpCircle className="w-12 h-12" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* FAQ Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                            <Book className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${expandedFaq === idx ? 'bg-foreground/5 border-primary/30 shadow-2xl shadow-black/5' : 'bg-transparent border-border hover:border-foreground/20'}`}
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                    className="w-full p-6 flex items-center justify-between text-left group"
                                >
                                    <span className={`text-base font-bold transition-colors ${expandedFaq === idx ? 'text-primary' : 'text-foreground'}`}>
                                        {faq.q}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expandedFaq === idx ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                                </button>

                                <AnimatePresence>
                                    {expandedFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-6 pb-6 text-sm font-medium text-muted-foreground leading-relaxed italic"
                                        >
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-lg shadow-pink-500/10">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black">Contact Support</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[3rem] space-y-6 shadow-2xl shadow-black/5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-2xl bg-foreground/5 border border-border focus:border-primary transition-all outline-none font-bold"
                                placeholder="What's this request about?"
                                disabled={sending}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-border focus:border-primary transition-all outline-none font-medium min-h-[150px] leading-relaxed"
                                placeholder="Describe your issue or question in detail..."
                                disabled={sending}
                            />
                        </div>

                        <AnimatePresence>
                            {status && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                                >
                                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    {status.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={sending || !subject || !message}
                            className="w-full py-4 bg-foreground text-background font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-xl disabled:opacity-50 active:scale-95 group/btn"
                        >
                            {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                            Send Message
                        </button>
                    </form>
                </div>
            </div>

            {/* Live Chat Teaser */}
            <div className="rounded-[2.5rem] bg-primary/10 border border-primary/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="font-black text-xl text-foreground">Need immediate help?</h4>
                        <p className="text-sm font-medium text-muted-foreground">Our live agents are available Mon-Fri, 9am - 6pm (EST) for priority project assistance.</p>
                    </div>
                </div>
                <button className="px-8 py-3.5 rounded-2xl bg-primary text-white font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                    Start Live Chat
                </button>
            </div>
        </div>
    );
}
