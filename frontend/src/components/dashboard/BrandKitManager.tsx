"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Palette, Plus, Trash2, Save, Type, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BrandKitManager() {
    const [kit, setKit] = useState<any>({
        brand_name: "",
        description: "",
        primary_font: "Inter",
        secondary_font: "Roboto",
        colors: [{ name: "Primary", hex: "#6366f1" }],
        assets: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchBrandKit();
    }, []);

    const fetchBrandKit = async () => {
        try {
            const res = await api.get("/brand");
            if (res.data) {
                setKit(res.data);
            }
        } catch (e) {
            console.error("Failed to load brand kit", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await api.put("/brand", kit);
            setKit(res.data);
            setMessage({ text: "Brand kit updated successfully!", type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            setMessage({ text: "Failed to update brand kit", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const addColor = () => {
        setKit({ ...kit, colors: [...kit.colors, { name: "New Color", hex: "#000000" }] });
    };

    const removeColor = (index: number) => {
        const newColors = kit.colors.filter((_: any, i: number) => i !== index);
        setKit({ ...kit, colors: newColors });
    };

    const updateColor = (index: number, field: string, value: string) => {
        const newColors = [...kit.colors];
        newColors[index] = { ...newColors[index], [field]: value };
        setKit({ ...kit, colors: newColors });
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Brand Kit...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-8 rounded-[2.5rem]">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Brand Kit</h2>
                    <p className="text-muted-foreground font-medium mt-1">Manage your brand identity, colors, and assets in one place.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Identity
                </button>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                    >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Identity */}
                <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Palette className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black">Visual Identity</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Brand Name</label>
                            <input
                                type="text"
                                value={kit.brand_name || ""}
                                onChange={(e) => setKit({ ...kit, brand_name: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-foreground/5 border border-border focus:border-primary transition-all outline-none font-bold"
                                placeholder="Enter your brand name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Brand Voice / Description</label>
                            <textarea
                                value={kit.description || ""}
                                onChange={(e) => setKit({ ...kit, description: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-foreground/5 border border-border focus:border-primary transition-all outline-none font-medium min-h-[120px]"
                                placeholder="Describe your brand's personality, target audience, and style..."
                            />
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Type className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black">Typography</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Font</label>
                            <input
                                type="text"
                                value={kit.primary_font || ""}
                                onChange={(e) => setKit({ ...kit, primary_font: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-foreground/5 border border-border transition-all outline-none font-bold"
                                placeholder="e.g. Montserrat, Playfair Display"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Secondary Font</label>
                            <input
                                type="text"
                                value={kit.secondary_font || ""}
                                onChange={(e) => setKit({ ...kit, secondary_font: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-foreground/5 border border-border transition-all outline-none font-medium"
                                placeholder="e.g. Open Sans, Lato"
                            />
                        </div>
                    </div>
                </div>

                {/* Brand Colors */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Palette className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black">Brand Palette</h3>
                        </div>
                        <button
                            onClick={addColor}
                            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl text-sm font-bold transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Add Color
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kit.colors.map((color: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-3xl bg-foreground/5 border border-border space-y-4 group"
                            >
                                <div
                                    className="w-full h-24 rounded-2xl shadow-inner border border-black/5"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={color.name}
                                        onChange={(e) => updateColor(idx, 'name', e.target.value)}
                                        className="w-full bg-transparent border-none text-sm font-black focus:ring-0 p-0"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={color.hex}
                                            onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                                            className="w-8 h-8 rounded-lg border-2 border-white/10 overflow-hidden cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={color.hex}
                                            onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                                            className="flex-1 bg-transparent border-none text-xs font-mono font-bold focus:ring-0 p-0 opacity-60"
                                        />
                                        <button
                                            onClick={() => removeColor(idx)}
                                            className="p-1.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
