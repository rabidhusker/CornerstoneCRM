"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ChevronsUpDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Contacts", href: "/dashboard/contacts", icon: Users },
      { label: "Pipelines", href: "/dashboard/pipelines", icon: Kanban },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { label: "Automation", href: "/dashboard/automation", icon: Workflow },
      { label: "Forms", href: "/dashboard/forms", icon: FileText },
      { label: "Landing Pages", href: "/dashboard/pages", icon: Globe },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
      { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
    ],
  },
];

interface SidebarProps {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
}

export function Sidebar({ user, workspace }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const userInitials = React.useMemo(() => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  }, [user]);

  const userName = React.useMemo(() => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }, [user]);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 font-semibold",
              sidebarCollapsed && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg tracking-tight">CSTG CRM</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={cn(sectionIndex > 0 && "mt-4")}>
              {!sidebarCollapsed && (
                <p className="mb-1 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));

                  const navLink = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{navLink}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Settings link */}
        <div className="p-2">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard/settings")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          )}
        </div>

        <Separator />

        {/* User section */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 px-2",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={userName} />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex flex-col items-start text-left flex-1 overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">
                        {userName}
                      </span>
                      {workspace && (
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {workspace.name}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={sidebarCollapsed ? "center" : "end"}
              side="top"
              className="w-56"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Collapse toggle */}
        <div className="absolute -right-3 top-6">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
