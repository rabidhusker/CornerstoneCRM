"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Download,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Edit,
  Trophy,
  X as XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useDeleteDeal } from "@/lib/hooks/use-deals";
import {
  calculateDealAge,
  calculateWeightedValue,
  exportDealsToCSV,
  downloadCSV,
  formatCurrency,
} from "@/lib/utils/deal-calculations";
import type { DealCard, PipelineStage } from "@/types/pipeline";

interface DealsListViewProps {
  deals: DealCard[];
  stages: PipelineStage[];
  onDealClick?: (deal: DealCard) => void;
  onCloseDeal?: (deal: DealCard, type: "won" | "lost") => void;
}

type SortField = "title" | "contact" | "stage" | "value" | "expectedCloseDate" | "assignedTo" | "age";
type SortDirection = "asc" | "desc";

export function DealsListView({
  deals,
  stages,
  onDealClick,
  onCloseDeal,
}: DealsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const deleteDealMutation = useDeleteDeal();

  const [selectedDeals, setSelectedDeals] = React.useState<Set<string>>(new Set());
  const [sortField, setSortField] = React.useState<SortField>("value");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const stageMap = React.useMemo(
    () => new Map(stages.map((s) => [s.id, s])),
    [stages]
  );

  // Sort deals
  const sortedDeals = React.useMemo(() => {
    return [...deals].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "contact":
          const nameA = a.contact
            ? `${a.contact.firstName} ${a.contact.lastName}`
            : "";
          const nameB = b.contact
            ? `${b.contact.firstName} ${b.contact.lastName}`
            : "";
          comparison = nameA.localeCompare(nameB);
          break;
        case "stage":
          const stageA = stageMap.get(a.stageId);
          const stageB = stageMap.get(b.stageId);
          comparison = (stageA?.position ?? 0) - (stageB?.position ?? 0);
          break;
        case "value":
          comparison = (a.value || 0) - (b.value || 0);
          break;
        case "expectedCloseDate":
          const dateA = a.expectedCloseDate
            ? new Date(a.expectedCloseDate).getTime()
            : 0;
          const dateB = b.expectedCloseDate
            ? new Date(b.expectedCloseDate).getTime()
            : 0;
          comparison = dateA - dateB;
          break;
        case "assignedTo":
          comparison = (a.assignedTo || "").localeCompare(b.assignedTo || "");
          break;
        case "age":
          comparison = calculateDealAge(a) - calculateDealAge(b);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [deals, sortField, sortDirection, stageMap]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === deals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(deals.map((d) => d.id)));
    }
  };

  const handleSelectDeal = (dealId: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleExport = () => {
    const dealsToExport = selectedDeals.size > 0
      ? deals.filter((d) => selectedDeals.has(d.id))
      : deals;

    const csvContent = exportDealsToCSV(dealsToExport, stages);
    const filename = `deals-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadCSV(csvContent, filename);

    toast({
      title: "Export complete",
      description: `Exported ${dealsToExport.length} deals to CSV.`,
    });
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDeals.size} deal(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      for (const dealId of selectedDeals) {
        await deleteDealMutation.mutateAsync(dealId);
      }
      setSelectedDeals(new Set());
      toast({
        title: "Deals deleted",
        description: `Successfully deleted ${selectedDeals.size} deal(s).`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some deals. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDeal = (deal: DealCard) => {
    router.push(`/dashboard/deals/${deal.id}/edit`);
  };

  const handleViewContact = (deal: DealCard) => {
    if (deal.contact) {
      router.push(`/dashboard/contacts/${deal.contact.id}`);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Won
          </Badge>
        );
      case "lost":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Lost
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Open
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedDeals.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedDeals.size} deal{selectedDeals.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDeals(new Set())}
            className="ml-auto"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Export Button (when no selection) */}
      {selectedDeals.size === 0 && deals.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    deals.length > 0 && selectedDeals.size === deals.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all deals"
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("title")}
                >
                  Deal Name
                  <SortIcon field="title" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("contact")}
                >
                  Contact
                  <SortIcon field="contact" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("stage")}
                >
                  Stage
                  <SortIcon field="stage" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("value")}
                >
                  Value
                  <SortIcon field="value" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("expectedCloseDate")}
                >
                  Expected Close
                  <SortIcon field="expectedCloseDate" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 px-2 font-medium"
                  onClick={() => handleSort("age")}
                >
                  Age
                  <SortIcon field="age" />
                </Button>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">No deals found</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedDeals.map((deal) => {
                const stage = stageMap.get(deal.stageId);
                const contactName = deal.contact
                  ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
                  : null;
                const age = calculateDealAge(deal);

                return (
                  <TableRow
                    key={deal.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedDeals.has(deal.id) && "bg-muted"
                    )}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDeals.has(deal.id)}
                        onCheckedChange={() => handleSelectDeal(deal.id)}
                        aria-label={`Select ${deal.title}`}
                      />
                    </TableCell>
                    <TableCell
                      className="font-medium"
                      onClick={() => onDealClick?.(deal)}
                    >
                      {deal.title}
                    </TableCell>
                    <TableCell>
                      {contactName ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContact(deal);
                          }}
                          className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                        >
                          {contactName}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stage ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: stage.color,
                            color: stage.color,
                          }}
                        >
                          {stage.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(deal.value || 0)}</TableCell>
                    <TableCell>
                      {deal.expectedCloseDate
                        ? format(parseISO(deal.expectedCloseDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {age} day{age !== 1 ? "s" : ""}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onDealClick?.(deal)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditDeal(deal)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit deal
                          </DropdownMenuItem>
                          {deal.status === "open" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCloseDeal?.(deal, "won")}
                                className="text-green-600"
                              >
                                <Trophy className="mr-2 h-4 w-4" />
                                Mark as won
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onCloseDeal?.(deal, "lost")}
                                className="text-red-600"
                              >
                                <XIcon className="mr-2 h-4 w-4" />
                                Mark as lost
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
