"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Search, User, Building, LogOut, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from 'next-themes';
import { useAppDispatch, useSidebar } from "../../lib/redux/hooks";
import { toggleSidebar } from "../../lib/redux/slices/uiSlice";

/**
 * DashboardHeader using Design System v2.0 tokens.
 * Uses .page-header class pattern with semantic tokens.
 */
export function DashboardHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string, name?: string, title?: string, type: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dispatch = useAppDispatch();
  const { isCollapsed, deviceType } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.results || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <header className="page-header">
      {/* Left Side - Mobile Menu + Brand (only when sidebar collapsed) */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        {deviceType === 'mobile' && (
          <button
            onClick={handleToggleSidebar}
            className="btn btn-ghost btn-icon md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Show brand only when sidebar is collapsed (desktop) or on mobile */}
        {(isCollapsed || deviceType === 'mobile') && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-primary leading-none">
                Intern Management
              </h2>
              <p className="text-xs font-medium text-primary/80 mt-0.5">
                System
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global Search - Admin Only */}
      {((session?.user as { role: string })?.role === 'admin') && (
        <div className="hidden md:block flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search interns, mentors, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="input has-icon-left has-icon-right w-full"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="spinner spinner-sm"></span>
              </div>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-overlay border border-border-default rounded-lg shadow-overlay z-50 py-2">
              {suggestions.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-surface-muted transition-colors text-left"
                  onClick={() => {
                    setQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary-text flex items-center justify-center">
                    {item.type === 'intern' ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-content-primary">{item.name || item.title}</div>
                    <div className="text-xs text-content-secondary capitalize">{item.type}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-ghost btn-icon"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2">
          <div className="avatar avatar-md bg-primary text-inverse">
            {session?.user?.name?.charAt(0) || "A"}
          </div>

          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium text-content-primary">
              {session?.user?.name || "User"}
            </div>
            <div className="text-xs text-content-secondary">
              <span className="capitalize">{(session?.user as { role: string }).role || "User"}</span>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="btn btn-ghost btn-icon text-error hover:bg-error-subtle"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
