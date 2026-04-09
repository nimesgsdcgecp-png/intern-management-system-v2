"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";

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
    profile: { name: string };
  };
}

interface Department {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "company" as "company" | "department",
    departmentId: "",
  });

  const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "mentor";

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
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
        setDepartments(data || []);
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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "company",
      departmentId: "",
    });
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location || "",
      type: event.type,
      departmentId: event.department || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        type: formData.type,
        departmentId: formData.type === "department" ? formData.departmentId : "",
      };

      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        await fetchEvents();
      }
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchEvents();
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
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

    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-28 border border-border-subtle bg-surface-muted/10" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.start_time.startsWith(dateString));
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      cells.push(
        <div
          key={day}
          className={`h-28 border border-border-subtle p-2 relative hover:bg-surface-muted/30 transition-colors ${
            isToday ? "bg-primary/5" : ""
          }`}
        >
          <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-content-secondary"}`}>
            {day}
          </span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
            {dayEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`text-[10px] px-1.5 py-0.5 rounded-md w-full text-left truncate border ${
                  event.type === "company"
                    ? "bg-blue-500/10 text-blue-600 border-blue-200"
                    : "bg-purple-500/10 text-purple-600 border-purple-200"
                }`}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 rounded-lg overflow-hidden border border-border">{cells}</div>;
  };

  const monthEvents = events.filter((e) => {
    const date = new Date(e.start_time);
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Calendar</h1>
            <p className="text-sm text-content-secondary mt-1">View and manage events and schedules</p>
          </div>
          {isPrivileged && (
            <Button onClick={handleCreateEvent} icon={<PlusCircle className="w-4 h-4" />}>
              Create Event
            </Button>
          )}
        </div>

        {/* Month Navigation */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
            <div>
              <Select
                label="Month"
                name="month"
                value={String(currentDate.getMonth())}
                onChange={(e) =>
                  setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1))
                }
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Select
                label="Year"
                name="year"
                value={String(currentDate.getFullYear())}
                onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2 text-content-secondary text-sm">
              <CalendarIcon className="w-4 h-4" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card p-6">
          {renderDays()}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-10 h-10" />
            </div>
          ) : (
            renderCells()
          )}
        </div>

        {/* Events List */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Events This Month</h2>
          {monthEvents.length === 0 ? (
            <p className="text-sm text-content-secondary">No events scheduled for this month.</p>
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthEvents.map((event) => (
                      <tr key={event.id} className="group transition-all hover:bg-surface-muted">
                        <td>{new Date(event.start_time).toLocaleDateString()}</td>
                        <td className="min-w-62.5">
                          <span className="font-semibold text-content-primary">{event.title}</span>
                        </td>
                        <td>
                          <span className={`badge ${event.type === "company" ? "badge-primary" : "badge-success"}`}>
                            {event.type === "company" ? "Company" : "Department"}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="btn btn-ghost btn-icon-edit"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isPrivileged && (
                              <>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="btn btn-ghost btn-icon-edit"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="btn btn-ghost btn-icon-delete"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEvent ? "Edit Event" : "Create Event"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              required
            />
            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
            />
            <Input
              label="Start Time"
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleFormChange}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleFormChange}
              required
            />
            <Select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
            >
              <option value="company">Company</option>
              <option value="department">Department</option>
            </Select>
            {formData.type === "department" && (
              <Select
                label="Department"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleFormChange}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <TextArea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-content-primary">{selectedEvent.title}</h3>
              <p className="text-sm text-content-secondary mt-1">{selectedEvent.description || "No description."}</p>
            </div>
            <div className="space-y-2 text-sm text-content-secondary">
              <p>
                <span className="font-semibold text-content-primary">Start:</span>{" "}
                {new Date(selectedEvent.start_time).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-content-primary">End:</span>{" "}
                {new Date(selectedEvent.end_time).toLocaleString()}
              </p>
              {selectedEvent.location && (
                <p>
                  <span className="font-semibold text-content-primary">Location:</span> {selectedEvent.location}
                </p>
              )}
              <p>
                <span className="font-semibold text-content-primary">Type:</span>{" "}
                {selectedEvent.type === "company" ? "Company" : "Department"}
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
