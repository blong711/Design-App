"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useSettings } from "@/lib/settings-context";
import { X, MessageSquare, Send, Clock, User, DollarSign, ExternalLink, Image as ImageIcon, ArrowRight, RefreshCw, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
    id: string;
    user_name: string;
    user_id: string;
    content: string;
    created_at: string;
    type: "comment";
}

interface StatusChange {
    id: string;
    design_id: string;
    old_status: string | null;
    new_status: string;
    changed_by: string;
    changed_by_name: string;
    created_at: string;
    type: "status_change";
}

type ActivityItem = Comment | StatusChange;

interface DesignDetailDrawerProps {
    designId: string | null;
    onClose: () => void;
    currentUser: any;
    onUpdate?: () => void;
}

export default function DesignDetailDrawer({ designId, onClose, currentUser, onUpdate }: DesignDetailDrawerProps) {
    const [design, setDesign] = useState<any>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const { colorScheme } = useSettings();
    const toast = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Theme-aware colors
    const isDark = colorScheme === "dark";
    const bgMain = isDark ? "bg-[#1a1a24]" : "bg-white";
    const bgCard = isDark ? "bg-white/5" : "bg-gray-100";
    const bgInput = isDark ? "bg-white/5" : "bg-gray-50";
    const borderColor = isDark ? "border-white/10" : "border-gray-200";
    const textPrimary = isDark ? "text-white" : "text-gray-900";
    const textSecondary = isDark ? "text-white/90" : "text-gray-700";
    const textMuted = isDark ? "text-white/50" : "text-gray-500";
    const textMutedLight = isDark ? "text-white/40" : "text-gray-400";
    const textMutedVeryLight = isDark ? "text-white/20" : "text-gray-300";
    const bgCommentOther = isDark ? "bg-white/10" : "bg-gray-200";
    const borderCommentOther = isDark ? "border-white/5" : "border-gray-300";

    useEffect(() => {
        if (designId) {
            fetchDesignDetails();
            fetchActivity();

            // Auto-refresh activity every 3 seconds
            const interval = setInterval(() => {
                fetchActivity();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [designId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activity]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.status-dropdown-container')) {
                setShowStatusDropdown(false);
            }
        };

        if (showStatusDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showStatusDropdown]);

    const fetchDesignDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/designs/${designId}`);
            setDesign(res.data);
        } catch (err) {
            toast("Failed to load design details", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            const res = await api.get(`/designs/${designId}/activity`);
            setActivity(res.data);
        } catch (err) {
            console.error("Failed to load activity");
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;

        try {
            setSending(true);
            await api.post(`/designs/${designId}/comments`, { content: newComment });
            setNewComment("");
            // Refresh activity to show new comment
            fetchActivity();
        } catch (err) {
            toast("Failed to send comment", "error");
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!design) return;
        
        try {
            await api.patch(`/designs/${designId}/status`, { status: newStatus });
            setDesign({ ...design, status: newStatus });
            setShowStatusDropdown(false);
            toast("Status updated successfully!", "success");
            // Refresh activity to show status change
            fetchActivity();
            // Notify parent component to refresh
            if (onUpdate) onUpdate();
        } catch (err) {
            toast("Failed to update status", "error");
        }
    };

    const STATUS_OPTIONS = [
        { value: "assigned", label: "To Do", color: "text-blue-400" },
        { value: "in_progress", label: "In Progress", color: "text-purple-400" },
        { value: "review", label: "In Review", color: "text-amber-400" },
        { value: "completed", label: "Completed", color: "text-green-400" },
    ];

    return (
        <AnimatePresence>
            {designId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] px-4"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed top-0 right-0 h-full w-full max-w-lg ${bgMain} ${borderColor} border-l shadow-2xl z-[10001] flex flex-col`}
                    >
                        {/* Header */}
                        <div className={`p-6 ${borderColor} border-b ${isDark ? 'bg-gradient-to-r from-primary/20 to-accent/20' : 'bg-gradient-to-r from-primary/10 to-accent/10'}`}>
                            {/* Top Row: Status Dropdown & Close Button */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                                {/* Status Dropdown */}
                                {design && (
                                    <div className="relative status-dropdown-container">
                                        <button
                                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'} border transition-all font-semibold text-sm ${textPrimary} whitespace-nowrap`}
                                        >
                                            <span className="capitalize">{design.status.replace("_", " ")}</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {showStatusDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={`absolute top-full left-0 mt-2 w-48 ${bgMain} ${borderColor} border rounded-xl shadow-2xl overflow-hidden z-10`}
                                                >
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => handleStatusChange(option.value)}
                                                            className={`w-full px-4 py-3 text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors flex items-center justify-between ${
                                                                design.status === option.value ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''
                                                            }`}
                                                        >
                                                            <span className={`font-medium ${option.color}`}>{option.label}</span>
                                                            {design.status === option.value && (
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            
                            {/* Bottom Row: Title */}
                            <div>
                                <h2 className={`text-xl font-bold ${textPrimary} line-clamp-2`}>
                                    {loading ? "Loading..." : design?.title}
                                </h2>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Design Details</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                            {design && (
                                <>
                                    <div className={`p-4 rounded-2xl ${bgCard} ${borderColor} border`}>
                                        <div className="flex items-center gap-2 text-green-400 mb-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Price</span>
                                        </div>
                                        <div className={`font-semibold ${textPrimary}`}>${design.price}</div>
                                    </div>

                                    {/* Assignee - Hidden for customers */}
                                    {currentUser?.role !== "customer" && (
                                        <div>
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Assignee</h3>
                                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                                                    {design.assigned_user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{design.assigned_user?.full_name || "Unassigned"}</p>
                                                    <p className="text-xs text-muted-foreground">{design.assigned_user ? `@${design.assigned_user.username}` : "Pending assignment"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div>
                                        <h3 className={`text-sm font-bold ${textMuted} uppercase tracking-widest mb-3`}>Description</h3>
                                        <p className={`${textSecondary} leading-relaxed ${bgCard} p-4 rounded-2xl ${borderColor} border`}>
                                            {design.description}
                                        </p>
                                    </div>

                                    {/* Reference Image */}
                                    {design.image_url && (
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMuted} uppercase tracking-widest mb-3`}>Reference Material</h3>
                                            <div className={`relative group rounded-2xl overflow-hidden ${borderColor} border aspect-video ${isDark ? 'bg-black/40' : 'bg-gray-200'}`}>
                                                <img
                                                    src={design.image_url}
                                                    alt="Reference"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <a
                                                    href={design.image_url}
                                                    target="_blank"
                                                    className={`absolute inset-0 ${isDark ? 'bg-black/40' : 'bg-white/60'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 ${textPrimary} font-medium`}
                                                >
                                                    <ExternalLink className="w-5 h-5" /> View Original
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Result Link */}
                                    {design.result_link && (
                                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'} border flex items-center justify-between`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                                    <ImageIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold ${textPrimary}`}>Final Design Ready</div>
                                                    <div className="text-xs text-muted-foreground">Click to view or download</div>
                                                </div>
                                            </div>
                                            <a
                                                href={design.result_link}
                                                target="_blank"
                                                className="p-2 rounded-xl bg-primary text-white hover:bg-primary/80 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Activity Timeline Section */}
                                    <div className="pt-4">
                                        <div className="flex items-center gap-2 mb-6">
                                            <MessageSquare className="w-5 h-5 text-primary" />
                                            <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>Internal Discussion</h3>
                                        </div>

                                        <div className="space-y-4 mb-4" ref={scrollRef}>
                                            {activity.length === 0 ? (
                                                <div className={`text-center py-8 ${bgCard} rounded-2xl border-dashed ${borderColor} border`}>
                                                    <p className="text-sm text-muted-foreground">No activity yet. Start the conversation!</p>
                                                </div>
                                            ) : (
                                                activity.map((item) => {
                                                    if (item.type === "comment") {
                                                        const comment = item as Comment;
                                                        return (
                                                            <div
                                                                key={comment.id}
                                                                className={`flex flex-col ${comment.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1 px-2">
                                                                    <span className={`text-[10px] font-bold ${textMutedLight} uppercase`}>{comment.user_name}</span>
                                                                    <span className={`text-[10px] ${textMutedVeryLight}`}>
                                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${comment.user_id === currentUser?.id
                                                                        ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                                                                        : `${bgCommentOther} ${textPrimary} rounded-tl-none border ${borderCommentOther}`
                                                                        }`}
                                                                >
                                                                    {comment.content}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        // Status change
                                                        const statusChange = item as StatusChange;
                                                        return (
                                                            <div key={statusChange.id} className="flex items-center justify-center">
                                                                <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
                                                                    <RefreshCw className="w-3 h-3 text-blue-400" />
                                                                    <span className={`text-xs ${textMuted}`}>
                                                                        <span className="font-bold">{statusChange.changed_by_name}</span> changed status
                                                                    </span>
                                                                    {statusChange.old_status && (
                                                                        <span className={`text-[10px] px-2 py-1 rounded-md ${isDark ? 'bg-white/5' : 'bg-gray-200'} ${textMuted} capitalize`}>
                                                                            {statusChange.old_status.replace('_', ' ')}
                                                                        </span>
                                                                    )}
                                                                    <ArrowRight className="w-3 h-3 text-blue-400" />
                                                                    <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500 text-white capitalize font-semibold">
                                                                        {statusChange.new_status.replace('_', ' ')}
                                                                    </span>
                                                                    <span className={`text-[10px] ${textMutedVeryLight}`}>
                                                                        {new Date(statusChange.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                })
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sticky Footer Input */}
                        <div className={`p-6 ${borderColor} border-t ${bgMain} absolute bottom-0 left-0 right-0 z-10`}>
                            <form onSubmit={handleSendComment} className="relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className={`w-full ${bgInput} ${borderColor} border rounded-2xl py-4 pl-4 pr-14 focus:outline-none focus:border-primary/50 transition-colors text-sm ${textPrimary}`}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || sending}
                                    className="absolute right-2 top-2 p-3 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/80 transition-colors z-10"
                                >
                                    {sending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
