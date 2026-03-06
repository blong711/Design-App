"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useSettings } from "@/lib/settings-context";
import { X, MessageSquare, Send, Clock, User, ExternalLink, Image as ImageIcon, ArrowRight, RefreshCw, ChevronDown, Check, DollarSign, Calendar, AlertTriangle, Trash2, Upload, UploadCloud, FileCheck, Star, StarOff, Palette, ShieldCheck } from "lucide-react";
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
    const [designers, setDesigners] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [showDesignerSelect, setShowDesignerSelect] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [brandKit, setBrandKit] = useState<any>(null);
    const [loadingBrandKit, setLoadingBrandKit] = useState(false);
    const [showBrandKit, setShowBrandKit] = useState(false);
    const [editingPrice, setEditingPrice] = useState(false);
    const [priceInput, setPriceInput] = useState("");
    const [savingPrice, setSavingPrice] = useState(false);
    const [editingDueDate, setEditingDueDate] = useState(false);
    const [dueDateInput, setDueDateInput] = useState("");
    const [savingDueDate, setSavingDueDate] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [revisionNote, setRevisionNote] = useState("");
    const [submittingRevision, setSubmittingRevision] = useState(false);
    const [editingDesign, setEditingDesign] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [savingDesignEdit, setSavingDesignEdit] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDesignerSelect(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (designId) {
            fetchDesignDetails();
            fetchActivity();
            if (currentUser?.role === "admin") {
                fetchDesigners();
            }

            // Auto-refresh activity every 3 seconds
            const interval = setInterval(() => {
                fetchActivity();
                if (currentUser.role !== 'customer') {
                    fetchBrandKit(designId);
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [designId]);

    const fetchBrandKit = async (id: string) => {
        try {
            setLoadingBrandKit(true);
            // First get design to get customer_id
            const resD = await api.get(`/designs/${id}`);
            const customerId = resD.data.created_by;
            if (customerId) {
                const resB = await api.get(`/brand?user_id=${customerId}`);
                setBrandKit(resB.data);
            }
        } catch (err) {
            console.error("Failed to load brand kit", err);
        } finally {
            setLoadingBrandKit(false);
        }
    };

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

    const fetchDesigners = async () => {
        try {
            const res = await api.get("/users?role=designer");
            setDesigners(res.data);
        } catch (err) {
            console.error("Failed to load designers");
        }
    };

    const handleAssign = async (designerId: string) => {
        try {
            setAssigning(true);
            await api.patch(`/designs/${designId}/assign`, { assigned_to: designerId || null });
            toast(designerId ? "Design assigned successfully" : "Design unassigned", "success");
            fetchDesignDetails(); // Refresh design data
            fetchActivity(); // Refresh history
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to assign design", "error");
        } finally {
            setAssigning(false);
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

        // If admin is canceling, show a quick confirmation
        if (newStatus === "canceled") {
            const confirmed = window.confirm("Are you sure you want to CANCEL this design? This will refund the payment to the customer balance immediately.");
            if (!confirmed) return;
        }

        try {
            await api.patch(`/designs/${designId}/status`, { status: newStatus });
            setDesign({ ...design, status: newStatus });
            setShowStatusDropdown(false);
            toast(newStatus === "canceled" ? "Design cancelled & refunded!" : "Status updated successfully!", "success");
            // Refresh activity to show status change
            fetchActivity();
            // Notify parent component to refresh
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to update status", "error");
        }
    };

    const handleSavePrice = async () => {
        const price = parseFloat(priceInput);
        if (isNaN(price) || price < 0) return;
        setSavingPrice(true);
        try {
            const res = await api.put(`/designs/${designId}`, { price });
            setDesign(res.data);
            setEditingPrice(false);
            toast("Price updated!", "success");
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to save price", "error");
        } finally {
            setSavingPrice(false);
        }
    };

    const handleSaveDueDate = async () => {
        setSavingDueDate(true);
        try {
            const due_date = dueDateInput ? new Date(dueDateInput).toISOString() : null;
            const res = await api.patch(`/designs/${designId}/due-date`, { due_date });
            setDesign(res.data);
            setEditingDueDate(false);
            toast("Due date updated!", "success");
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to save due date", "error");
        } finally {
            setSavingDueDate(false);
        }
    };

    const handleCancelDesign = async () => {
        setCancelling(true);
        try {
            await api.patch(`/designs/${designId}/cancel`, {});
            toast("Design cancelled successfully", "success");
            setShowCancelConfirm(false);
            if (onUpdate) onUpdate();
            onClose();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to cancel design", "error");
        } finally {
            setCancelling(false);
        }
    };

    const handleSaveDesignEdit = async () => {
        setSavingDesignEdit(true);
        try {
            const res = await api.patch(`/designs/${designId}/edit`, {
                title: editTitle,
                description: editDescription,
            });
            setDesign(res.data);
            setEditingDesign(false);
            toast("Design updated!", "success");
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to save changes", "error");
        } finally {
            setSavingDesignEdit(false);
        }
    };

    const handleUploadResult = async () => {
        if (!selectedFile || !designId) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            // Step 1: Get presigned URL (or local upload URL)
            const presignRes = await api.get(`/s3/presigned-url`, {
                params: {
                    filename: selectedFile.name,
                    content_type: selectedFile.type || "application/octet-stream",
                }
            });
            const { upload_url, public_url } = presignRes.data;

            // Step 2: Upload the file with progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    }
                });
                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error(`Upload failed: ${xhr.status}`));
                });
                xhr.addEventListener("error", () => reject(new Error("Network error")));
                xhr.open("PUT", upload_url);
                xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

                // Add Authorization header for local uploads (S3 presigned URLs don't need/want it)
                const token = localStorage.getItem("access_token");
                if (token && upload_url.includes("/api/v1")) {
                    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                }

                xhr.send(selectedFile);
            });

            // Step 3: Save result_link to the design
            const res = await api.patch(`/designs/${designId}/result`, { result_link: public_url });
            setDesign(res.data);
            setSelectedFile(null);
            setUploadProgress(0);
            toast("Result uploaded successfully! 🎉", "success");
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.message || "Upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveRating = async () => {
        if (userRating === 0) {
            toast("Please select a rating", "error");
            return;
        }
        setSubmittingRating(true);
        try {
            const res = await api.put(`/designs/${designId}`, {
                rating: userRating,
                review: userReview,
            });
            setDesign(res.data);
            toast("Thank you for your feedback!", "success");
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to save rating", "error");
        } finally {
            setSubmittingRating(false);
        }
    };
    const handleRequestRevision = async () => {
        if (!revisionNote.trim()) return;
        setSubmittingRevision(true);
        try {
            const res = await api.patch(`/designs/${designId}/status`, {
                status: "needs_revision",
                rejection_reason: revisionNote
            });
            setDesign(res.data);
            setShowRevisionForm(false);
            setRevisionNote("");
            toast("Revision requested", "success");
            fetchActivity();
            if (onUpdate) onUpdate();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to request revision", "error");
        } finally {
            setSubmittingRevision(false);
        }
    };

    // Due date helpers
    const isDueSoon = (dueDateStr: string) => {
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 2; // within 2 days or overdue
    };

    const getDueDateColor = (dueDateStr?: string | null) => {
        if (!dueDateStr) return "text-muted-foreground";
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) return "text-red-500";
        if (diffDays <= 2) return "text-orange-400";
        return "text-blue-400";
    };

    const formatDueDate = (dueDateStr: string) => {
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const formatted = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        if (diffDays < 0) return `${formatted} — Overdue by ${Math.abs(diffDays)} day(s)!`;
        if (diffDays === 0) return `${formatted} — Due today!`;
        if (diffDays === 1) return `${formatted} — Due tomorrow`;
        return `${formatted} — ${diffDays} days left`;
    };

    const STATUS_OPTIONS = [
        { value: "assigned", label: "To Do", color: "text-blue-400" },
        { value: "in_progress", label: "In Progress", color: "text-purple-400" },
        { value: "review", label: "In Review", color: "text-amber-400" },
        { value: "needs_revision", label: "Needs Revision", color: "text-orange-400" },
        { value: "completed", label: "Completed", color: "text-green-400" },
    ];

    if (currentUser?.role === "admin") {
        STATUS_OPTIONS.push({ value: "canceled", label: "Cancelled (Refund)", color: "text-red-400" });
    }

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
                                {/* Status — read-only for customer, dropdown for others */}
                                {design && (
                                    currentUser?.role === "customer" ? (
                                        <span className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-gray-200 border-gray-300'} border font-semibold text-sm ${textPrimary} whitespace-nowrap select-none`}>
                                            <span className="capitalize">{design.status.replace("_", " ")}</span>
                                        </span>
                                    ) : (
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
                                                                className={`w-full px-4 py-3 text-left ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors flex items-center justify-between ${design.status === option.value ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''
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
                                    )
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-32">
                            {design && (
                                <>
                                    {/* Price — editable for admin */}
                                    {currentUser?.role === "admin" ? (
                                        <div className={`p-4 rounded-2xl ${bgCard} ${borderColor} border`}>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase">Price</span>
                                                </div>
                                                {!editingPrice && (
                                                    <button
                                                        onClick={() => { setEditingPrice(true); setPriceInput(String(design.price ?? "")); }}
                                                        className="text-xs text-primary hover:underline font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                            {editingPrice ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`flex items-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg ${bgInput} ${borderColor} border focus-within:border-primary/50 transition-colors`}>
                                                        <span className="text-muted-foreground text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={priceInput}
                                                            onChange={(e) => setPriceInput(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(); if (e.key === 'Escape') setEditingPrice(false); }}
                                                            autoFocus
                                                            className={`flex-1 bg-transparent text-sm font-semibold ${textPrimary} focus:outline-none`}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleSavePrice}
                                                        disabled={savingPrice}
                                                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                    >
                                                        {savingPrice ? "..." : "Save"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingPrice(false)}
                                                        className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-xs font-bold transition-all`}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`font-bold text-xl ${design.price > 0 ? 'text-green-400' : 'text-muted-foreground italic text-sm'}`}>
                                                    {design.price > 0 ? `$${design.price}` : 'Not set — click Edit'}
                                                </div>
                                            )}
                                        </div>
                                    ) : currentUser?.role === "customer" ? (
                                        <div className={`p-4 rounded-2xl ${bgCard} ${borderColor} border`}>
                                            <div className="flex items-center gap-2 text-green-400 mb-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase">Price</span>
                                            </div>
                                            <div className={`font-semibold ${textPrimary}`}>${design.price}</div>
                                        </div>
                                    ) : null}

                                    {/* Due Date — admin editable, others read-only */}
                                    <div className={`p-4 rounded-2xl ${bgCard} ${borderColor} border`}>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className={`flex items-center gap-2 ${getDueDateColor(design.due_date)}`}>
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase">Due Date</span>
                                                {design.due_date && isDueSoon(design.due_date) && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                                        URGENT
                                                    </span>
                                                )}
                                            </div>
                                            {currentUser?.role === "admin" && !editingDueDate && (
                                                <button
                                                    onClick={() => {
                                                        setEditingDueDate(true);
                                                        setDueDateInput(design.due_date ? new Date(design.due_date).toISOString().slice(0, 10) : "");
                                                    }}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    {design.due_date ? "Edit" : "Set"}
                                                </button>
                                            )}
                                        </div>
                                        {currentUser?.role === "admin" && editingDueDate ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="date"
                                                    value={dueDateInput}
                                                    onChange={(e) => setDueDateInput(e.target.value)}
                                                    className={`flex-1 px-3 py-1.5 rounded-lg ${bgInput} ${borderColor} border text-sm ${textPrimary} focus:outline-none focus:border-primary/50`}
                                                />
                                                <button
                                                    onClick={handleSaveDueDate}
                                                    disabled={savingDueDate}
                                                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                >
                                                    {savingDueDate ? "..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => setEditingDueDate(false)}
                                                    className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-xs font-bold transition-all`}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`font-semibold ${getDueDateColor(design.due_date)}`}>
                                                {design.due_date
                                                    ? formatDueDate(design.due_date)
                                                    : <span className="text-muted-foreground italic text-sm">{currentUser?.role === "admin" ? "Click Set to add a deadline" : "No deadline set"}</span>
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer Cancel Design */}
                                    {currentUser?.role === "customer" && design.status === "pending" && (
                                        <div>
                                            {!showCancelConfirm ? (
                                                <button
                                                    onClick={() => setShowCancelConfirm(true)}
                                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border-red-300 bg-red-50 text-red-500 hover:bg-red-100'} font-semibold text-sm transition-all`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Cancel Design Request
                                                </button>
                                            ) : (
                                                <div className={`p-4 rounded-2xl border ${isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-300 bg-red-50'}`}>
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className={`font-bold text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>Cancel this design?</p>
                                                            <p className={`text-xs mt-1 ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>
                                                                This action cannot be undone. {design.payment_status === 'paid' ? 'Your payment will be refunded to your balance.' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleCancelDesign}
                                                            disabled={cancelling}
                                                            className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
                                                        >
                                                            {cancelling ? "Cancelling..." : "Yes, Cancel"}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowCancelConfirm(false)}
                                                            className={`flex-1 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-bold transition-all`}
                                                        >
                                                            Keep It
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Needs Revision Banner — Customer sees this when designer requests changes */}
                                    {currentUser?.role === "customer" && design.status === "needs_revision" && (
                                        <div className={`p-4 rounded-2xl border ${isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-300 bg-orange-50'}`}>
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className={`font-bold text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                                                        Revision Requested
                                                    </p>
                                                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-orange-400/90' : 'text-orange-600'}`}>
                                                        {design.rejection_reason || "The designer has requested changes. Please check the comments below."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Designer: Request Revision button */}
                                    {currentUser?.role === "designer" && ['in_progress', 'review', 'assigned'].includes(design.status) && (
                                        <div>
                                            {!showRevisionForm ? (
                                                <button
                                                    onClick={() => setShowRevisionForm(true)}
                                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border ${isDark ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'} font-semibold text-sm transition-all`}
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Request Revision
                                                </button>
                                            ) : (
                                                <div className={`p-4 rounded-2xl border ${isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-300 bg-orange-50'}`}>
                                                    <p className={`font-bold text-sm mb-3 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                                                        Describe what needs to change:
                                                    </p>
                                                    <textarea
                                                        value={revisionNote}
                                                        onChange={(e) => setRevisionNote(e.target.value)}
                                                        placeholder="e.g. Please provide a higher resolution image, the colors need to match the brand guide..."
                                                        rows={3}
                                                        className={`w-full px-3 py-2.5 rounded-xl ${bgInput} ${borderColor} border text-sm ${textPrimary} focus:outline-none focus:border-orange-400/50 resize-none mb-3`}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleRequestRevision}
                                                            disabled={submittingRevision || !revisionNote.trim()}
                                                            className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all"
                                                        >
                                                            {submittingRevision ? "Sending..." : "Send Request"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowRevisionForm(false); setRevisionNote(""); }}
                                                            className={`flex-1 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-bold transition-all`}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Assignee - Admin Assign Dropdown or Designer View */}
                                    {currentUser?.role === "admin" ? (
                                        <div>
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Assignee</h3>

                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${bgCard} ${borderColor} border`}>
                                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                                                    {design.assigned_user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                                <div className="flex-1 flex items-center justify-between">
                                                    <div>
                                                        <p className={`text-sm font-medium ${textPrimary}`}>{design.assigned_user?.full_name || "Unassigned"}</p>
                                                        <p className="text-xs text-muted-foreground">{design.assigned_user ? `@${design.assigned_user.username}` : "Pending assignment"}</p>
                                                    </div>
                                                    <div className="relative" ref={dropdownRef}>
                                                        <button
                                                            onClick={() => setShowDesignerSelect(!showDesignerSelect)}
                                                            disabled={assigning}
                                                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium ${bgInput} ${borderColor} border ${textPrimary} hover:border-primary/50 transition-colors w-48 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            <span className="truncate">
                                                                {design.assigned_user?.full_name || "-- Unassigned --"}
                                                            </span>
                                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDesignerSelect ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {showDesignerSelect && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: 10 }}
                                                                    className={`absolute bottom-full right-0 mb-2 w-56 rounded-xl border ${borderColor} ${bgMain} shadow-2xl overflow-hidden z-[10005]`}
                                                                >
                                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                                        <button
                                                                            onClick={() => { handleAssign(""); setShowDesignerSelect(false); }}
                                                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${!design.assigned_user ? 'bg-primary/10 text-primary' : `${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} ${textPrimary}`}`}
                                                                        >
                                                                            <div className="w-4 flex justify-center shrink-0">
                                                                                {!design.assigned_user && <Check className="w-4 h-4" />}
                                                                            </div>
                                                                            <span className="font-medium">-- Unassigned --</span>
                                                                        </button>
                                                                        {designers.map((d: any) => {
                                                                            const isSelected = design.assigned_user?.id === d.id;
                                                                            return (
                                                                                <button
                                                                                    key={d.id}
                                                                                    onClick={() => { handleAssign(d.id); setShowDesignerSelect(false); }}
                                                                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${isSelected ? 'bg-primary/10 text-primary' : `${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} ${textPrimary}`}`}
                                                                                >
                                                                                    <div className="w-4 flex justify-center shrink-0">
                                                                                        {isSelected && <Check className="w-4 h-4" />}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="font-medium truncate">{d.full_name}</p>
                                                                                        <p className={`text-[10px] truncate ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>@{d.username}</p>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : currentUser?.role === "designer" ? (
                                        <div>
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Assignee</h3>
                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${bgCard} ${borderColor} border`}>
                                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                                                    {design.assigned_user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimary}`}>{design.assigned_user?.full_name || "Unassigned"}</p>
                                                    <p className="text-xs text-muted-foreground">{design.assigned_user ? `@${design.assigned_user.username}` : "Pending assignment"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Rating Section — visible when completed */}
                                    {design.status === "completed" && (
                                        <div className={`p-6 rounded-2xl ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border mb-6`}>
                                            <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest mb-4 flex items-center gap-2`}>
                                                <Star className="w-4 h-4 text-amber-500" />
                                                {design.rating ? "Your Feedback" : "Rate this Design"}
                                            </h3>

                                            {design.rating ? (
                                                <div className="space-y-2">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-5 h-5 ${star <= (design.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-amber-500/20'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    {design.review && (
                                                        <p className={`text-sm italic ${textSecondary}`}>"{design.review}"</p>
                                                    )}
                                                </div>
                                            ) : (
                                                currentUser?.role === "customer" ? (
                                                    <div className="space-y-4">
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    onClick={() => setUserRating(star)}
                                                                    className="transition-transform hover:scale-110 active:scale-95 px-1 pb-1"
                                                                >
                                                                    {star <= userRating ? (
                                                                        <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                                                                    ) : (
                                                                        <StarOff className="w-8 h-8 text-amber-500/30" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <textarea
                                                            value={userReview}
                                                            onChange={(e) => setUserReview(e.target.value)}
                                                            placeholder="Share your thoughts about this design (optional)..."
                                                            rows={3}
                                                            className={`w-full bg-white/5 border border-amber-500/30 text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 transition-all resize-none ${textPrimary}`}
                                                        />
                                                        <button
                                                            onClick={handleSaveRating}
                                                            disabled={userRating === 0 || submittingRating}
                                                            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            {submittingRating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                            Submit Feedback
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        No rating provided yet.
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Brand Kit (Customer Identity) — visible to designers/admins */}
                                    {currentUser?.role !== "customer" && brandKit && (
                                        <div className={`p-6 rounded-[2rem] ${isDark ? 'bg-primary/5 border-primary/20' : 'bg-primary/5 border-primary/10'} border mb-6 relative overflow-hidden group`}>
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Palette className="w-12 h-12" />
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className={`text-sm font-black ${isDark ? 'text-primary' : 'text-primary/70'} uppercase tracking-widest flex items-center gap-2`}>
                                                        <ShieldCheck className="w-4 h-4" />
                                                        Brand Guidelines
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowBrandKit(!showBrandKit)}
                                                        className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"
                                                    >
                                                        {showBrandKit ? "Hide Details" : "View Kit"}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center font-black text-xl text-primary shrink-0 shadow-inner">
                                                        {brandKit.brand_name?.charAt(0) || "B"}
                                                    </div>
                                                    <div>
                                                        <p className={`text-base font-black ${textPrimary}`}>{brandKit.brand_name || "Official Brand"}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{brandKit.primary_font} & {brandKit.secondary_font}</p>
                                                    </div>
                                                </div>

                                                {showBrandKit && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        className="space-y-4 pt-4 border-t border-border/50"
                                                    >
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {brandKit.colors?.map((c: any, i: number) => (
                                                                <div key={i} className="space-y-1">
                                                                    <div
                                                                        className="w-full h-8 rounded-lg border border-white/10 shadow-sm"
                                                                        style={{ backgroundColor: c.hex }}
                                                                        title={c.name}
                                                                    />
                                                                    <div className="text-[8px] font-mono font-bold text-center opacity-50">{c.hex}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {brandKit.description && (
                                                            <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-3">
                                                                "{brandKit.description}"
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description — editable for customers with pending designs */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className={`text-sm font-bold ${textMuted} uppercase tracking-widest`}>Description</h3>
                                            {currentUser?.role === "customer" && design.status === "pending" && !editingDesign && (
                                                <button
                                                    onClick={() => {
                                                        setEditingDesign(true);
                                                        setEditTitle(design.title);
                                                        setEditDescription(design.description);
                                                    }}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    ✏️ Edit
                                                </button>
                                            )}
                                        </div>
                                        {editingDesign ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className={`text-xs font-bold ${textMuted} uppercase mb-1 block`}>Title</label>
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className={`w-full px-3 py-2 rounded-xl ${bgInput} ${borderColor} border text-sm ${textPrimary} focus:outline-none focus:border-primary/50`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-bold ${textMuted} uppercase mb-1 block`}>Description</label>
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        rows={4}
                                                        className={`w-full px-3 py-2 rounded-xl ${bgInput} ${borderColor} border text-sm ${textPrimary} focus:outline-none focus:border-primary/50 resize-none`}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveDesignEdit}
                                                        disabled={savingDesignEdit || !editTitle.trim()}
                                                        className="flex-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                    >
                                                        {savingDesignEdit ? "Saving..." : "Save Changes"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingDesign(false)}
                                                        className={`flex-1 px-4 py-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-bold transition-all`}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`${textSecondary} leading-relaxed ${bgCard} p-4 rounded-2xl ${borderColor} border`}>
                                                {design.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Reference Materials */}
                                    {(design.image_url || (design.image_urls && design.image_urls.length > 0)) && (
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMuted} uppercase tracking-widest mb-3`}>Reference Materials</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {design.image_urls && design.image_urls.map((url: string, i: number) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        className={`relative group rounded-2xl overflow-hidden ${borderColor} border aspect-video ${isDark ? 'bg-black/40' : 'bg-gray-200'} hover:border-primary/50 transition-colors`}
                                                    >
                                                        <img src={url} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ExternalLink className="w-5 h-5 text-white" />
                                                        </div>
                                                    </a>
                                                ))}
                                                {/* Fallback for old designs with only image_url */}
                                                {!design.image_urls?.length && design.image_url && (
                                                    <a
                                                        href={design.image_url}
                                                        target="_blank"
                                                        className={`relative group rounded-2xl overflow-hidden ${borderColor} border aspect-video ${isDark ? 'bg-black/40' : 'bg-gray-200'} hover:border-primary/50 transition-colors`}
                                                    >
                                                        <img src={design.image_url} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ExternalLink className="w-5 h-5 text-white" />
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Result — File Uploader for designers, link view for others */}
                                    <div>
                                        <h3 className={`text-sm font-bold ${textMuted} uppercase tracking-widest mb-3`}>Final Result</h3>

                                        {/* Existing result — visible to all */}
                                        {design.result_link && (
                                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border flex items-center justify-between mb-3`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                                                        <FileCheck className="w-5 h-5 text-green-400" />
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

                                        {/* File uploader — designer only */}
                                        {currentUser?.role === "designer" && (
                                            <div
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files?.[0];
                                                    if (file) setSelectedFile(file);
                                                }}
                                                onClick={() => !uploading && fileInputRef.current?.click()}
                                                className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${selectedFile
                                                    ? isDark ? 'border-primary/50 bg-primary/5' : 'border-primary/40 bg-primary/5'
                                                    : isDark ? 'border-white/20 hover:border-primary/50 hover:bg-white/5' : 'border-gray-300 hover:border-primary/40 hover:bg-gray-50'
                                                    } p-5`}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setSelectedFile(file);
                                                    }}
                                                    accept="image/*,.pdf,.zip,.ai,.psd,.png,.jpg"
                                                />

                                                {selectedFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                                            <UploadCloud className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold ${textPrimary} truncate`}>{selectedFile.name}</p>
                                                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadProgress(0); }}
                                                            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
                                                        >
                                                            <X className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                                                        <Upload className={`w-7 h-7 ${textMuted}`} />
                                                        <p className={`text-sm font-semibold ${textSecondary}`}>
                                                            {design.result_link ? "Replace result file" : "Upload result file"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
                                                        <p className="text-[10px] text-muted-foreground/60">PNG, JPG, PDF, ZIP, AI, PSD</p>
                                                    </div>
                                                )}

                                                {/* Upload progress bar */}
                                                {uploading && (
                                                    <div className="absolute inset-x-4 bottom-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-primary font-medium">Uploading...</span>
                                                            <span className="text-xs text-primary font-bold">{uploadProgress}%</span>
                                                        </div>
                                                        <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} overflow-hidden`}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${uploadProgress}%` }}
                                                                className="h-full bg-primary rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Upload / Cancel button row */}
                                        {currentUser?.role === "designer" && selectedFile && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={handleUploadResult}
                                                    disabled={uploading}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                                                >
                                                    {uploading ? (
                                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading {uploadProgress}%</>
                                                    ) : (
                                                        <><UploadCloud className="w-4 h-4" /> Upload Result</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedFile(null); setUploadProgress(0); }}
                                                    disabled={uploading}
                                                    className={`px-4 py-2.5 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} text-sm font-bold transition-all disabled:opacity-50`}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>

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
            )}
        </AnimatePresence>
    );
}
