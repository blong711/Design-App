"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { X, MessageSquare, Send, Clock, User, DollarSign, ExternalLink, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
    id: string;
    user_name: string;
    user_id: string;
    content: string;
    created_at: string;
}

interface TicketDetailDrawerProps {
    ticketId: string | null;
    onClose: () => void;
    currentUser: any;
}

export default function TicketDetailDrawer({ ticketId, onClose, currentUser }: TicketDetailDrawerProps) {
    const [ticket, setTicket] = useState<any>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const toast = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ticketId) {
            fetchTicketDetails();
            fetchComments();
        }
    }, [ticketId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const fetchTicketDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tickets/${ticketId}`);
            setTicket(res.data);
        } catch (err) {
            toast("Failed to load ticket details", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await api.get(`/tickets/${ticketId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments");
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;

        try {
            setSending(true);
            const res = await api.post(`/tickets/${ticketId}/comments`, { content: newComment });
            setComments([...comments, res.data]);
            setNewComment("");
        } catch (err) {
            toast("Failed to send comment", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <AnimatePresence>
            {ticketId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 px-4"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0f0a19] border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white truncate max-w-[300px]">
                                    {loading ? "Loading..." : ticket?.title}
                                </h2>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Details</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                            {ticket && (
                                <>
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-primary mb-1">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase">Status</span>
                                            </div>
                                            <div className="capitalize font-semibold text-white">{ticket.status.replace("_", " ")}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 text-green-400 mb-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase">Price</span>
                                            </div>
                                            <div className="font-semibold text-white">${ticket.price}</div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Description</h3>
                                        <p className="text-foreground/90 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                                            {ticket.description}
                                        </p>
                                    </div>

                                    {/* Reference Image */}
                                    {ticket.image_url && (
                                        <div>
                                            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Reference Material</h3>
                                            <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                                                <img
                                                    src={ticket.image_url}
                                                    alt="Reference"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <a
                                                    href={ticket.image_url}
                                                    target="_blank"
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium"
                                                >
                                                    <ExternalLink className="w-5 h-5" /> View Original
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Result Link */}
                                    {ticket.result_link && (
                                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-primary/20">
                                                    <ImageIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Final Design Ready</div>
                                                    <div className="text-xs text-muted-foreground">Click to view or download</div>
                                                </div>
                                            </div>
                                            <a
                                                href={ticket.result_link}
                                                target="_blank"
                                                className="p-2 rounded-xl bg-primary text-white hover:bg-primary/80 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Comments Section */}
                                    <div className="pt-4">
                                        <div className="flex items-center gap-2 mb-6">
                                            <MessageSquare className="w-5 h-5 text-primary" />
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Internal Discussion</h3>
                                        </div>

                                        <div className="space-y-4 mb-4" ref={scrollRef}>
                                            {comments.length === 0 ? (
                                                <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                                                </div>
                                            ) : (
                                                comments.map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className={`flex flex-col ${comment.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1 px-2">
                                                            <span className="text-[10px] font-bold text-white/40 uppercase">{comment.user_name}</span>
                                                            <span className="text-[10px] text-white/20">
                                                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${comment.user_id === currentUser?.id
                                                                ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                                                                : 'bg-white/10 text-foreground rounded-tl-none border border-white/5'
                                                                }`}
                                                        >
                                                            {comment.content}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sticky Footer Input */}
                        <div className="p-6 border-t border-white/10 bg-[#161026] absolute bottom-0 left-0 right-0">
                            <form onSubmit={handleSendComment} className="relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-14 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || sending}
                                    className="absolute right-2 top-2 p-3 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/80 transition-colors"
                                >
                                    {sending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
