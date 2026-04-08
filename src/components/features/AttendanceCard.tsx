"use client";

import React, { useState, useEffect } from "react";
import { Clock, Play, Square, Loader2, CheckCircle2, AlertCircle, Timer } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface AttendanceRecord {
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
}

export function AttendanceCard() {
  const [status, setStatus] = useState<"idle" | "clocked-in" | "clocked-out" | "loading">("loading");
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/attendance");
      const data = await response.json();

      if (data) {
        setRecord(data);
        if (data.clock_out) {
          setStatus("clocked-out");
        } else {
          setStatus("clocked-in");
        }
      } else {
        setStatus("idle");
      }
    } catch {
      setError("Failed to load attendance status.");
      setStatus("idle");
    }
  };

  useEffect(() => {
    // Calling fetchStatus in a microtask to avoid synchronous setState warning
    const loadStatus = async () => {
      await fetchStatus();
    };
    loadStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "clocked-in" && record?.clock_in) {
      interval = setInterval(() => {
        const start = new Date(record.clock_in).getTime();
        const now = new Date().getTime();
        const diff = now - start;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        setElapsedTime(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, record]);

  const handleClockAction = async (action: "clock-in" | "clock-out") => {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchStatus();
      } else {
        setError(data.error || "Action failed.");
        await fetchStatus();
      }
    } catch {
      setError("An error occurred.");
      setStatus("idle");
    }
  };

  if (status === "loading" && !record) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-content-muted">Fetching today&apos;s logs...</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 relative overflow-hidden">
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-content-primary">Day Operations</h3>
            <p className="text-xs text-content-muted font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status === 'clocked-in' ? 'bg-success animate-pulse' : 'bg-surface-muted'}`} />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary-subtle text-primary-text flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {status === "idle" ? (
          <div className="flex flex-col gap-6 py-4 animate-fade-in">
            <div className="p-8 bg-surface-muted rounded-lg flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-content-muted mb-2">Ready to start?</p>
              <h4 className="text-lg font-bold text-content-primary">Check-in for today</h4>
            </div>
            <Button
              onClick={() => handleClockAction("clock-in")}
              size="lg"
              className="w-full"
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              Punch In Now
            </Button>
          </div>
        ) : status === "clocked-in" ? (
          <div className="flex flex-col gap-6 py-4 animate-fade-in">
            <div className="p-8 bg-primary rounded-lg flex flex-col items-center justify-center text-center shadow-medium text-inverse">
              <div className="flex items-center gap-2 mb-2 opacity-80 font-medium text-xs">
                <Timer className="w-3 h-3" />
                Active Session
              </div>
              <h4 className="text-4xl font-bold tracking-tight mb-1">{elapsedTime}</h4>
              <p className="text-xs opacity-80">Keep it up!</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => handleClockAction("clock-out")}
              size="lg"
              className="w-full"
              icon={<Square className="w-5 h-5 fill-current" />}
            >
              Punch Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4 animate-fade-in">
            <div className="p-8 bg-success-subtle border border-success-subtle rounded-lg flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-success mb-4" />
              <h4 className="text-lg font-bold text-content-primary">Work Day Recorded</h4>
              <p className="text-sm font-medium text-success-text mt-1">Total Hours: {record?.total_hours}</p>
              <p className="text-xs text-content-muted mt-4">See you tomorrow!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
