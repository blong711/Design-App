"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Plus, UserPlus, MoreVertical, Edit2, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading Users...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-primary/20 p-2 rounded-xl text-primary"><Users className="w-6 h-6" /></div>
             <h2 className="text-3xl font-bold tracking-tight">Team Members</h2>
           </div>
          <p className="text-muted-foreground mt-1 text-sm">Manage Admin and Designer accounts.</p>
        </div>
        <button className="bg-primary hover:bg-primary/80 border border-primary/50 px-5 py-2.5 rounded-xl font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
        {users.length === 0 && (
           <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
             <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
             <p className="text-white/60">No users found.</p>
           </div>
        )}
        {users.map((u) => (
          <div key={u.id} className="glass-panel p-6 rounded-2xl flex relative overflow-hidden group hover:border-white/20 transition-all shadow-xl shadow-black/30">
             {/* Decor */}
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${u.role === 'admin' ? 'bg-primary' : 'bg-accent'}`}></div>
             
             <div className="flex flex-col w-full z-10">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl text-white shadow-inner">
                    {u.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
                     u.role === 'admin' 
                     ? 'bg-primary/20 text-primary border-primary/30' 
                     : 'bg-accent/20 text-accent border-accent/30'
                  }`}>
                    {u.role}
                  </span>
               </div>
               
               <div>
                  <h3 className="text-xl font-bold text-white/90">{u.full_name}</h3>
                  <p className="text-sm text-white/50 font-medium mb-1">@{u.username}</p>
                  <p className="text-sm text-white/40">{u.email}</p>
               </div>

               <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></span>
                    <span className="text-xs text-white/60 font-medium">{u.is_active ? 'Active Account' : 'Deactivated'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <button className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button className="p-2 bg-white/5 hover:bg-red-400/10 text-white/60 hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
