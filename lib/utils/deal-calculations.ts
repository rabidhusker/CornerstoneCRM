import { differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, format, parseISO, isWithinInterval } from "date-fns";
import type { DealCard, PipelineStage } from "@/types/pipeline";
import type { DealWithRelations } from "@/types/deal";

// Calculate weighted value based on stage probability
export function calculateWeightedValue(
  deal: DealCard | DealWithRelations,
  stage?: PipelineStage | null
): number {
  const value = deal.value || 0;
  const probability = stage?.probability ?? 50;
  return value * (probability / 100);
}

// Calculate total weighted value for multiple deals
export function calculateTotalWeightedValue(
  deals: (DealCard | DealWithRelations)[],
  stages: PipelineStage[]
): number {
  const stageMap = new Map(stages.map((s) => [s.id, s]));

  return deals.reduce((total, deal) => {
    const stageId = "stageId" in deal ? deal.stageId : deal.stage_id;
    const stage = stageMap.get(stageId || "");
    return total + calculateWeightedValue(deal, stage);
  }, 0);
}

// Forecast data structure
export interface ForecastMonth {
  month: string;
  monthLabel: string;
  unweightedValue: number;
  weightedValue: number;
  dealCount: number;
  deals: (DealCard | DealWithRelations)[];
}

// Calculate forecast by month
export function calculateForecast(
  deals: (DealCard | DealWithRelations)[],
  stages: PipelineStage[],
  dateRange: { from: Date; to: Date }
): ForecastMonth[] {
  const stageMap = new Map(stages.map((s) => [s.id, s]));
  const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });

  return months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const monthKey = format(monthStart, "yyyy-MM");
    const monthLabel = format(monthStart, "MMM yyyy");

    // Filter deals that have expected close date in this month
    const monthDeals = deals.filter((deal) => {
      const closeDate = "expectedCloseDate" in deal
        ? deal.expectedCloseDate
        : deal.expected_close_date;

      if (!closeDate) return false;

      try {
        const parsedDate = parseISO(closeDate);
        return isWithinInterval(parsedDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });

    const unweightedValue = monthDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    const weightedValue = monthDeals.reduce((sum, deal) => {
      const stageId = "stageId" in deal ? deal.stageId : deal.stage_id;
      const stage = stageMap.get(stageId || "");
      return sum + calculateWeightedValue(deal, stage);
    }, 0);

    return {
      month: monthKey,
      monthLabel,
      unweightedValue,
      weightedValue,
      dealCount: monthDeals.length,
      deals: monthDeals,
    };
  });
}

// Calculate win rate
export function calculateWinRate(deals: (DealCard | DealWithRelations)[]): number {
  const closedDeals = deals.filter((d) => d.status === "won" || d.status === "lost");
  if (closedDeals.length === 0) return 0;

  const wonDeals = closedDeals.filter((d) => d.status === "won");
  return (wonDeals.length / closedDeals.length) * 100;
}

// Calculate average deal size (won deals only for accuracy)
export function calculateAverageDealSize(deals: (DealCard | DealWithRelations)[]): number {
  const dealsWithValue = deals.filter((d) => d.value && d.value > 0);
  if (dealsWithValue.length === 0) return 0;

  const totalValue = dealsWithValue.reduce((sum, d) => sum + (d.value || 0), 0);
  return totalValue / dealsWithValue.length;
}

// Calculate average time to close (won deals only)
export function calculateAverageTimeToClose(deals: (DealCard | DealWithRelations)[]): number {
  const wonDeals = deals.filter((d) => {
    if (d.status !== "won") return false;
    const closedAt = "closed_at" in d ? d.closed_at : null;
    const createdAt = "createdAt" in d ? d.createdAt : d.created_at;
    return closedAt && createdAt;
  });

  if (wonDeals.length === 0) return 0;

  const totalDays = wonDeals.reduce((sum, deal) => {
    const closedAt = "closed_at" in deal ? deal.closed_at : null;
    const createdAt = "createdAt" in deal ? deal.createdAt : (deal as DealWithRelations).created_at;

    if (!closedAt || !createdAt) return sum;

    try {
      const days = differenceInDays(parseISO(closedAt as string), parseISO(createdAt as string));
      return sum + Math.max(0, days);
    } catch {
      return sum;
    }
  }, 0);

  return totalDays / wonDeals.length;
}

