"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <main
      className={cn(
        "min-h-[calc(100vh-3.5rem)] transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      <div className={cn("container py-6 px-4 md:px-6 lg:px-8", className)}>
        {children}
      </div>
    </main>
  );
}

interface ShellHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ShellHeader({ children, className }: ShellHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {children}
    </div>
  );
}

interface ShellContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ShellContent({ children, className }: ShellContentProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}
