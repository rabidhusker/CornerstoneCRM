"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Mail,
  MessageSquare,
  Inbox,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  useMarkConversationRead,
} from "@/lib/hooks/use-conversations";
import { ConversationList } from "@/components/features/conversations/conversation-list";
import { ConversationView } from "@/components/features/conversations/conversation-view";
import { ConversationSidebar } from "@/components/features/conversations/conversation-sidebar";
import type {
  ConversationChannel,
  ConversationStatus,
  ConversationFilters,
} from "@/types/conversation";

const channelOptions: { value: ConversationChannel | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All Channels", icon: <Inbox className="h-4 w-4" /> },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
];

const statusOptions: { value: ConversationStatus | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All Status", icon: <Inbox className="h-4 w-4" /> },
  { value: "open", label: "Open", icon: <Inbox className="h-4 w-4" /> },
  { value: "closed", label: "Closed", icon: <CheckCircle className="h-4 w-4" /> },
  { value: "snoozed", label: "Snoozed", icon: <Clock className="h-4 w-4" /> },
];

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get selected conversation from URL
  const selectedId = searchParams.get("id");

  // Filter state
  const [channel, setChannel] = React.useState<ConversationChannel | "all">("all");
  const [status, setStatus] = React.useState<ConversationStatus | "all">("open");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Build filters
  const filters: ConversationFilters = React.useMemo(() => {
    const f: ConversationFilters = {};
    if (channel !== "all") f.channel = [channel];
    if (status !== "all") f.status = [status];
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [channel, status, debouncedSearch]);

  // Fetch conversations
  const {
    data: conversations,
    isLoading,
    refetch,
    isRefetching,
  } = useConversations(filters);

  const markReadMutation = useMarkConversationRead();

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    router.push(`/dashboard/conversations?id=${conversationId}`);
    // Mark as read when selected
    markReadMutation.mutate(conversationId);
  };

  // Stats
  const openCount = conversations?.filter((c) => c.status === "open").length || 0;
  const unreadCount = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List Panel */}
      <div className="w-80 border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Inbox</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefetching && "animate-spin")}
              />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Open:</span>{" "}
              <Badge variant="secondary">{openCount}</Badge>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Unread:</span>{" "}
              <Badge variant="default">{unreadCount}</Badge>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as ConversationChannel | "all")}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ConversationStatus | "all")}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelectConversation}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations found</p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search"
                  : "Conversations will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation View Panel */}
      <div className="flex-1 flex">
        {selectedId ? (
          <>
            <ConversationView conversationId={selectedId} />
            <ConversationSidebar conversationId={selectedId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">Select a conversation</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Choose a conversation from the list to view messages and reply to
              your contacts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