// Calculate deal age in days
export function calculateDealAge(deal: DealCard | DealWithRelations): number {
  const createdAt = "createdAt" in deal ? deal.createdAt : deal.created_at;
  if (!createdAt) return 0;

  try {
    return differenceInDays(new Date(), parseISO(createdAt));
  } catch {
    return 0;
  }
}

// Pipeline summary statistics
export interface PipelineSummary {
  totalOpenDeals: number;
  totalOpenValue: number;
  totalWeightedValue: number;
  dealsWonThisMonth: number;
  valueWonThisMonth: number;
  dealsLostThisMonth: number;
  valueLostThisMonth: number;
  averageDealSize: number;
  averageTimeToClose: number;
  winRate: number;
  dealsByStage: {
    stageId: string;
    stageName: string;
    color: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
  }[];
}

// Calculate pipeline summary
export function calculatePipelineSummary(
  deals: (DealCard | DealWithRelations)[],
  stages: PipelineStage[]
): PipelineSummary {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const stageMap = new Map(stages.map((s) => [s.id, s]));

  // Open deals
  const openDeals = deals.filter((d) => d.status === "open");
  const totalOpenDeals = openDeals.length;
  const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalWeightedValue = calculateTotalWeightedValue(openDeals, stages);

  // Won this month
  const dealsWonThisMonth = deals.filter((d) => {
    if (d.status !== "won") return false;
    const closedAt = "closed_at" in d ? d.closed_at : null;
    if (!closedAt) return false;
    try {
      return isWithinInterval(parseISO(closedAt as string), { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });

  // Lost this month
  const dealsLostThisMonth = deals.filter((d) => {
    if (d.status !== "lost") return false;
    const closedAt = "closed_at" in d ? d.closed_at : null;
    if (!closedAt) return false;
    try {
      return isWithinInterval(parseISO(closedAt as string), { start: monthStart, end: monthEnd });
    } catch {
      return false;
    }
  });

  // Stage breakdown
  const dealsByStage = stages
    .filter((stage) => !stage.is_won_stage && !stage.is_lost_stage)
    .map((stage) => {
      const stageDeals = openDeals.filter((d) => {
        const stageId = "stageId" in d ? d.stageId : d.stage_id;
        return stageId === stage.id;
      });

      const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedValue = stageDeals.reduce(
        (sum, d) => sum + calculateWeightedValue(d, stage),
        0
      );

      return {
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color,
        dealCount: stageDeals.length,
        totalValue,
        weightedValue,
      };
    });

  return {
    totalOpenDeals,
    totalOpenValue,
    totalWeightedValue,
    dealsWonThisMonth: dealsWonThisMonth.length,
    valueWonThisMonth: dealsWonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0),
    dealsLostThisMonth: dealsLostThisMonth.length,
    valueLostThisMonth: dealsLostThisMonth.reduce((sum, d) => sum + (d.value || 0), 0),
    averageDealSize: calculateAverageDealSize(deals),
    averageTimeToClose: calculateAverageTimeToClose(deals),
    winRate: calculateWinRate(deals),
    dealsByStage,
  };
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format percentage
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Export deals to CSV
export function exportDealsToCSV(
  deals: (DealCard | DealWithRelations)[],
  stages: PipelineStage[]
): string {
  const stageMap = new Map(stages.map((s) => [s.id, s]));

  const headers = [
    "Title",
    "Contact",
    "Company",
    "Stage",
    "Value",
    "Weighted Value",
    "Expected Close",
    "Status",
    "Age (Days)",
    "Created",
  ];

  const rows = deals.map((deal) => {
    const stageId = "stageId" in deal ? deal.stageId : deal.stage_id;
    const stage = stageMap.get(stageId || "");
    const createdAt = "createdAt" in deal ? deal.createdAt : deal.created_at;
    const expectedClose = "expectedCloseDate" in deal
      ? deal.expectedCloseDate
      : deal.expected_close_date;

    let contactName = "";
    if (deal.contact) {
      if ("firstName" in deal.contact) {
        contactName = `${deal.contact.firstName} ${deal.contact.lastName}`.trim();
      } else if ("first_name" in deal.contact) {
        contactName = `${deal.contact.first_name} ${deal.contact.last_name}`.trim();
      }
    }

    return [
      deal.title,
      contactName,
      "", // Company - not in current data model
      stage?.name || "",
      deal.value?.toString() || "0",
      calculateWeightedValue(deal, stage).toString(),
      expectedClose || "",
      deal.status,
      calculateDealAge(deal).toString(),
      createdAt ? format(parseISO(createdAt), "yyyy-MM-dd") : "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
