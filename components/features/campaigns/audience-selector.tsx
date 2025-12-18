"use client";

import * as React from "react";
import {
  Users,
  Tag,
  Filter,
  UserCheck,
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useContacts } from "@/lib/hooks/use-contacts";
import type { CampaignSettings } from "@/types/campaign";

type AudienceType = "all" | "tags" | "lifecycle" | "custom";

interface AudienceSelectorProps {
  settings: CampaignSettings;
  onSettingsChange: (settings: CampaignSettings) => void;
  campaignType?: "email" | "sms" | "drip";
}

// Mock tags - in production, fetch from API
const availableTags = [
  { id: "hot-lead", name: "Hot Lead", count: 45 },
  { id: "warm-lead", name: "Warm Lead", count: 120 },
  { id: "cold-lead", name: "Cold Lead", count: 200 },
  { id: "buyer", name: "Buyer", count: 89 },
  { id: "seller", name: "Seller", count: 67 },
  { id: "investor", name: "Investor", count: 34 },
  { id: "first-time-buyer", name: "First Time Buyer", count: 56 },
  { id: "referral", name: "Referral", count: 28 },
];

// Lifecycle stages
const lifecycleStages = [
  { id: "new", name: "New", count: 150 },
  { id: "contacted", name: "Contacted", count: 89 },
  { id: "qualified", name: "Qualified", count: 67 },
  { id: "proposal", name: "Proposal Sent", count: 34 },
  { id: "negotiation", name: "Negotiation", count: 23 },
  { id: "closed-won", name: "Closed Won", count: 112 },
  { id: "closed-lost", name: "Closed Lost", count: 45 },
];

