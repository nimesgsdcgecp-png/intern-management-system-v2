"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { 
  Building2, Mail, Calendar, 
  GraduationCap, User, CheckSquare, 
  Clock, AlertCircle, ArrowUpRight,
  Edit3, BadgeCheck, Hourglass
} from 'lucide-react';
import { Button } from '../ui/Button';
import Link from 'next/link';
import { showToast } from '@/lib/notifications';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  entityType: 'intern' | 'mentor' | 'task' | null;
  onEdit?: (id: string) => void;
}

interface EntityData {
  id: string;
  title?: string;
  email?: string;
  status?: string;
  created_at: string;
  deadline?: string;
  assigned_by?: string;
  priority?: string;
  profile?: {
    name?: string | null;
    department?: string | null;
  } | null;
  intern?: {
    status?: string;
    start_date?: string | null;
    profile_verified?: boolean;
    profile_verified_by?: string | null;
    profile_verified_at?: string | null;
  } | null;
  canVerifyProfile?: boolean;
  profileVerifiedByName?: string;
}

export function QuickViewModal({ isOpen, onClose, entityId, entityType, onEdit }: QuickViewModalProps) {
  const [data, setData] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!entityId || !entityType) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/details?id=${entityId}&type=${entityType}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error("Quick view details failed:", err);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (isOpen && entityId && entityType) {
      fetchDetails();
    } else {
      setData(null);
    }
  }, [isOpen, entityId, entityType, fetchDetails]);

  const handleVerifyProfile = async () => {
    if (!entityId) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/interns/${entityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_profile" }),
      });
      if (!res.ok) {
        const error = await res.json();
        showToast(error?.error || "Failed to verify profile", "error");
        return;
      }
      showToast("Intern profile verified", "success");
      await fetchDetails();
    } catch {
      showToast("Failed to verify profile", "error");
    } finally {
      setVerifying(false);
    }
  };

  const getHref = () => {
    if (entityType === 'intern') return '/dashboard/admin/interns';
    if (entityType === 'mentor') return '/dashboard/admin/mentors';
    if (entityType === 'task') return '/dashboard/admin/tasks';
    return '#';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : 'User'} Overview`}
      size="md"
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="spinner spinner-lg" />
          <p className="text-xs font-medium text-content-muted">Loading details...</p>
        </div>
      ) : data ? (
        <div className="space-y-6 animate-fade-in-up">
          {/* Header Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
              {entityType === 'intern' ? <User className="w-8 h-8 text-primary-text" /> :
               entityType === 'mentor' ? <GraduationCap className="w-8 h-8 text-primary-text" /> :
               <CheckSquare className="w-8 h-8 text-primary-text" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="text-xl font-bold text-content-primary leading-tight mb-2 truncate">
                {entityType === 'task' ? data.title : data.profile?.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary">
                  {(data.intern?.status || data.status || 'Active').toUpperCase()}
                </span>
                {entityType === "intern" && (
                  <span
                    className={`badge ${data.intern?.profile_verified ? "badge-success" : "badge-warning"}`}
                    title={
                      data.intern?.profile_verified
                        ? `Verified by ${data.profileVerifiedByName || "User"} on ${data.intern?.profile_verified_at ? new Date(data.intern.profile_verified_at).toLocaleString() : "N/A"}`
                        : "Pending verification"
                    }
                  >
                    {data.intern?.profile_verified ? <BadgeCheck className="w-3 h-3" /> : <Hourglass className="w-3 h-3" />}
                    {data.intern?.profile_verified ? "Verified" : "Pending Verification"}
                  </span>
                )}
                <span className="badge badge-neutral">
                  ID: {data.id.split('-')[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border-default" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <DetailItem 
              icon={<Mail className="w-4 h-4" />} 
              label={entityType === 'task' ? 'Assigned By' : 'Email'} 
              value={(entityType === 'task' ? data.assigned_by?.split('-')[0] : data.email) || "N/A"} 
            />
            <DetailItem 
              icon={<Building2 className="w-4 h-4" />} 
              label={entityType === 'task' ? 'Priority' : 'Department'} 
              value={entityType === 'task' ? (data.priority || 'standard') : (data.profile?.department || 'N/A')} 
            />
            <DetailItem 
              icon={<Calendar className="w-4 h-4" />} 
              label={entityType === 'task' ? 'Created' : 'Start Date'} 
              value={entityType === 'task' ? (data.created_at ? new Date(data.created_at).toLocaleDateString() : "N/A") : (data.intern?.start_date || 'N/A')} 
            />
            <DetailItem 
              icon={<Clock className="w-4 h-4" />} 
              label={entityType === 'task' ? 'Deadline' : 'Position'} 
              value={(entityType === 'task' ? data.deadline : (entityType === 'intern' ? 'Junior Intern' : 'Senior Mentor')) || "N/A"} 
            />
          </div>

          {/* Call to Action */}
          <div className="pt-4 border-t border-border-default flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={getHref()} onClick={onClose}>
                <Button variant="secondary" className="flex items-center gap-2">
                  Go to Management <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              {onEdit && entityId && (
                <Button 
                  onClick={() => {
                    onClose();
                    onEdit(entityId);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Details
                </Button>
              )}
              {entityType === "intern" && data?.canVerifyProfile && (
                <Button onClick={handleVerifyProfile} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify Profile"}
                </Button>
              )}
            </div>
            <Button onClick={onClose} variant="ghost">Close</Button>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-content-muted mx-auto" />
          <p className="text-sm font-medium text-content-muted">Unable to load details.</p>
        </div>
      )}
    </Modal>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-content-muted">
        <span className="opacity-75">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-content-secondary truncate">{value}</p>
    </div>
  );
}
