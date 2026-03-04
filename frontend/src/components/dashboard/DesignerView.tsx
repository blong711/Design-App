"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api, s3Upload, heavyUpload } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { CheckCircle2, Clock, Eye, MessageSquare, Loader2, UploadCloud, Search, Filter, AlertCircle, Calendar, TrendingUp, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import { getTimeAgo } from "@/lib/date-utils";

const COLUMNS = [
  { id: "assigned", title: "To Do", icon: Clock, color: "text-blue-400" },
  { id: "in_progress", title: "In Progress", icon: ActivityIcon, color: "text-purple-400" },
  { id: "review", title: "In Review", icon: Eye, color: "text-amber-400" },
  { id: "completed", title: "Completed", icon: CheckCircle2, color: "text-green-400" },
];

function ActivityIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default function DesignerView({ user }: { user: any }) {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<"kanban" | "cart">("kanban");
  const [columns, setColumns] = useState<Record<string, any[]>>({
    assigned: [],
    in_progress: [],
    review: [],
    completed: []
  });

  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detailDesignId, setDetailDesignId] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    const res = await api.get("/designs");
    const data = res.data;

    // Group designs
    const grouped: Record<string, any[]> = { assigned: [], in_progress: [], review: [], completed: [] };
    data.forEach((t: any) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      } else {
        grouped.assigned.push(t); // fallback
      }
    });
    setColumns(grouped);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Prevent designers from marking as completed directly
    if (destination.droppableId === "completed") {
      toast("Only Admins can mark a design as Complete.", "error");
      return;
    }

    const startCol = columns[source.droppableId];
    const endCol = columns[destination.droppableId];
    const movedDesign = startCol[source.index];

    // Optimistic UI Update
    const newStart = Array.from(startCol);
    newStart.splice(source.index, 1);
    const newEnd = Array.from(endCol);
    newEnd.splice(destination.index, 0, movedDesign);

    setColumns({
      ...columns,
      [source.droppableId]: newStart,
      [destination.droppableId]: newEnd
    });

    // Update Status API
    await api.patch(`/designs/${movedDesign.id}/status`, { status: destination.droppableId });

    // Trigger upload modal if dropped in review and no result link yet
    if (destination.droppableId === "review" && !movedDesign.result_link) {
      setSelectedDesign(movedDesign);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedDesign) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      // Use heavyUpload for automatic chunking of large files
      const public_url = await heavyUpload(uploadFile, (progress) => {
        setUploadProgress(progress);
      });

      // 3. Update Result Link
      await api.patch(`/designs/${selectedDesign.id}/result`, { result_link: public_url });

      toast("File uploaded successfully!", "success");
      setSelectedDesign(null);
      setUploadFile(null);
      setUploadProgress(0);
      fetchDesigns();
    } catch (e) {
      console.error(e);
      toast("Failed to upload file. Please try again.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStatusChange = async (designId: string, newStatus: string) => {
    try {
      // Update status via API
      await api.patch(`/designs/${designId}/status`, { status: newStatus });
      toast("Status updated successfully!", "success");
      
      // Refresh designs
      fetchDesigns();
      
      // If moving to review and no result link, show upload modal
      const design = Object.values(columns).flat().find(d => d.id === designId);
      if (newStatus === 'review' && design && !design.result_link) {
        setSelectedDesign(design);
      }
    } catch (e) {
      console.error(e);
      toast("Failed to update status. Please try again.", "error");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Design Board</h2>
          <p className="text-muted-foreground mt-1 text-sm">Drag tasks across columns to update their status.</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-foreground/5 rounded-full p-1 border border-border">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "kanban"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode("cart")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "cart"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        // Kanban Board View
        <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex flex-col rounded-2xl glass-panel relative overflow-hidden">
              {/* Column Header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <col.icon className={`w-4 h-4 ${col.color}`} />
                  <span className="text-sm uppercase tracking-wider text-foreground/80">{col.title}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full">
                  {columns[col.id]?.length || 0}
                </span>
              </div>

              {/* Droppable Area */}
              < Droppable droppableId={col.id} >
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 flex flex-col gap-3 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                  >
                    {columns[col.id]?.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <col.icon className={`w-16 h-16 ${col.color} opacity-20 mb-4`} />
                        <p className="text-muted-foreground text-sm font-medium mb-1">
                          No tasks here
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {col.id === 'assigned' && 'Wait for new assignments'}
                          {col.id === 'in_progress' && 'Drag tasks here to start working'}
                          {col.id === 'review' && 'Submit completed work for review'}
                          {col.id === 'completed' && 'Completed tasks will appear here'}
                        </p>
                      </div>
                    ) : (
                      columns[col.id]?.map((design, index) => (
                        <Draggable key={design.id} draggableId={design.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 rounded-xl border border-border shadow-lg select-none transition-all cursor-pointer ${snapshot.isDragging
                                  ? 'bg-[#1a1528] shadow-[0_0_20px_rgba(168,85,247,0.3)] border-primary/50 rotate-2'
                                  : 'bg-foreground/5 hover:bg-foreground/10'
                                }`}
                              onClick={() => setDetailDesignId(design.id)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-foreground leading-tight">{design.title}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                                {design.description || 'No description provided'}
                              </p>

                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{getTimeAgo(design.updated_at || design.created_at)}</span>
                                </div>
                                {design.result_link && (
                                  <a
                                    href={design.result_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> Result
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      ) : (
        // Cart/List View
        <div className="space-y-4">
          {COLUMNS.map(col => {
            const designs = columns[col.id] || [];
            if (designs.length === 0) return null;
            
            return (
              <div key={col.id} className="glass-panel rounded-2xl overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-border bg-foreground/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <col.icon className={`w-5 h-5 ${col.color}`} />
                    <h3 className="font-semibold text-lg">{col.title}</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-foreground/10 px-2.5 py-1 rounded-full">
                      {designs.length}
                    </span>
                  </div>
                </div>

                {/* Design Cards */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designs.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer group"
                      onClick={() => setDetailDesignId(design.id)}
                    >
                      {/* Title & Status Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors flex-1">
                          {design.title}
                        </h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                          col.id === 'completed' ? 'bg-green-500/20 text-green-400' :
                          col.id === 'review' ? 'bg-amber-500/20 text-amber-400' :
                          col.id === 'in_progress' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {col.title}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {design.description || 'No description provided'}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getTimeAgo(design.updated_at || design.created_at)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {design.result_link && (
                            <a
                              href={design.result_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 font-medium"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </a>
                          )}
                          
                          {/* Status Change Buttons */}
                          {col.id === 'assigned' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(design.id, 'in_progress');
                              }}
                              className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 font-medium transition-colors"
                            >
                              Start
                            </button>
                          )}
                          
                          {col.id === 'in_progress' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!design.result_link) {
                                  setSelectedDesign(design);
                                } else {
                                  handleStatusChange(design.id, 'review');
                                }
                              }}
                              className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-medium transition-colors"
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {Object.values(columns).every(col => col.length === 0) && (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <LayoutGrid className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No designs assigned yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Check back later for new tasks</p>
            </div>
          )}
        </div>
      )}

      {/* S3 Upload Modal when moving to Review */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-3xl border border-border p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Upload Final Design</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You're submitting <b className="text-foreground">{selectedDesign.title}</b>. Upload your file to our secure storage.
            </p>

            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-foreground/5 mb-6 hover:border-primary/50 transition-colors">
              <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
              <input
                type="file"
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && <p className="mt-3 text-sm text-green-400 font-medium">Ready: {uploadFile.name}</p>}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedDesign(null);
                  setUploadFile(null);
                }}
              >
                Skip for now
              </button>
              <button
                disabled={!uploadFile || uploading}
                onClick={handleUploadSubmit}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DesignDetailDrawer
        designId={detailDesignId}
        onClose={() => setDetailDesignId(null)}
        currentUser={user}
        onUpdate={fetchDesigns}
      />
    </div>
  );
}
