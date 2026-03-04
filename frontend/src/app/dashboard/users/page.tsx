"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import {
  Users, UserPlus, Edit2, Trash2, X, Loader2,
  CheckCircle2, AlertCircle, ShieldCheck, Paintbrush,
  Lock, ShoppingCart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "customer" | "designer";
  is_active: boolean;
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", password: "", role: "designer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.full_name || !form.password) {
      setError("All fields are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast("User created successfully!", "success");
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Add Member
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Create a new member account.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {[
              { label: "Full Name", key: "full_name", placeholder: "Jane Smith" },
              { label: "Username", key: "username", placeholder: "janesmith" },
              { label: "Email", key: "email", placeholder: "jane@example.com", type: "email" },
              { label: "Password", key: "password", placeholder: "Min 6 characters", type: "password" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
                <input
                  type={type || "text"}
                  value={(form as any)[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />
              </div>
            ))}

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(["designer", "customer", "admin"] as const).map((r) => {
                  const isActive = form.role === r;
                  let colorClass = "border-accent bg-accent/15 text-accent";
                  if (r === "admin") colorClass = "border-primary bg-primary/15 text-primary";
                  if (r === "customer") colorClass = "border-purple-500 bg-purple-500/15 text-purple-400";

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role", r)}
                      className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all cursor-pointer ${isActive
                        ? colorClass
                        : "border-border bg-foreground/5 text-muted-foreground hover:opacity-80"
                        }`}
                    >
                      {r === "designer" ? <Paintbrush className="w-5 h-5" /> : r === "customer" ? <ShoppingCart className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      <span className="text-[10px] font-bold uppercase">{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><CheckCircle2 className="w-4 h-4" /> Create</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ full_name: user.full_name, role: user.role, is_active: user.is_active });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.patch(`/users/${user.id}`, form);
      toast("User updated successfully!", "success");
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" /> Edit Member
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(["designer", "customer", "admin"] as const).map((r) => {
                  const isActive = form.role === r;
                  let colorClass = "border-accent bg-accent/15 text-accent";
                  if (r === "admin") colorClass = "border-primary bg-primary/15 text-primary";
                  if (r === "customer") colorClass = "border-purple-500 bg-purple-500/15 text-purple-400";

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all cursor-pointer ${isActive
                        ? colorClass
                        : "border-border bg-foreground/5 text-muted-foreground hover:opacity-80"
                        }`}
                    >
                      {r === "designer" ? <Paintbrush className="w-5 h-5" /> : r === "customer" ? <ShoppingCart className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      <span className="text-[10px] font-bold uppercase">{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-foreground/5 border border-border">
              <span className="text-sm font-medium text-foreground">Account Active</span>
              <button
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`w-12 h-6 rounded-full transition-all relative ${form.is_active ? "bg-green-500" : "bg-muted"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${user.id}`);
      toast(`${user.full_name} has been removed.`, "success");
      onDeleted();
      onClose();
    } catch (e: any) {
      toast(e.response?.data?.detail || "Failed to delete user.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl pointer-events-auto p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Remove Member?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You are about to delete <span className="font-semibold text-foreground">{user.full_name}</span>.
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (e) {
      toast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: User) => {
    if (!confirm(`Switch to ${user.full_name}'s account?`)) return;

    try {
      const res = await api.post(`/auth/impersonate/${user.id}`);
      const { access_token, user: userData } = res.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));

      toast(`Successfully switched to ${user.full_name}`, "success");
      // Use window.location.href to force a full reload and clear state
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast(e.response?.data?.detail || "Impersonation failed.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse py-10">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading members...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modals */}
      {addOpen && <AddUserModal onClose={() => setAddOpen(false)} onCreated={fetchUsers} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={fetchUsers} />}
      {deleteUser && <DeleteConfirmModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={fetchUsers} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/20 p-2 rounded-xl text-primary"><Users className="w-6 h-6" /></div>
            <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {users.length} member{users.length !== 1 ? "s" : ""} · Manage Admin and Designer accounts.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-primary hover:bg-primary/80 border border-primary/50 px-5 py-2.5 rounded-xl font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-10">Avatar</span>
          <span>Name / Username</span>
          <span>Email</span>
          <span className="text-center">Role</span>
          <span className="text-center">Actions</span>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner shrink-0 border ${u.role === "admin"
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : u.role === "customer"
                      ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                      : "bg-accent/20 border-accent/30 text-accent"
                    }`}
                >
                  {u.role === "admin" ? <ShieldCheck className="w-5 h-5" /> : u.role === "customer" ? <ShoppingCart className="w-5 h-5" /> : <Paintbrush className="w-5 h-5" />}
                </div>

                {/* Name + username + status */}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{u.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.is_active ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                    {!u.is_active && <span className="text-[10px] text-red-400 font-medium">(inactive)</span>}
                  </div>
                </div>

                {/* Email */}
                <p className="text-sm text-muted-foreground truncate">{u.email}</p>

                {/* Role badge */}
                <div className="flex flex-col items-center gap-1">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border text-center min-w-[80px] ${u.role === "admin"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : u.role === "customer"
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : "bg-accent/20 text-accent border-accent/30"
                    }`}>
                    {u.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleImpersonate(u)}
                    title="Switch to this account"
                    className="p-2 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditUser(u)}
                    title="Edit user"
                    className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteUser(u)}
                    title="Delete user"
                    className="p-2 bg-muted hover:bg-red-400/10 text-muted-foreground hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
