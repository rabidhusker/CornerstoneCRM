"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SubAccount } from "@/types/account";
import { accountStatusConfig, subscriptionTierLabels } from "@/types/account";
import {
  Building2,
  Users,
  Briefcase,
  MoreVertical,
  Settings,
  LogIn,
  Trash2,
  Pause,
  Play,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: SubAccount;
  onLoginAs?: (accountId: string) => void;
  onSuspend?: (accountId: string) => void;
  onActivate?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountCard({
  account,
  onLoginAs,
  onSuspend,
  onActivate,
  onDelete,
  isLoading,
}: AccountCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const statusConfig = accountStatusConfig[account.status];
  const isSuspended = account.status === "suspended";
  const isCancelled = account.status === "cancelled";

  return (
    <>
      <Card className={cn("transition-shadow hover:shadow-md", isCancelled && "opacity-60")}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo or initials */}
              {account.logo_url ? (
                <img
                  src={account.logo_url}
                  alt={account.name}
                  className="h-12 w-12 rounded-lg object-contain border"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg">{account.name}</h3>
                {account.admin_email && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {account.admin_email}
                  </div>
                )}
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/accounts/${account.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Account
                  </Link>
                </DropdownMenuItem>

                {!isCancelled && onLoginAs && (
                  <DropdownMenuItem onClick={() => onLoginAs(account.id)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login As
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {!isCancelled && (isSuspended ? onActivate : onSuspend) && (
                  <DropdownMenuItem
                    onClick={() =>
                      isSuspended
                        ? onActivate?.(account.id)
                        : onSuspend?.(account.id)
                    }
                  >
                    {isSuspended ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate Account
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Suspend Account
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {!isCancelled && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status and tier badges */}
          <div className="flex items-center gap-2">
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
              {statusConfig.label}
            </Badge>
            <Badge variant="outline">
              {subscriptionTierLabels[account.subscription_tier]}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{account.user_count || 0}</div>
                <div className="text-xs text-muted-foreground">Users</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{account.contact_count || 0}</div>
                <div className="text-xs text-muted-foreground">Contacts</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{account.deal_count || 0}</div>
                <div className="text-xs text-muted-foreground">Deals</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1" size="sm">
              <Link href={`/accounts/${account.id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Link>
            </Button>
            {!isCancelled && onLoginAs && (
              <Button
                variant="default"
                className="flex-1"
                size="sm"
                onClick={() => onLoginAs(account.id)}
                disabled={isLoading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login As
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{account.name}</strong>?
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Cancel the account and all user access</li>
                <li>Retain data for 30 days before permanent deletion</li>
                <li>Send a notification to the account admin</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.(account.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact version for lists
interface AccountCardCompactProps {
  account: SubAccount;
  onSelect?: (accountId: string) => void;
  isSelected?: boolean;
}

export function AccountCardCompact({
  account,
  onSelect,
  isSelected,
}: AccountCardCompactProps) {
  const statusConfig = accountStatusConfig[account.status];

  return (
    <button
      onClick={() => onSelect?.(account.id)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      {/* Logo or initials */}
      {account.logo_url ? (
        <img
          src={account.logo_url}
          alt={account.name}
          className="h-10 w-10 rounded-lg object-contain border"
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{account.name}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("capitalize", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span>•</span>
          <span>{subscriptionTierLabels[account.subscription_tier]}</span>
        </div>
      </div>

      {isSelected && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );
}
