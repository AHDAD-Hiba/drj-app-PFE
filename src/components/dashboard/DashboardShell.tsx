import type { ReactNode } from "react";

interface DashboardShellProps {
  children?: ReactNode;
  className?: string;
}

export const DashboardShell = ({
  children,
  className = "",
}: DashboardShellProps) => {
  return (
    <div className={`space-y-8 animate-fade-in ${className}`.trim()}>
      {children}
    </div>
  );
};
