"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useSidebar } from "@/lib/redux/hooks";
import { toggleSidebar } from "@/lib/redux/slices/uiSlice";

import {
  LayoutDashboard,
  Users,
  UserCheck,
  CheckSquare,
  FileText,
  PlusCircle,
  BarChart3,
  User,
  Menu,
  ClipboardList,
  CalendarDays,
  CalendarCheck,
  Building,
  Building2,
} from "lucide-react";


interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}



export function Sidebar() {
  const { data: session } = useSession();

  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isCollapsed, deviceType } = useSidebar();
  const role = (session?.user as { role: string })?.role;



  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const getNavLinks = (): NavLink[] => {
    if (role === "admin") {
      return [
        {
          href: "/dashboard/admin",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/interns",
          label: "Interns",
          icon: <Users className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/mentors",
          label: "Mentors",
          icon: <UserCheck className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/departments",
          label: "Departments",
          icon: <Building2 className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/tasks",
          label: "Tasks",
          icon: <CheckSquare className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/reports",
          label: "Reports",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/logs",
          label: "Logs",
          icon: <ClipboardList className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/attendance",
          label: "Attendance",
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          href: "/dashboard/calendar",
          label: "Calendar",
          icon: <CalendarDays className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/import",
          label: "Import",
          icon: <PlusCircle className="w-5 h-5" />,
        },
      ];
    }
    if (role === "mentor") {
      return [
        {
          href: "/dashboard/mentor",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          href: "/dashboard/mentor/interns",
          label: "My Interns",
          icon: <Users className="w-5 h-5" />,
        },
        {
          href: "/dashboard/mentor/tasks",
          label: "Manage Tasks",
          icon: <CheckSquare className="w-5 h-5" />,
        },
        {
          href: "/dashboard/mentor/reports",
          label: "View Reports",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          href: "/dashboard/admin/attendance",
          label: "Attendance Monitor",
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          href: "/dashboard/calendar",
          label: "Event Calendar",
          icon: <CalendarDays className="w-5 h-5" />,
        },
        {
          href: "/profile",
          label: "Profile Settings",
          icon: <User className="w-5 h-5" />,
        },
      ];
    }
    if (role === "intern") {
      return [
        {
          href: "/dashboard/intern",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          href: "/dashboard/intern/tasks",
          label: "My Tasks",
          icon: <CheckSquare className="w-5 h-5" />,
        },
        {
          href: "/dashboard/intern/submit-report",
          label: "Submit Report",
          icon: <FileText className="w-5 h-5" />,
        },
        {
          href: "/dashboard/intern/reports",
          label: "View Reports",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          href: "/dashboard/intern/attendance",
          label: "Attendance History",
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          href: "/dashboard/calendar",
          label: "Event Calendar",
          icon: <CalendarDays className="w-5 h-5" />,
        },
        {
          href: "/profile",
          label: "Profile Settings",
          icon: <User className="w-5 h-5" />,
        },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <aside
        className={`sidebar ${deviceType === 'mobile' && !isCollapsed ? 'open' : ''}`}
        style={isCollapsed && deviceType !== 'mobile' ? { width: '80px' } : undefined}
        id="sidebar"
      >
        {/* Header */}
        <div className={`sidebar-header ${isCollapsed ? 'flex-col justify-center items-center py-4 gap-4' : 'gap-4 p-4 items-center'}`}>
          <button
            onClick={handleToggleSidebar}
            className="btn btn-ghost btn-icon text-content-nav-muted hover:text-content-nav shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isCollapsed ? (
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shrink-0 animate-fade-in mx-auto shadow-md">
              <Building className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-fade-in overflow-hidden shrink-0">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-[120px]">
                <span className="text-xs font-semibold text-content-nav uppercase tracking-wide truncate">
                  Intern
                </span>
                <span className="text-xs text-content-nav-muted truncate">
                  Management
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-body">
          <div className="sidebar-section">
            {!isCollapsed && (
              <p className="sidebar-section-label">Navigation</p>
            )}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? link.label : undefined}
                >
                  {link.icon}
                  {!isCollapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="avatar avatar-md bg-surface-muted text-content-nav">
              {session?.user?.name?.charAt(0) || "A"}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-content-nav truncate">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-content-nav-muted capitalize">
                  {role || "User"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {deviceType === 'mobile' && !isCollapsed && (
        <div
          className="sidebar-overlay open"
          id="sidebar-overlay"
          onClick={handleToggleSidebar}
        />
      )}
    </>
  );
}
