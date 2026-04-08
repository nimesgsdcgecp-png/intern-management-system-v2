"use client";

import React from "react";
import Link from "next/link";

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

/**
 * QuickActionCard using Design System v2.0 tokens.
 * Uses .card-interactive for clickable card behavior.
 */
export function QuickActionCard({
  icon,
  label,
  href,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className="card card-interactive p-6 flex flex-col items-center justify-center gap-4 h-full text-center">
        <div className="w-14 h-14 rounded-lg bg-primary-subtle flex items-center justify-center text-primary-text">
          {icon}
        </div>
        <span className="font-medium text-content-primary text-sm">{label}</span>
      </div>
    </Link>
  );
}
