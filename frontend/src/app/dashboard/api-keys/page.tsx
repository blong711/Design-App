"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Key, Plus, Copy, Check, Trash2 } from "lucide-react";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await api.get("/api-keys");
      setKeys(res.data);
    } catch (e) {
      console.error("Failed to load keys", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="animate-pulse">Loading API Keys...</div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-primary/20 p-2 rounded-xl text-primary"><Key className="w-6 h-6" /></div>
             <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
           </div>
          <p className="text-muted-foreground text-sm">Manage API Keys for external systems to create design tickets.</p>
        </div>
        <button className="bg-primary hover:bg-primary/80 border border-primary/50 px-5 py-2.5 rounded-xl font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Generate New Key</span>
        </button>
      </div>

      <div className="grid gap-4 mt-8">
        {keys.length === 0 ? (
           <div className="text-center py-20 bg-muted/50 rounded-2xl border border-border border-dashed">
             <Key className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
             <p className="text-muted-foreground">No API Keys created yet.</p>
           </div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-border transition-colors">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{k.system_name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Created on {new Date(k.created_at).toLocaleDateString()}</p>
                
                <div className="flex items-center gap-2 mt-3 bg-muted px-3 py-2 rounded-lg border border-border">
                  <span className="text-sm font-mono text-primary/80 tracking-widest">{k.key.substring(0, 8)}••••••••••••••••••••</span>
                  <button onClick={() => handleCopy(k.key, k.id)} className="p-1.5 hover:bg-foreground/10 rounded-md text-muted-foreground transition-colors">
                    {copied === k.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 min-w-[120px] justify-end">
                 <span className={`flex items-center gap-1.5 text-xs font-medium ${k.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${k.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {k.is_active ? 'Active' : 'Revoked'}
                 </span>
                 <button className="p-2 text-muted-foreground/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
