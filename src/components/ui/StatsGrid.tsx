import React from "react";
import { StatCard } from "./StatCard";
import { StatCardSkeleton } from "./Skeleton";

interface Stat {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}

interface StatsGridProps {
  stats: Stat[];
  loading?: boolean;
}

/**
 * StatsGrid component using Design System v2.0 tokens.
 * Uses .stats-grid class for auto-responsive KPI grid layout.
 */
export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading) {
    return (
      <div className="stats-grid section">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid section">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
