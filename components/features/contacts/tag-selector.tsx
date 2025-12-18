"use client";

import * as React from "react";
import { X, Plus, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  availableTags?: string[];
  placeholder?: string;
}

// Default available tags (can be fetched from API in real app)
const defaultAvailableTags = [
  "VIP",
  "Hot Lead",
  "First-Time Buyer",
  "Investor",
  "Referral",
  "Follow Up",
  "Qualified",
  "Needs Financing",
  "Luxury",
  "Commercial",
  "Residential",
  "Relocation",
];

// Tag colors based on tag name hash
const tagColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
}

export function TagSelector({
  value,
  onChange,
  availableTags = defaultAvailableTags,
  placeholder = "Add tags...",
}: TagSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");

  // Combine available tags with any custom tags already selected
  const allTags = React.useMemo(() => {
    const tagSet = new Set([...availableTags, ...value]);
    return Array.from(tagSet).sort();
  }, [availableTags, value]);

  const handleSelect = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleCreateTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setNewTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn("gap-1 pr-1", getTagColor(tag), "text-white")}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="ml-1 rounded-full hover:bg-white/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>
                <div className="py-2 text-center text-sm">
                  No matching tags found.
                </div>
              </CommandEmpty>
              <CommandGroup heading="Available Tags">
                {allTags.map((tag) => {
                  const isSelected = value.includes(tag);
                  return (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => handleSelect(tag)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal",
                          getTagColor(tag),
                          "text-white"
                        )}
                      >
                        {tag}
                      </Badge>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Create New Tag">
                <div className="p-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={!newTag.trim()}
                      className="h-8"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
