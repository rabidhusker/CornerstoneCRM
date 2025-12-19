"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Zap, Settings, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCannedResponses } from "@/lib/hooks/use-conversations";
import type { CannedResponse } from "@/types/conversation";

interface CannedResponsesProps {
  onSelect: (content: string) => void;
}

export function CannedResponses({ onSelect }: CannedResponsesProps) {
  const [search, setSearch] = React.useState("");
  const { data: responses, isLoading } = useCannedResponses();

  // Filter responses based on search
  const filteredResponses = React.useMemo(() => {
    if (!responses) return [];
    if (!search) return responses;

    const searchLower = search.toLowerCase();
    return responses.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.content.toLowerCase().includes(searchLower) ||
        r.shortcut?.toLowerCase().includes(searchLower) ||
        r.category?.toLowerCase().includes(searchLower)
    );
  }, [responses, search]);

  // Group by category
  const groupedResponses = React.useMemo(() => {
    const groups: Record<string, CannedResponse[]> = {};

    filteredResponses.forEach((response) => {
      const category = response.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(response);
    });

    return groups;
  }, [filteredResponses]);

  return (
    <div className="flex flex-col h-80">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Canned Responses</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link href="/dashboard/settings/canned-responses">
              <Settings className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 text-sm"
          />
        </div>
      </div>

      {/* Response List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching responses" : "No canned responses yet"}
            </p>
            <Button variant="link" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/settings/canned-responses">
                Manage Responses
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedResponses).map(([category, items]) => (
              <div key={category} className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-2 mb-1 uppercase tracking-wider">
                  {category}
                </p>
                {items.map((response) => (
                  <ResponseItem
                    key={response.id}
                    response={response}
                    onSelect={() => onSelect(response.content)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ResponseItemProps {
  response: CannedResponse;
  onSelect: () => void;
}

function ResponseItem({ response, onSelect }: ResponseItemProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium truncate">{response.name}</span>
        {response.shortcut && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            /{response.shortcut}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {response.content}
      </p>
    </button>
  );
}
