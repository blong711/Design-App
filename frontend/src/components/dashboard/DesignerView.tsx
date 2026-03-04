"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api, s3Upload, heavyUpload } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { CheckCircle2, Clock, Eye, MessageSquare, Loader2, UploadCloud, Search, Filter, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";

const COLUMNS = [
  { id: "assigned", title: "To Do", icon: Clock, color: "text-blue-400", glow: "from-blue-500/20 to-blue-500/5" },
  { id: "in_progress", title: "In Progress", icon: ActivityIcon, color: "text-purple-400", glow: "from-purple-500/20 to-purple-500/5" },
  { id: "review", title: "In Review", icon: Eye, color: "text-amber-400", glow: "from-amber-500/20 to-amber-500/5" },
  { id: "completed", title: "Completed", icon: CheckCircle2, color: "text-green-400", glow: "from-green-500/20 to-green-500/5" },
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
    const grouped: Record<string, any[]> = { assigned: [], in_progress: [], review: [], completed: [], pending: [] };
    data.forEach((t: any) => {
      if (grouped[t.status]) {
        grouped[t.status].push(t);
      } else {
        grouped.assigned.push(t); // fallback
      }
    });
    setColumns(grouped);
  };

  // Filter tickets
  const filterTickets = (tickets: any[]) => {
    return tickets.filter(ticket => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Price filter
      const price = parseFloat(ticket.price) || 0;
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "low" && price < 50) ||
        (priceFilter === "medium" && price >= 50 && price < 150) ||
        (priceFilter === "high" && price >= 150);

      return matchesSearch && matchesPrice;
    });
  };

  // Calculate column total
  const getColumnTotal = (columnId: string) => {
    return columns[columnId]?.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0) || 0;
  };

  // Check if ticket is overdue
  const isOverdue = (ticket: any) => {
    if (!ticket.deadline) return false;
    return new Date(ticket.deadline) < new Date();
  };

  // Check if ticket is high priority (high price)
  const isHighPriority = (ticket: any) => {
    return parseFloat(ticket.price) >= 150;
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 172800) return 'Yesterday';
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Completed designs shouldn't be moved manually via drag if we strictly allow only admin, 
    // but we can allow designer to move back to progress if needed.
    if (destination.droppableId === "completed") {
      // Prevent designers from marking as completed directly
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

    // Trigger upload modal if dropped in review
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

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Design Board</h2>
        <p className="text-muted-foreground mt-1 text-sm">Drag tasks across columns to update their status.</p>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 glass-panel rounded-2xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-foreground/5 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Price Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-foreground/5 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="all">All Prices</option>
              <option value="low">Low (&lt;$50)</option>
              <option value="medium">Medium ($50-$150)</option>
              <option value="high">High ($150+)</option>
            </select>
          </div>
        </div>
      </motion.div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start h-full">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex flex-col h-full rounded-2xl glass-panel relative overflow-hidden">
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
                    className={`flex-1 p-3 flex flex-col gap-3 min-h-[500px] transition-all ${snapshot.isDraggingOver
                      ? 'bg-primary/5 border-2 border-dashed border-primary/50 rounded-xl'
                      : 'border-2 border-transparent'
                      }`}
                  >
                    <AnimatePresence>
                      {filteredTickets.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col items-center justify-center text-center p-8"
                        >
                          <col.icon className={`w-16 h-16 ${col.color} opacity-20 mb-4`} />
                          <p className="text-muted-foreground text-sm font-medium mb-1">
                            No tasks here {col.id === 'completed' ? '👀' : '🎉'}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {col.id === 'assigned' && 'Wait for new assignments'}
                            {col.id === 'in_progress' && 'Drag tasks here to start working'}
                            {col.id === 'review' && 'Submit completed work for review'}
                            {col.id === 'completed' && 'Completed tasks will appear here'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {filteredTickets.map((ticket, index) => {
                      const highPriority = isHighPriority(ticket);
                      const overdue = isOverdue(ticket);
                      const inReview = col.id === 'review';

                      return (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 rounded-xl backdrop-blur-sm select-none cursor-pointer group relative overflow-hidden transition-all duration-200 ${snapshot.isDragging
                                ? 'bg-background/95 shadow-2xl shadow-primary/30 border-2 border-primary/70 z-50 scale-105 rotate-2'
                                : 'bg-gradient-to-br from-foreground/10 to-foreground/5 hover:from-foreground/15 hover:to-foreground/10 shadow-lg hover:shadow-xl hover:-translate-y-1 border'
                                } ${overdue
                                  ? 'border-red-500/50 shadow-red-500/20'
                                  : inReview
                                    ? 'border-amber-500/50 shadow-amber-500/20'
                                    : highPriority
                                      ? 'border-primary/50 shadow-primary/20'
                                      : 'border-border'
                                }`}
                              onClick={() => setDetailTicketId(ticket.id)}
                            >
                              {/* High Priority Glow Effect */}
                              {highPriority && !snapshot.isDragging && (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                              )}

                              {/* Overdue Indicator */}
                              {overdue && (
                                <div className="absolute top-2 right-2 z-10">
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/50">
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                    <span className="text-xs font-bold text-red-400">Overdue</span>
                                  </div>
                                </div>
                              )}

                              <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-semibold text-foreground leading-tight flex-1 pr-2">
                                    {ticket.title}
                                  </h4>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                                  {ticket.description || 'No description provided'}
                                </p>

                                {/* Meta Information */}
                                <div className="space-y-2 mb-4">
                                  {/* Updated Time */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>Updated {getTimeAgo(ticket.updated_at || ticket.created_at)}</span>
                                  </div>

                                  {/* Deadline */}
                                  {ticket.deadline && (
                                    <div className={`flex items-center gap-2 text-xs ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                      <Calendar className="w-3 h-3" />
                                      <span>Due: {new Date(ticket.deadline).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center">
                                  {/* Price - Prominent Display */}
                                  <div className={`px-3 py-2 rounded-lg font-bold text-sm ${highPriority
                                    ? 'bg-gradient-to-r from-primary/30 to-accent/30 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                                    : 'bg-primary/10 text-primary border border-primary/30'
                                    } flex items-center gap-1.5`}>
                                    {highPriority && <TrendingUp className="w-3.5 h-3.5" />}
                                    ${ticket.price}
                                  </div>

                                  {/* Result Link */}
                                  {ticket.result_link && (
                                    <a
                                      href={ticket.result_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 text-xs font-medium transition-colors"
                                    >
                                      <Eye className="w-3 h-3" /> Result
                                    </a>
                                  )}
                                </div>

                                {/* Hover Action Indicator */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="text-xs text-primary font-medium flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    <span>View Details</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))
          }
        </div >
      </DragDropContext >

      {/* S3 Upload Modal when moving to Review */}
      {
        selectedDesign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-background rounded-3xl border border-border p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Upload Final Design</h3>
              <p className="text-sm text-muted-foreground mb-6">You're submitting {" "}
                <b className="text-foreground">{selectedDesign.title}</b>. Upload your file to our secure storage.
              </p>

              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-foreground/5 mb-6 hover:border-primary/50 transition-colors">
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                <input
                  type="file"
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && <p className="mt-3 text-sm text-green-400 font-medium">Ready: {uploadFile.name}</p>}

                {uploading && (
                  <div className="w-full mt-4 bg-foreground/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {uploading && <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% uploaded</p>}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedDesign(null)}
                >
                  Skip for now
                </button>
                <button
                  disabled={!uploadFile || uploading}
                  onClick={handleUploadSubmit}
                  className="bg-primary hover:bg-primary/80 disabled:opacity-50 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload File"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <DesignDetailDrawer
        designId={detailDesignId}
        onClose={() => setDetailDesignId(null)}
        currentUser={user}
      />
    </div >
  );
}
