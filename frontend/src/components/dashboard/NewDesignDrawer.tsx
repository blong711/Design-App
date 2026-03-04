"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image as ImageIcon, X, Loader2, AlertCircle } from "lucide-react";

interface NewDesignDrawerProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function NewDesignDrawer({ open, onClose, onCreated }: NewDesignDrawerProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setTitle("");
        setDescription("");
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            setError("Please fill in all required fields.");
            return;
        }
        setLoading(true);
        try {
            let image_url = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append("file", imageFile);
                const r = await api.post("/s3/upload/design-image", fd, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                image_url = r.data.public_url;
            }
            await api.post("/designs", { title, description, image_url });
            onCreated();
            handleClose();
        } catch (e: any) {
            setError(e.response?.data?.detail || "Failed to create design");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="fixed inset-y-0 right-0 h-screen w-full max-w-lg bg-background border-l border-border z-[60] flex flex-col shadow-2xl"
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">New Design Request</h3>
                                <p className="text-xs mt-1 text-amber-500 font-medium italic">
                                    * Admin will set the price after review
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Title</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Logo for my store"
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Reference Image</label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground font-medium">Click to upload reference</p>
                                        </>
                                    )}
                                    <input ref={fileRef} type="file" className="hidden" onChange={handleImage} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={5}
                                    placeholder="Details about your design..."
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-all resize-none text-foreground"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 py-3 rounded-xl font-bold hover:bg-foreground/5 transition-colors text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleSubmit}
                                className="flex-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Design"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
