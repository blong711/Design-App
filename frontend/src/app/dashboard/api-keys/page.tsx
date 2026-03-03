"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Key, Plus, Copy, Check, Trash2, X, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApiKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ name: string; key: string | null }>({ name: "", key: null });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await api.get("/api-keys");
      setKeys(res.data);
    } catch (e) {
      toast("Failed to load keys.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!newKeyData.name) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api-keys", { system_name: newKeyData.name });
      setNewKeyData({ ...newKeyData, key: res.data.key });
      fetchKeys(); // Refresh list (though it won't show the full key)
      toast("API Key generated successfully!", "success");
    } catch (e) {
      toast("Failed to generate key.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the key for "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast("API Key revoked.", "success");
      fetchKeys();
    } catch (e) {
      toast("Failed to delete key.", "error");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="flex items-center gap-3 text-muted-foreground animate-pulse py-10">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading API keys...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary border border-primary/20 shadow-inner">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">API Keys</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage authentication keys for external integrations.</p>
        </div>
        <button
          onClick={() => { setGenerateOpen(true); setNewKeyData({ name: "", key: null }); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all flex items-center gap-2 group active:scale-95"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Key</span>
        </button>
      </div>

      {/* List */}
      <div className="grid gap-5 mt-4">
        {keys.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-[2.5rem] border-2 border-dashed border-border/40">
            <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Key className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">Create your first API key to start integrating.</p>
          </div>
        ) : (
          keys.map((k) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={k.id}
              className="glass-panel p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-primary/5"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-foreground/90">{k.system_name}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${k.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {k.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4 bg-black/40 px-4 py-3 rounded-xl border border-white/5 shadow-inner max-w-md">
                  <code className="text-xs font-mono text-primary/70 tracking-[0.2em]">••••••••••••••••••••</code>
                  <div className="ml-auto flex items-center gap-1 border-l border-white/10 pl-2">
                    <span className="text-[10px] text-muted-foreground font-mono mr-2">Created {new Date(k.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(k.id, k.system_name)}
                  className="p-3 text-muted-foreground/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                  title="Revoke Key"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {generateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
              onClick={() => !newKeyData.key && setGenerateOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    {newKeyData.key ? "Key Generated" : "Generate API Key"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newKeyData.key ? "Keep this key safe." : "Set a name for this integration."}
                  </p>
                </div>
                {!newKeyData.key && (
                  <button onClick={() => setGenerateOpen(false)} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {!newKeyData.key ? (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">System Name</label>
                    <input
                      value={newKeyData.name}
                      onChange={e => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      placeholder="e.g. Shopify Store"
                      className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm shadow-inner"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex gap-3 leading-relaxed">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>This key will be shown <strong>only once</strong>. If you lose it, you will have to generate a new one.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1 font-mono">Secret Key</label>
                      <div className="relative group">
                        <div className="w-full px-5 py-5 pr-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm break-all shadow-inner">
                          {newKeyData.key}
                        </div>
                        <button
                          onClick={() => handleCopy(newKeyData.key!, 'new')}
                          className="absolute right-3 top-3 p-2.5 bg-primary/20 hover:bg-primary/30 rounded-xl transition-all text-primary active:scale-95"
                        >
                          {copied === 'new' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
                {newKeyData.key ? (
                  <button
                    onClick={() => setGenerateOpen(false)}
                    className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                  >
                    Done
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setGenerateOpen(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={!newKeyData.name || submitting}
                      className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      Generate
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
