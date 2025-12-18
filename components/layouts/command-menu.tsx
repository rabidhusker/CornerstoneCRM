"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Megaphone,
  Workflow,
  FileText,
  Globe,
  MessageSquare,
  Calendar,
  BarChart3,
  FileBarChart,
  Settings,
  UserPlus,
  Handshake,
  CalendarPlus,
  FileEdit,
  Search,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";

interface CommandItem {
  label: string;
  href?: string;
  action?: () => void;
  icon: React.ElementType;
  shortcut?: string;
}

const navigationItems: CommandItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users },
  { label: "Pipelines", href: "/dashboard/pipelines", icon: Kanban },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Automation", href: "/dashboard/automation", icon: Workflow },
  { label: "Forms", href: "/dashboard/forms", icon: FileText },
  { label: "Landing Pages", href: "/dashboard/landing-pages", icon: Globe },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const quickActions: CommandItem[] = [
  { label: "New Contact", href: "/dashboard/contacts/new", icon: UserPlus, shortcut: "C" },
  { label: "New Deal", href: "/dashboard/pipelines/deals/new", icon: Handshake, shortcut: "D" },
  { label: "New Appointment", href: "/dashboard/calendar/new", icon: CalendarPlus, shortcut: "A" },
  { label: "New Campaign", href: "/dashboard/campaigns/new", icon: FileEdit },
];

export function CommandMenu() {
  const router = useRouter();
  const { commandMenuOpen, setCommandMenuOpen } = useUIStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen(!commandMenuOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandMenuOpen, setCommandMenuOpen]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setCommandMenuOpen(false);
      command();
    },
    [setCommandMenuOpen]
  );

  return (
    <CommandDialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => {
                if (item.href) {
                  runCommand(() => router.push(item.href!));
                } else if (item.action) {
                  runCommand(item.action);
                }
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  {item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => {
                if (item.href) {
                  runCommand(() => router.push(item.href!));
                }
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          <CommandItem
            onSelect={() => {
              runCommand(() => router.push("/dashboard/contacts?search=true"));
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Contacts</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              runCommand(() => router.push("/dashboard/pipelines?search=true"));
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Deals</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
