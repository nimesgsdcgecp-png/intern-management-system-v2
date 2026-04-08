"use client";

import React, { useState } from 'react';
import { Bell, Trash2, Calendar, ChevronRight, Zap, Target, Plus } from 'lucide-react';
import { QuickViewModal } from './QuickViewModal';

interface Notification {
  id: string;
  title: string;
  desc: string;
  type: 'task' | 'intern' | 'mentor' | 'system';
  time: string;
  read: boolean;
  action?: {
    label: string;
    entityId: string;
    entityType: 'intern' | 'mentor' | 'task';
  };
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Directive Staged',
    desc: 'Database Migration strategy has been moved to Executing state.',
    type: 'task',
    time: '2m ago',
    read: false,
    action: { label: 'Review Directive', entityId: 'task-db-mig', entityType: 'task' }
  },
  {
    id: '2',
    title: 'New Candidate Registered',
    desc: 'Sarah Jenkins has completed the onboard profile sequence.',
    type: 'intern',
    time: '15m ago',
    read: false,
    action: { label: 'Audit Profile', entityId: 'intern-sj', entityType: 'intern' }
  },
  {
    id: '3',
    title: 'System Optimization',
    desc: 'Bulk archival sweep completed for Q1 technical logs.',
    type: 'system',
    time: '1h ago',
    read: true,
  }
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [quickViewEntity, setQuickViewEntity] = useState<{ id: string, type: 'intern' | 'mentor' | 'task' } | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <Zap className="w-4 h-4 text-primary-text" />;
      case 'intern': return <Target className="w-4 h-4 text-success-text" />;
      case 'mentor': return <Plus className="w-4 h-4 text-info-text" />;
      default: return <Calendar className="w-4 h-4 text-warning-text" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'task': return 'bg-primary-subtle';
      case 'intern': return 'bg-success-subtle';
      case 'mentor': return 'bg-info-subtle';
      default: return 'bg-warning-subtle';
    }
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-icon relative"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing origin-top' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary border-2 border-surface-card rounded-full flex items-center justify-center text-[10px] font-semibold text-inverse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="sidebar-overlay open" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-96 bg-surface-overlay border border-border-default shadow-overlay rounded-lg z-50 overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border-default flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-content-muted uppercase tracking-wide">Alerts</span>
                <p className="text-lg font-bold text-content-primary">Notifications</p>
              </div>
              <button onClick={markAllRead} className="btn btn-ghost btn-sm">Mark all read</button>
            </div>

            <div className="max-h-[400px] overflow-y-auto flex flex-col p-2 space-y-1">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`p-3 rounded-lg hover:bg-surface-muted transition-all cursor-pointer relative ${!n.read ? 'bg-primary-subtle/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg h-max shrink-0 ${getIconBg(n.type)}`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="text-sm font-semibold text-content-primary leading-tight truncate">{n.title}</h4>
                          <span className="text-xs text-content-muted whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-content-secondary leading-relaxed mb-2">{n.desc}</p>
                        
                        {n.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewEntity({ id: n.action!.entityId, type: n.action!.entityType });
                              markRead(n.id);
                              setIsOpen(false);
                            }}
                            className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                          >
                            {n.action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {!n.read && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />}
                  </div>
                ))
              ) : (
                <div className="py-12 px-8 text-center">
                  <div className="w-12 h-12 bg-surface-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-6 h-6 text-content-muted" />
                  </div>
                  <p className="text-sm font-medium text-content-secondary">No notifications</p>
                  <p className="text-xs text-content-muted mt-1">You&apos;re all caught up!</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface-muted border-t border-border-default flex justify-center">
                <button onClick={clearAll} className="btn btn-ghost btn-sm text-content-muted hover:text-error flex items-center gap-2">
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
            </div>
          </div>
        </>
      )}

      <QuickViewModal 
        isOpen={!!quickViewEntity}
        onClose={() => setQuickViewEntity(null)}
        entityId={quickViewEntity?.id || null}
        entityType={quickViewEntity?.type || null}
      />
    </div>
  );
}
