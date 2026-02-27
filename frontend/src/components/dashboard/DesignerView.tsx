"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { api, s3Upload } from "@/lib/api";
import { CheckCircle2, Clock, Eye, MessageSquare, Loader2, UploadCloud } from "lucide-react";

const COLUMNS = [
  { id: "assigned", title: "To Do", icon: Clock, color: "text-blue-400" },
  { id: "in_progress", title: "In Progress", icon: ActivityIcon, color: "text-purple-400" },
  { id: "review", title: "In Review", icon: Eye, color: "text-yellow-400" },
  { id: "completed", title: "Completed", icon: CheckCircle2, color: "text-green-400" },
];

function ActivityIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}

export default function DesignerView({ user }: { user: any }) {
  const [columns, setColumns] = useState<Record<string, any[]>>({
    assigned: [],
    in_progress: [],
    review: [],
    completed: []
  });
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const res = await api.get("/tickets");
    const data = res.data;
    
    // Group tickets
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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Completed tickets shouldn't be moved manually via drag if we strictly allow only admin, 
    // but we can allow designer to move back to progress if needed.
    if (destination.droppableId === "completed") {
       // Prevent designers from marking as completed directly
       alert("Only Admins can mark a ticket as Complete.");
       return;
    }

    const startCol = columns[source.droppableId];
    const endCol = columns[destination.droppableId];
    const movedTicket = startCol[source.index];

    // Optimistic UI Update
    const newStart = Array.from(startCol);
    newStart.splice(source.index, 1);
    const newEnd = Array.from(endCol);
    newEnd.splice(destination.index, 0, movedTicket);

    setColumns({
      ...columns,
      [source.droppableId]: newStart,
      [destination.droppableId]: newEnd
    });

    // Update Status API
    await api.patch(`/tickets/${movedTicket.id}/status`, { status: destination.droppableId });
    
    // Trigger upload modal if dropped in review
    if (destination.droppableId === "review" && !movedTicket.result_link) {
      setSelectedTicket(movedTicket);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedTicket) return;
    setUploading(true);
    try {
      // 1. Get Presigned URL
      const urlRes = await api.get(`/s3/presigned-url?filename=${encodeURIComponent(uploadFile.name)}&content_type=${encodeURIComponent(uploadFile.type)}`);
      
      // 2. Upload to S3
      await s3Upload(uploadFile, urlRes.data.upload_url);
      
      // 3. Update Result Link
      await api.patch(`/tickets/${selectedTicket.id}/result`, { result_link: urlRes.data.public_url });
      
      setSelectedTicket(null);
      setUploadFile(null);
      fetchTickets();
    } catch(e) {
      console.error(e);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Design Board</h2>
        <p className="text-muted-foreground mt-1 text-sm">Drag tasks across columns to update their status.</p>
      </div>

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
               <Droppable droppableId={col.id}>
                 {(provided, snapshot) => (
                   <div 
                     {...provided.droppableProps}
                     ref={provided.innerRef}
                     className={`flex-1 p-3 flex flex-col gap-3 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                   >
                     {columns[col.id]?.map((ticket, index) => (
                       <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                         {(provided, snapshot) => (
                           <div
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             {...provided.dragHandleProps}
                             className={`p-4 rounded-xl border border-border shadow-lg select-none transition-all ${
                               snapshot.isDragging ? 'bg-[#1a1528] shadow-[0_0_20px_rgba(168,85,247,0.3)] border-primary/50 rotate-2' : 'bg-foreground/5 hover:bg-foreground/10'
                             }`}
                           >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-foreground leading-tight">{ticket.title}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                                {ticket.description}
                              </p>
                              
                              <div className="flex justify-between items-center text-xs">
                                <div className="text-primary font-medium bg-primary/10 px-2 py-1 rounded-md">
                                  ${ticket.price}
                                </div>
                                {ticket.result_link && (
                                  <a href={ticket.result_link} target="_blank" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> Result
                                  </a>
                                )}
                              </div>
                           </div>
                         )}
                       </Draggable>
                     ))}
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* S3 Upload Modal when moving to Review */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-3xl border border-border p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Upload Final Design</h3>
            <p className="text-sm text-muted-foreground mb-6">You're submitting {" "}
              <b className="text-foreground">{selectedTicket.title}</b>. Upload your file directly to AWS S3.
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
                onClick={() => setSelectedTicket(null)}
              >
                Skip for now
              </button>
              <button 
                disabled={!uploadFile || uploading}
                onClick={handleUploadSubmit}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload to S3"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
