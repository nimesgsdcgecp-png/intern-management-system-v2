"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Clock, 
  Tag,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  type: "company" | "department";
  department?: string;
  creator?: {
    profile: {
      name: string;
    };
  };
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    type: "company" | "department";
    departmentId: string;
  }>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "company",
    departmentId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, [fetchEvents, fetchDepartments]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderHeader = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <p className="text-sm text-content-secondary">Manage and view scheduled events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevMonth} className="rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-xl">
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={nextMonth} className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {session?.user?.role !== "intern" && (
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="ml-2 gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-content-muted uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const cells = [];

    // Empty cells for the start of the month
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 border border-border-subtle/30 bg-surface-muted/10" />);
    }

    // Days with events
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.start_time.startsWith(dateString));
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      cells.push(
        <div 
          key={day} 
          className={`h-32 border border-border-subtle/50 p-2 relative hover:bg-surface-secondary/50 transition-colors group ${isToday ? 'bg-primary/5' : ''}`}
        >
          <span className={`text-sm font-semibold ${isToday ? 'bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-content-secondary'}`}>
            {day}
          </span>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
            {dayEvents.map((event) => (
              <motion.div
                layoutId={event.id}
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`text-[10px] p-1 rounded-md cursor-pointer truncate font-medium border
                  ${event.type === 'company' 
                    ? 'bg-blue-500/10 text-blue-600 border-blue-200' 
                    : 'bg-purple-500/10 text-purple-600 border-purple-200'}`}
              >
                {event.title}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 rounded-2xl overflow-hidden border border-border shadow-sm">{cells}</div>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-8 backdrop-blur-md bg-surface/80">
          {renderHeader()}
          {renderDays()}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg" />
              </div>
            )}
            {renderCells()}
          </div>
        </Card>

        <AnimatePresence>
          {isAddModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-4"
              >
                <Card className="p-8 shadow-2xl rounded-3xl border-none">
                  <h2 className="text-2xl font-bold text-content-primary mb-6">Create New Event</h2>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    try {
                      const res = await fetch("/api/events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newEvent)
                      });
                      if (res.ok) {
                        setIsAddModalOpen(false);
                        setNewEvent({
                          title: "",
                          description: "",
                          startTime: "",
                          endTime: "",
                          location: "",
                          type: "company",
                          departmentId: ""
                        });
                        fetchEvents();
                      }
                    } catch (error) {
                      console.error("Failed to create event:", error);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="w-full p-3 rounded-xl border border-border bg-surface-nav/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Event title"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Start Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={newEvent.startTime}
                          onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border bg-surface-nav/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">End Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={newEvent.endTime}
                          onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border bg-surface-nav/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-1">Type</label>
                      <select
                        value={newEvent.type}
                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as "company" | "department" })}
                        className="w-full p-3 rounded-xl border border-border bg-surface-nav/30"
                      >
                        <option value="company">Company Wide</option>
                        <option value="department">Department Specific</option>
                      </select>
                    </div>

                    {newEvent.type === "department" && (
                      <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Department</label>
                        <select
                          required
                          value={newEvent.departmentId}
                          onChange={(e) => setNewEvent({ ...newEvent, departmentId: e.target.value })}
                          className="w-full p-3 rounded-xl border border-border bg-surface-nav/30"
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-1">Location</label>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        className="w-full p-3 rounded-xl border border-border bg-surface-nav/30"
                        placeholder="e.g. Main Hall or Zoom Link"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full p-3 rounded-xl border border-border bg-surface-nav/30 h-24"
                        placeholder="Event description..."
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </>
          )}

          {selectedEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvent(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                layoutId={selectedEvent.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-4"
              >
                <Card className="p-8 shadow-2xl rounded-3xl border-none">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4
                    ${selectedEvent.type === 'company' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                    <Tag className="w-3 h-3" />
                    {selectedEvent.type === 'company' ? 'Company Event' : `Department: ${selectedEvent.department}`}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-content-primary mb-4">{selectedEvent.title}</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-content-secondary">
                      <div className="p-2 bg-surface-nav rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {new Date(selectedEvent.start_time).toLocaleString()} - {new Date(selectedEvent.end_time).toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-3 text-content-secondary">
                        <div className="p-2 bg-surface-nav rounded-lg">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{selectedEvent.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-content-secondary">
                      <div className="p-2 bg-surface-nav rounded-lg">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">Created by {selectedEvent.creator?.profile.name || "System"}</span>
                    </div>
                  </div>

                  <p className="text-content-secondary leading-relaxed mb-8 bg-surface-nav/30 p-4 rounded-2xl italic">
                    {selectedEvent.description || "No description provided."}
                  </p>

                  <div className="flex justify-end">
                    <Button onClick={() => setSelectedEvent(null)} className="rounded-xl px-8">
                      Close
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
