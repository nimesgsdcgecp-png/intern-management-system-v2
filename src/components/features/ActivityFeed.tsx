"use client";

import React, { useState, useEffect } from "react";
import { 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText, 
  Target,
  Loader2,
  Calendar
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  created_at: string;
  user?: {
    profile?: {
      name?: string;
    };
  };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  "Bulk imported user": <UserPlus className="w-4 h-4" />,
  "Clocked In": <Clock className="w-4 h-4" />,
  "Clocked Out": <CheckCircle2 className="w-4 h-4" />,
  "Report Submitted": <FileText className="w-4 h-4" />,
  "Task Created": <PlusCircleIcon />,
  "Feedback Provided": <MessageSquare className="w-4 h-4" />,
  "default": <Target className="w-4 h-4" />
};

function PlusCircleIcon() {
    return <Target className="w-4 h-4" />;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activity?limit=10");
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (_err) {
      console.error("Failed to fetch activity:", _err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (action: string) => {
    for (const key in ACTION_ICONS) {
      if (action.includes(key)) return ACTION_ICONS[key];
    }
    return ACTION_ICONS.default;
  };

  const getIconStyle = (action: string) => {
    if (action.includes('Clocked In')) return 'bg-success-subtle text-success-text';
    if (action.includes('Clocked Out')) return 'bg-primary-subtle text-primary-text';
    if (action.includes('Import')) return 'bg-info-subtle text-info-text';
    return 'bg-surface-muted text-content-secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-content-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.length === 0 ? (
        <div className="py-12 text-center bg-surface-muted rounded-lg border border-dashed border-border-default">
          <Calendar className="w-8 h-8 text-content-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wide">No recent activity</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex gap-4 relative animate-fade-in-up"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {/* Activity Line */}
            {index < activities.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border-subtle" />
            )}
            
            {/* Icon Bubble */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 z-10 ${getIconStyle(activity.action)}`}>
              {getIcon(activity.action)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-sm font-semibold text-content-primary truncate leading-tight">
                  <span className="text-primary-text">{activity.user?.profile?.name || "Someone"}</span>
                </p>
                <span className="text-xs text-content-muted shrink-0 mt-0.5">
                  {getTimeAgo(activity.created_at)}
                </span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed line-clamp-2">
                {activity.action}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
