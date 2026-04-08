"use client";

import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { ChatWidget } from "../features/ChatWidget";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebar, useAppDispatch } from "../../lib/redux/hooks";
import { toggleSidebar } from "../../lib/redux/slices/uiSlice";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout using Design System v2.0 tokens.
 * Uses .page-wrapper, .page-content classes for layout structure.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const { isCollapsed, deviceType } = useSidebar();

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (deviceType === 'mobile' && !isCollapsed) {
      dispatch(toggleSidebar());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleOverlayClick = () => {
    if (deviceType === 'mobile' && !isCollapsed) {
      dispatch(toggleSidebar());
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-app">
        <div className="text-center">
          <div className="spinner spinner-lg mb-4 mx-auto"></div>
          <p className="text-content-muted text-sm">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Calculate main content margin based on sidebar state and device
  const contentMargin = deviceType === 'mobile' 
    ? '0px' 
    : isCollapsed ? '80px' : '240px';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-app">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {deviceType === 'mobile' && !isCollapsed && (
        <div 
          className="sidebar-overlay open"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-app">
          <div className="page-content max-w-[1600px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* AI Chat Assistant - restricted to Admin role */}
      {(session?.user as { role?: string })?.role === 'admin' && <ChatWidget />}
    </div>
  );
}
