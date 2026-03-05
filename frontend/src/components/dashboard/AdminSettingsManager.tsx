"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Plus, Trash2, Edit2, Save, X, Download, Package, DollarSign, Settings, Cog, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSettingsManager() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Template Form state
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", price: "", description: "" });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get("/pricing");
            setTemplates(res.data);
        } catch (e) {
            toast("Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) return;
        try {
            if (editingId) {
                await api.put(`/pricing/${editingId}`, { ...formData, price: parseFloat(formData.price) });
                toast("Template updated", "success");
            } else {
                await api.post("/pricing", { ...formData, price: parseFloat(formData.price) });
                toast("Template created", "success");
            }
            fetchTemplates();
            resetForm();
        } catch (e) {
            toast("Failed to save template", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/pricing/${id}`);
            setTemplates(templates.filter(t => t.id !== id));
            toast("Template deleted", "info");
        } catch (e) {
            toast("Delete failed", "error");
        }
    };

    const startEdit = (t: any) => {
        setEditingId(t.id);
        setFormData({ name: t.name, price: String(t.price), description: t.description || "" });
        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({ name: "", price: "", description: "" });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleExport = async () => {
        try {
            const res = await api.get("/analytics/export-designs", { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `designs_report_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            toast("CSV Report generated", "success");
        } catch (e) {
            toast("Export failed", "error");
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Pricing Templates Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/20">
                                <Package className="w-6 h-6 text-primary" />
                            </div>
                            Pricing Packages
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage reusable design pricing tiers.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-lg"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4 relative z-10">
                    <AnimatePresence>
                        {isAdding && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="p-6 rounded-2xl bg-foreground/5 border border-primary/30 mb-6 space-y-4 overflow-hidden"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Package Name (e.g. Logo Basic)"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-1 bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                        <input
                                            type="number" placeholder="Price"
                                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-background/50 border border-border rounded-xl pl-6 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Brief details..."
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm h-20 resize-none focus:outline-none focus:border-primary"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
                                        {editingId ? "Update Package" : "Add Package"}
                                    </button>
                                    <button onClick={resetForm} className="px-4 py-2 bg-foreground/10 rounded-xl text-sm font-bold">
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-10 opacity-30 italic">No packages defined. Click + to start.</div>
                    ) : (
                        templates.map((t, idx) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-transparent hover:border-primary/20 transition-all"
                            >
                                <div>
                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                        {t.name}
                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black">${t.price}</span>
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description || "No description"}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(t)} className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* System Utilities Section */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between"
            >
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                            <Cog className="w-6 h-6 text-amber-500" />
                        </div>
                        System & Data
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Export records and system diagnostics.</p>

                    <div className="mt-8 space-y-6">
                        <div className="p-6 rounded-2xl bg-foreground/5 border border-border group hover:border-primary/30 transition-all cursor-pointer" onClick={handleExport}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-foreground/10 group-hover:bg-primary/20 transition-all">
                                    <Download className="w-6 h-6 text-foreground group-hover:text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">Full Design Export</h4>
                                    <p className="text-xs text-muted-foreground">Download all records as a CSV for offline analysis.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-foreground/5 border border-border group opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-foreground/10">
                                    <Settings className="w-6 h-6 text-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">System Diagnostics</h4>
                                    <p className="text-xs text-muted-foreground">Detailed health check of S3 and MongoDB (Coming Soon).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 opacity-20 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    System Status: Operational
                </div>
            </motion.div>
        </div>
    );
}
