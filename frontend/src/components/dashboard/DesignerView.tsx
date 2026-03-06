"use client";

import { useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api, s3Upload, heavyUpload } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { CheckCircle2, Clock, Eye, MessageSquare, Loader2, UploadCloud, Search, Filter, AlertCircle, Calendar, TrendingUp, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import { getTimeAgo } from "@/lib/date-utils";
import { useSettings } from "@/lib/settings-context";

const COLUMNS = [
  { id: "assigned", title: "To Do", icon: Clock, color: "text-blue-400" },
  { id: "in_progress", title: "In Progress", icon: ActivityIcon, color: "text-purple-400" },
  { id: "review", title: "In Review", icon: Eye, color: "text-amber-400" },
  { id: "completed", title: "Completed", icon: CheckCircle2, color: "text-green-400" },
];

const LIST_PAGE_SIZE = 9; // 3x3 grid

function ActivityIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default function DesignerView({ user }: { user: any }) {
  const toast = useToast();
  const { colorScheme } = useSettings();
  const [viewMode, setViewMode] = useState<"kanban" | "cart">("kanban");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [columns, setColumns] = useState<Record<string, any[]>>({
    assigned: [],
    in_progress: [],
    review: [],
    completed: []
  });
  const [columnPages, setColumnPages] = useState<Record<string, number>>({
    assigned: 1,
    in_progress: 1,
    review: 1,
    completed: 1
  });

  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detailDesignId, setDetailDesignId] = useState<string | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  const toggleCol = (id: string) => setCollapsedCols(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

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

  const onDragStart = () => {
    // Standard start
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (destination.droppableId === "completed" && user.role !== "admin") {
      toast("Only Admins can mark a design as Complete.", "error");
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const oldColumns = { ...columns };

    // Move the item
    const startItems = Array.from(columns[sourceColId] || []);
    const [movedDesign] = startItems.splice(source.index, 1);

    let nextColumns;
    if (sourceColId === destColId) {
      startItems.splice(destination.index, 0, movedDesign);
      nextColumns = { ...columns, [sourceColId]: startItems };
    } else {
      const destItems = Array.from(columns[destColId] || []);
      destItems.splice(destination.index, 0, movedDesign);
      nextColumns = {
        ...columns,
        [sourceColId]: startItems,
        [destColId]: destItems
      };
    }

    // Synchronous state update for DnD library stability
    setColumns(nextColumns);

    // Side-effects in a separate non-awaitable block
    (async () => {
      try {
        await api.patch(`/designs/${movedDesign.id}/status`, { status: destColId });
        if (destColId === "review" && !movedDesign.result_link) {
          setSelectedDesign(movedDesign);
        }
      } catch (err: any) {
        toast("Failed to save changes. Reverting...", "error");
        setColumns(oldColumns);
      }
    })();
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
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Design Board</h2>
            <p className="text-muted-foreground mt-1 text-sm">Drag tasks across columns to update their status.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-foreground/5 rounded-full p-1 border border-border">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("cart")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "cart"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? (
        // Kanban Board View - Scrollable Columns
        <div className="flex-1 overflow-hidden">
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex gap-2 px-6 py-4 overflow-x-auto h-full">
              {COLUMNS.map((col, colIdx) => {
                const isCollapsed = collapsedCols.has(col.id);
                return isCollapsed ? (
                  // Collapsed column — narrow vertical strip, pushed to right
                  <div
                    key={col.id}
                    onClick={() => toggleCol(col.id)}
                    title={`Expand ${col.title}`}
                    className="shrink-0 flex flex-col items-center rounded-xl glass-panel border border-border cursor-pointer hover:border-primary/40 transition-all"
                    style={{ width: 44, order: 100 + colIdx }}
                  >
                    <div className="flex flex-col items-center gap-3 py-4 flex-1">
                      <col.icon className={`w-4 h-4 ${col.color}`} />
                      <span className="text-[10px] font-bold text-muted-foreground bg-foreground/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {columns[col.id]?.length || 0}
                      </span>
                      <div className="flex-1 flex items-center justify-center mt-2">
                        <span
                          className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 whitespace-nowrap"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {col.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={col.id} className="flex flex-col rounded-xl glass-panel border border-border flex-1 min-w-[260px]" style={{ order: colIdx }}>
                    {/* Sticky Column Header */}
                    <div className="sticky top-0 z-10 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        <col.icon className={`w-4 h-4 ${col.color}`} />
                        <span className="text-xs uppercase tracking-wider text-foreground/80">{col.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-muted-foreground bg-foreground/10 px-2 py-0.5 rounded-full">
                          {columns[col.id]?.length || 0}
                        </span>
                        <button
                          onClick={() => toggleCol(col.id)}
                          title="Collapse column"
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Droppable Area */}
                    <Droppable droppableId={col.id} type="DESIGN">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2 transition-colors flex-1 ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                          style={{
                            height: 'calc(100vh - 220px)',
                          }}
                        >
                          {columns[col.id]?.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                              <col.icon className={`w-12 h-12 ${col.color} opacity-20 mb-3`} />
                              <p className="text-muted-foreground text-xs font-medium mb-1">
                                No tasks
                              </p>
                              <p className="text-xs text-muted-foreground/60">
                                {col.id === 'assigned' && 'New assignments'}
                                {col.id === 'in_progress' && 'Drag to start'}
                                {col.id === 'review' && 'Submit for review'}
                                {col.id === 'completed' && 'Done tasks'}
                              </p>
                            </div>
                          ) : (
                            columns[col.id]?.map((design, index) => (
                              <MemoizedDesignCard
                                key={design.id}
                                design={design}
                                index={index}
                                density={density}
                                colorScheme={colorScheme}
                                setDetailDesignId={setDetailDesignId}
                              />
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      ) : (
        // Cart/List View
        <div className="space-y-4 px-6 py-4">
          {COLUMNS.map(col => {
            const designs = columns[col.id] || [];
            if (designs.length === 0) return null;

            const currentPage = columnPages[col.id] || 1;
            const totalPages = Math.max(1, Math.ceil(designs.length / LIST_PAGE_SIZE));
            const startIndex = (currentPage - 1) * LIST_PAGE_SIZE;
            const endIndex = startIndex + LIST_PAGE_SIZE;
            const paginatedDesigns = designs.slice(startIndex, endIndex);

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
                  {paginatedDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer group overflow-hidden"
                      onClick={() => setDetailDesignId(design.id)}
                    >
                      {/* Reference Image */}
                      {design.image_url && (
                        <div className="relative w-full h-48 overflow-hidden bg-background/50">
                          <img
                            src={design.image_url}
                            alt={design.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Status Badge Overlay */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${col.id === 'completed' ? 'bg-green-500/90 text-white' :
                              col.id === 'review' ? 'bg-amber-500/90 text-white' :
                                col.id === 'in_progress' ? 'bg-purple-500/90 text-white' :
                                  'bg-blue-500/90 text-white'
                              }`}>
                              {col.title}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        {/* Title */}
                        <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-1">
                          {design.title}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {design.description || 'No description provided'}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getTimeAgo(design.updated_at || design.created_at)}</span>
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
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-border bg-foreground/5 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-semibold text-foreground">{startIndex + 1}</span>
                      {"–"}
                      <span className="font-semibold text-foreground">{Math.min(endIndex, designs.length)}</span>
                      {" of "}
                      <span className="font-semibold text-foreground">{designs.length}</span> tasks
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setColumnPages({ ...columnPages, [col.id]: Math.max(1, currentPage - 1) })}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                        const p = startPage + i;
                        if (p > totalPages) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => setColumnPages({ ...columnPages, [col.id]: p })}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all ${currentPage === p
                              ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                              : "border-border bg-foreground/5 hover:bg-foreground/10 text-foreground"
                              }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setColumnPages({ ...columnPages, [col.id]: Math.min(totalPages, currentPage + 1) })}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
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

const MemoizedDesignCard = memo(({ design, index, density, colorScheme, setDetailDesignId }: any) => {
  const isCompact = density === "compact";
  const titleSize = isCompact ? "text-xs" : "text-sm";
  const badgeSize = isCompact ? "text-[10px]" : "text-xs";
  const imageHeight = isCompact ? "h-24" : "h-32";

  const isLight = colorScheme === "light";

  return (
    <Draggable key={design.id} draggableId={design.id} index={index}>
      {(provided, snapshot) => {
        const isDragging = snapshot.isDragging;

        // Card Body Wrapper - Controlled by DnD Library
        const cardContent = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setDetailDesignId(design.id)}
            style={{
              ...provided.draggableProps.style,
              zIndex: isDragging ? 9999 : undefined,
            }}
          >
            {/* Visual Wrapper - Clean and Responsive */}
            <div
              className={`shrink-0 rounded-xl border select-none cursor-pointer group overflow-hidden transition-all duration-200 transform-gpu ${isDragging
                ? (isLight
                  ? 'bg-white shadow-[0_30px_80px_rgba(0,0,0,0.15)] border-primary/40 scale-[1.05] ring-2 ring-primary/20'
                  : 'bg-[#1a1528] shadow-[0_30px_80px_rgba(168,85,247,0.5)] border-primary/60 scale-[1.05] ring-2 ring-primary/30')
                : 'bg-card border-border hover:border-primary/40 hover:shadow-md'
                }`}
              style={{
                backdropFilter: isDragging ? 'none' : undefined,
              }}
            >
              <div className={`relative w-full ${imageHeight} overflow-hidden bg-muted`}>
                {design.image_url ? (
                  <img
                    src={design.image_url}
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LayoutGrid className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              <div className={isCompact ? "p-2.5" : "p-3"}>
                <h4 className={`font-semibold text-foreground leading-snug line-clamp-2 mb-2 ${titleSize}`} title={design.title}>
                  {design.title}
                </h4>

                <p className={`text-muted-foreground mb-3 ${badgeSize}`}>
                  {design.updated_at
                    ? new Date(design.updated_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : new Date(design.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center font-bold text-primary text-[10px] overflow-hidden">
                      {design.customer_avatar ? (
                        <img src={design.customer_avatar} className="w-full h-full object-cover" />
                      ) : (
                        (design.customer_name || design.created_by_name || 'C')?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`text-muted-foreground truncate max-w-[60px] ${badgeSize}`}>
                      {design.customer_name || design.created_by_name || 'Customer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-muted-foreground truncate max-w-[60px] text-right ${badgeSize}`}>
                      {design.designer_name || design.assigned_to_name || 'Unassigned'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-[10px] overflow-hidden">
                      {design.designer_avatar ? (
                        <img src={design.designer_avatar} className="w-full h-full object-cover" />
                      ) : (
                        (design.designer_name || design.assigned_to_name || 'D')?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

        // ALWAYS use portal while dragging to fix coordinate calculation errors and clipping
        if (isDragging) {
          const portalRoot = document.getElementById('portal-root');
          if (portalRoot) return createPortal(cardContent, portalRoot);
        }

        return cardContent;
      }}
    </Draggable>
  );
});
