"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Plus,
  UserPlus,
  Handshake,
  CalendarPlus,
  FileEdit,
  Menu,
  Building2,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";

interface HeaderProps {
  workspace?: {
    id: string;
    name: string;
  };
}

export function Header({ workspace }: HeaderProps) {
  const { setCommandMenuOpen, toggleMobileMenu, sidebarCollapsed } = useUIStore();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobileMenu}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setCommandMenuOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline-flex">Search...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/contacts/new">
                <UserPlus className="mr-2 h-4 w-4" />
                New Contact
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/pipelines/deals/new">
                <Handshake className="mr-2 h-4 w-4" />
                New Deal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/calendar/new">
                <CalendarPlus className="mr-2 h-4 w-4" />
                New Appointment
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/campaigns/new">
                <FileEdit className="mr-2 h-4 w-4" />
                New Campaign
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <Button variant="ghost" size="sm" className="text-xs">
                Mark all read
              </Button>
            </div>
            <div className="py-2">
              <NotificationItem
                title="New lead assigned"
                description="John Smith has been assigned to you"
                time="5 min ago"
                unread
              />
              <NotificationItem
                title="Deal moved to Negotiation"
                description="Acme Corp deal updated by Sarah"
                time="1 hour ago"
                unread
              />
              <NotificationItem
                title="Appointment reminder"
                description="Call with Mike Johnson in 30 minutes"
                time="2 hours ago"
                unread
              />
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-center text-sm">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Workspace switcher */}
        {workspace && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hidden lg:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <span className="max-w-[120px] truncate text-sm">
                  {workspace.name}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground">Current workspace</p>
                <p className="font-medium">{workspace.name}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Switch workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

function NotificationItem({
  title,
  description,
  time,
  unread,
}: {
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
        unread && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "mt-1 h-2 w-2 rounded-full shrink-0",
          unread ? "bg-primary" : "bg-transparent"
        )}
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
