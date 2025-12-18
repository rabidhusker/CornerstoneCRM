import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      primary: "border-primary/20 bg-primary/5",
      success: "border-accent/20 bg-accent/5",
      warning: "border-warning/20 bg-warning/5",
      danger: "border-danger/20 bg-danger/5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const iconVariants = cva(
  "flex h-10 w-10 items-center justify-center rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-accent/10 text-accent",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TrendProps {
  value: number;
  label?: string;
}

interface StatCardProps extends VariantProps<typeof statCardVariants> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: TrendProps;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  variant,
  isLoading = false,
  className,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <Card className={cn(statCardVariants({ variant }), className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend && <TrendIndicator trend={trend} />}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(iconVariants({ variant }))}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: TrendProps }) {
  const isPositive = trend.value > 0;
  const isNegative = trend.value < 0;
  const isNeutral = trend.value === 0;

  const TrendIcon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  const trendColor = isPositive
    ? "text-accent"
    : isNegative
    ? "text-danger"
    : "text-muted-foreground";

  const formattedValue = isPositive
    ? `+${trend.value}%`
    : isNegative
    ? `${trend.value}%`
    : "0%";

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
      <TrendIcon className="h-3 w-3" />
      <span>{formattedValue}</span>
      {trend.label && (
        <span className="text-muted-foreground font-normal">{trend.label}</span>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// Grid wrapper for stat cards
interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({
  children,
  columns = 4,
  className,
}: StatCardGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
