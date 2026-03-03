"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Users, Plus, Pencil, Trash2, Shield, Info, X, Check, Loader2 } from "lucide-react";

interface Team {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get("/teams");
            setTeams(res.data);
        } catch (err) {
            toast("Failed to load teams", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (team: Team | null = null) => {
        setEditingTeam(team);
        setFormData(team ? { name: team.name, description: team.description || "" } : { name: "", description: "" });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTeam) {
                await api.put(`/teams/${editingTeam.id}`, formData);
                toast("Team updated successfully", "success");
            } else {
                await api.post("/teams", formData);
                toast("Team created successfully", "success");
            }
            setModalOpen(false);
            fetchTeams();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Action failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this team? It must be empty of users.")) return;
        try {
            await api.delete(`/teams/${id}`);
            toast("Team deleted", "success");
            fetchTeams();
        } catch (err: any) {
            toast(err.response?.data?.detail || "Failed to delete team", "error");
        }
    };

    if (loading) return <div className="animate-pulse py-10 text-muted-foreground">Loading teams...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Organize users and scope tickets by creating teams.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Team
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.length === 0 && (
                    <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>No teams created yet.</p>
                    </div>
                )}
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => handleOpenModal(team)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(team.id)}
                                className="p-2 rounded-lg bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 text-red-400/70 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {team.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{team.name}</h3>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Team ID: {team.id.slice(-6)}</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-2 italic">
                                {team.description || "No description provided."}
                            </p>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Administrative Control</span>
                                </div>
                                <div className="text-[10px] text-white/30 truncate">Created: {new Date(team.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">{editingTeam ? "Edit Team" : "New Team"}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Team Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Creative Force Alpha"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-primary/50 transition-colors"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="What does this team focus on?"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingTeam ? "Update Team" : "Create Team"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
