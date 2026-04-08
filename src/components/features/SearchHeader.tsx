"use client";

interface SearchHeaderProps {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function SearchHeader({ title, children, actions }: SearchHeaderProps) {
  return (
    <div className="page-header mb-6">
      <div className="flex flex-col gap-2 max-w-[1600px] mx-auto">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-lg font-bold text-content-primary">{title}</h1>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {children && (
          <div className="bg-surface-muted rounded-lg border border-border-default p-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
