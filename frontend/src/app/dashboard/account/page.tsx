"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Webhook, Camera, Save, Loader2, Check, Eye, EyeOff,
  Plus, Trash2, ToggleLeft, ToggleRight, Copy, CheckCheck,
} from "lucide-react";
import { api } from "@/lib/api";

type Tab = "general" | "security" | "webhook";

const EVENTS = ["design.created", "design.updated", "design.completed", "design.assigned"];

export default function AccountPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("general");

  // General
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalMsg, setGeneralMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Webhook
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookDesc, setWebhookDesc] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["design.created", "design.updated", "design.completed"]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setFullName(u.full_name || "");
    setEmail(u.email || "");
    if (u.avatar_url) setAvatarPreview(u.avatar_url);
    fetchWebhooks();
  }, [router]);

  const fetchWebhooks = async () => {
    try {
      const res = await api.get("/webhooks/");
      setWebhooks(res.data);
    } catch (_) { }
  };

  // ── Avatar ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── General Save ──
  const handleGeneralSave = async () => {
    setGeneralLoading(true);
    setGeneralMsg(null);
    try {
      let avatar_url = user?.avatar_url || null;

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await api.post("/s3/upload/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avatar_url = uploadRes.data.public_url;
      }

      const payload: any = { full_name: fullName, email, avatar_url };
      const res = await api.patch("/auth/me/profile", payload);

      const updated = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      window.dispatchEvent(new Event("user-updated")); // notify layout to refresh
      setAvatarFile(null);
      setGeneralMsg({ type: "ok", text: "Profile updated successfully!" });
    } catch (e: any) {
      setGeneralMsg({ type: "err", text: e.response?.data?.detail || "Failed to update profile" });
    } finally {
      setGeneralLoading(false);
    }
  };

  // ── Password Save ──
  const handlePasswordSave = async () => {
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "err", text: "New passwords do not match" });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: "err", text: "New password must be at least 6 characters" });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await api.post("/auth/me/change-password", { current_password: currentPwd, new_password: newPwd });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdMsg({ type: "ok", text: "Password changed successfully!" });
    } catch (e: any) {
      setPwdMsg({ type: "err", text: e.response?.data?.detail || "Failed to change password" });
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Webhook ──
  const toggleEvent = (ev: string) => {
    setWebhookEvents(prev => prev.includes(ev) ? prev.filter(x => x !== ev) : [...prev, ev]);
  };

  const handleAddWebhook = async () => {
    if (!webhookUrl.trim()) { setWebhookMsg({ type: "err", text: "URL is required" }); return; }
    setWebhookLoading(true);
    setWebhookMsg(null);
    try {
      await api.post("/webhooks/", { url: webhookUrl.trim(), description: webhookDesc, events: webhookEvents });
      setWebhookUrl(""); setWebhookDesc("");
      setWebhookMsg({ type: "ok", text: "Webhook added!" });
      fetchWebhooks();
    } catch (e: any) {
      setWebhookMsg({ type: "err", text: e.response?.data?.detail || "Failed to add webhook" });
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleToggleWebhook = async (id: string) => {
    await api.patch(`/webhooks/${id}/toggle`);
    fetchWebhooks();
  };

  const handleDeleteWebhook = async (id: string) => {
    await api.delete(`/webhooks/${id}`);
    fetchWebhooks();
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Tab config ──
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "webhook", label: "Webhook", icon: Webhook },
  ];

  const initials = user?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile, security and integrations.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl glass-panel w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {activeTab === "general" && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Profile photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or GIF. Max 5MB.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Change photo
              </button>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className="w-full bg-foreground/5 border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ""}
                disabled
                className="w-full bg-foreground/5 border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed capitalize"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {generalMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 ${generalMsg.type === "ok"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}>
              {generalMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleGeneralSave}
              disabled={generalLoading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
            >
              {generalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Make sure to use a strong and unique password.</p>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-5 max-w-sm">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors pr-10"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {newPwd.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPwd.length >= i * 3
                        ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-400"
                        : "bg-border"
                      }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className={`w-full bg-background border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors pr-10 ${confirmPwd && confirmPwd !== newPwd ? "border-red-500" : "border-border"
                    }`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPwd && confirmPwd !== newPwd && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPwd && confirmPwd === newPwd && newPwd.length > 0 && (
                <p className="text-green-500 text-xs mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
              )}
            </div>
          </div>

          {pwdMsg && (
            <div className={`text-sm rounded-lg px-4 py-3 max-w-sm ${pwdMsg.type === "ok"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}>
              {pwdMsg.text}
            </div>
          )}

          <div className="flex justify-end max-w-sm">
            <button
              onClick={handlePasswordSave}
              disabled={pwdLoading || !currentPwd || !newPwd || newPwd !== confirmPwd}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* ── WEBHOOK TAB ── */}
      {activeTab === "webhook" && (
        <div className="space-y-5">
          {/* Add webhook form */}
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Add Webhook</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Receive real-time HTTP POST notifications to your endpoint.
              </p>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={webhookDesc}
                  onChange={(e) => setWebhookDesc(e.target.value)}
                  placeholder="e.g. Notify Slack on design updates"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                  Events to listen
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENTS.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${webhookEvents.includes(ev)
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "bg-foreground/5 border-border text-muted-foreground hover:border-foreground/20"
                        }`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {webhookMsg && (
              <div className={`text-sm rounded-lg px-4 py-3 ${webhookMsg.type === "ok"
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}>
                {webhookMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAddWebhook}
                disabled={webhookLoading}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
              >
                {webhookLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Webhook
              </button>
            </div>
          </div>

          {/* Webhook list */}
          {webhooks.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Active Webhooks ({webhooks.length})
              </h3>
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all ${wh.is_active ? "border-border bg-foreground/5" : "border-border bg-foreground/[0.02] opacity-60"
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.is_active ? "bg-green-400" : "bg-muted-foreground"}`} />
                        <p className="text-sm font-mono text-foreground truncate">{wh.url}</p>
                      </div>
                      {wh.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-4">{wh.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2 ml-4">
                        {wh.events?.map((ev: string) => (
                          <span key={ev} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(wh.url, wh.id)}
                        className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === wh.id ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleWebhook(wh.id)}
                        className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
                        title={wh.is_active ? "Disable" : "Enable"}
                      >
                        {wh.is_active
                          ? <ToggleRight className="w-4 h-4 text-green-400" />
                          : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="p-2 rounded-lg bg-foreground/5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {webhooks.length === 0 && (
            <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
              <Webhook className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No webhooks yet. Add one above to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