export function AudienceSelector({
  settings,
  onSettingsChange,
  campaignType = "email",
}: AudienceSelectorProps) {
  const [tagsOpen, setTagsOpen] = React.useState(false);
  const [stagesOpen, setStagesOpen] = React.useState(false);

  // Fetch contacts for count estimation
  const { data: contactsData, isLoading: contactsLoading } = useContacts();

  const audienceType = settings.audience_type || "all";
  const selectedTags = settings.audience_tags || [];
  const selectedStages = settings.audience_lifecycle_stages || [];
  const excludeUnsubscribed = settings.exclude_unsubscribed ?? true;
  const excludeBounced = settings.exclude_bounced ?? true;

  // Calculate estimated audience count
  const estimatedCount = React.useMemo(() => {
    if (!contactsData) return 0;

    let count = contactsData.pagination.total;

    // Filter by audience type
    if (audienceType === "tags" && selectedTags.length > 0) {
      // In production, filter contacts by tags
      count = selectedTags.reduce((sum, tagId) => {
        const tag = availableTags.find((t) => t.id === tagId);
        return tag ? sum + tag.count : sum;
      }, 0);
    } else if (audienceType === "lifecycle" && selectedStages.length > 0) {
      count = selectedStages.reduce((sum, stageId) => {
        const stage = lifecycleStages.find((s) => s.id === stageId);
        return stage ? sum + stage.count : sum;
      }, 0);
    }

    // Apply exclusions (estimate 5% reduction for each)
    if (excludeUnsubscribed) {
      count = Math.floor(count * 0.95);
    }
    if (excludeBounced) {
      count = Math.floor(count * 0.98);
    }

    return Math.max(0, count);
  }, [contactsData, audienceType, selectedTags, selectedStages, excludeUnsubscribed, excludeBounced]);

  const handleAudienceTypeChange = (type: AudienceType) => {
    onSettingsChange({
      ...settings,
      audience_type: type,
      audience_tags: type === "tags" ? selectedTags : undefined,
      audience_lifecycle_stages: type === "lifecycle" ? selectedStages : undefined,
    });
  };

  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];

    onSettingsChange({
      ...settings,
      audience_tags: newTags,
    });
  };

  const handleStageToggle = (stageId: string) => {
    const newStages = selectedStages.includes(stageId)
      ? selectedStages.filter((s) => s !== stageId)
      : [...selectedStages, stageId];

    onSettingsChange({
      ...settings,
      audience_lifecycle_stages: newStages,
    });
  };

  const handleExcludeChange = (
    field: "exclude_unsubscribed" | "exclude_bounced",
    value: boolean
  ) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Audience Count Preview */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Estimated Audience</p>
              <p className="text-sm text-muted-foreground">
                Based on current selection
              </p>
            </div>
          </div>
          <div className="text-right">
            {contactsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <p className="text-3xl font-bold">{estimatedCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {campaignType === "email" ? "emails" : campaignType === "sms" ? "messages" : "contacts"}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audience Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Select Audience</Label>
        <RadioGroup
          value={audienceType}
          onValueChange={(value) => handleAudienceTypeChange(value as AudienceType)}
          className="grid gap-3"
        >
          {/* All Contacts */}
          <Label
            htmlFor="all"
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
              audienceType === "all" && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="all" id="all" />
            <div className="flex items-center gap-3 flex-1">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">All Contacts</p>
                <p className="text-sm text-muted-foreground">
                  Send to your entire contact list
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              {contactsData?.pagination.total.toLocaleString() || "0"} contacts
            </Badge>
          </Label>

          {/* By Tags */}
          <Label
            htmlFor="tags"
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
              audienceType === "tags" && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="tags" id="tags" />
            <div className="flex items-center gap-3 flex-1">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Specific Tags</p>
                <p className="text-sm text-muted-foreground">
                  Target contacts with specific tags
                </p>
              </div>
            </div>
          </Label>

          {/* By Lifecycle Stage */}
          <Label
            htmlFor="lifecycle"
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
              audienceType === "lifecycle" && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="lifecycle" id="lifecycle" />
            <div className="flex items-center gap-3 flex-1">
              <UserCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Lifecycle Stage</p>
                <p className="text-sm text-muted-foreground">
                  Target contacts at specific stages
                </p>
              </div>
            </div>
          </Label>

          {/* Custom Filter */}
          <Label
            htmlFor="custom"
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
              audienceType === "custom" && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="custom" id="custom" />
            <div className="flex items-center gap-3 flex-1">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Custom Filter</p>
                <p className="text-sm text-muted-foreground">
                  Build a custom audience filter
                </p>
              </div>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Tags Selection (when tags type is selected) */}
      {audienceType === "tags" && (
        <div className="space-y-3">
          <Label>Select Tags</Label>
          <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedTags.length > 0
                  ? `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} selected`
                  : "Select tags..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {availableTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleTagToggle(tag.id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            selectedTags.includes(tag.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "opacity-50"
                          )}
                        >
                          {selectedTags.includes(tag.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className="flex-1">{tag.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {tag.count}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = availableTags.find((t) => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="secondary" className="gap-1">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tagId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Lifecycle Stage Selection */}
      {audienceType === "lifecycle" && (
        <div className="space-y-3">
          <Label>Select Lifecycle Stages</Label>
          <Popover open={stagesOpen} onOpenChange={setStagesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedStages.length > 0
                  ? `${selectedStages.length} stage${selectedStages.length !== 1 ? "s" : ""} selected`
                  : "Select stages..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {lifecycleStages.map((stage) => (
                      <CommandItem
                        key={stage.id}
                        onSelect={() => handleStageToggle(stage.id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            selectedStages.includes(stage.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "opacity-50"
                          )}
                        >
                          {selectedStages.includes(stage.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className="flex-1">{stage.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {stage.count}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected stages */}
          {selectedStages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedStages.map((stageId) => {
                const stage = lifecycleStages.find((s) => s.id === stageId);
                return stage ? (
                  <Badge key={stageId} variant="secondary" className="gap-1">
                    {stage.name}
                    <button
                      type="button"
                      onClick={() => handleStageToggle(stageId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Filter Placeholder */}
      {audienceType === "custom" && (
        <Card className="bg-muted/30">
          <CardContent className="py-8 text-center">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Custom filter builder coming soon
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Exclusion Options */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Exclusions</Label>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Exclude Unsubscribed</p>
              <p className="text-sm text-muted-foreground">
                Don't send to contacts who unsubscribed
              </p>
            </div>
          </div>
          <Checkbox
            checked={excludeUnsubscribed}
            onCheckedChange={(checked) =>
              handleExcludeChange("exclude_unsubscribed", checked as boolean)
            }
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Exclude Bounced</p>
              <p className="text-sm text-muted-foreground">
                Don't send to emails that previously bounced
              </p>
            </div>
          </div>
          <Checkbox
            checked={excludeBounced}
            onCheckedChange={(checked) =>
              handleExcludeChange("exclude_bounced", checked as boolean)
            }
          />
        </div>
      </div>
    </div>
  );
}
