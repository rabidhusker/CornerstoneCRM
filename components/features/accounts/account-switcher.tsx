"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { AccountContext, AccountSwitchOption } from "@/types/account";
import {
  Building2,
  ChevronDown,
  Search,
  ArrowUpRight,
  Check,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountSwitcherProps {
  context: AccountContext | null;
  onSwitch?: (accountId: string) => Promise<void>;
  onCreateAccount?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AccountSwitcher({
  context,
  onSwitch,
  onCreateAccount,
  isLoading,
  className,
}: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  if (!context) {
    return null;
  }

  // Filter accounts based on search
  const filteredAccounts = context.available_accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group accounts by type
  const parentAccount = filteredAccounts.find((a) => a.type === "parent" || (a.type === "self" && !context.is_sub_account));
  const subAccounts = filteredAccounts.filter((a) => a.type === "sub");

  const handleSwitchAccount = async (accountId: string) => {
    if (onSwitch) {
      await onSwitch(accountId);
    }
    setOpen(false);
  };

  // Don't show switcher if only one account
  if (!context.can_switch_accounts && !onCreateAccount) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium text-sm truncate max-w-[150px]">
          {context.current_account_name}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-muted",
            className
          )}
          disabled={isLoading}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-medium text-sm truncate max-w-[150px]">
              {context.current_account_name}
            </span>
            {context.is_sub_account && context.parent_account_name && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                under {context.parent_account_name}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[300px] p-0"
        sideOffset={8}
      >
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <Separator />

        {/* Accounts list */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {/* Parent/Current organization */}
          {parentAccount && (
            <div className="mb-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Organization
              </div>
              <AccountItem
                account={parentAccount}
                isCurrent={parentAccount.is_current}
                onClick={() => handleSwitchAccount(parentAccount.id)}
                showBadge={context.is_sub_account}
                badgeText="Parent"
              />
            </div>
          )}

          {/* Sub-accounts */}
          {subAccounts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Sub-Accounts ({subAccounts.length})
              </div>
              <div className="space-y-0.5">
                {subAccounts.map((account) => (
                  <AccountItem
                    key={account.id}
                    account={account}
                    isCurrent={account.is_current}
                    onClick={() => handleSwitchAccount(account.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredAccounts.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No accounts found
            </div>
          )}
        </div>

        {/* Back to parent link (for sub-accounts) */}
        {context.is_sub_account && context.parent_account_id && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleSwitchAccount(context.parent_account_id!)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {context.parent_account_name}
              </Button>
            </div>
          </>
        )}

        {/* Create account button */}
        {onCreateAccount && !context.is_sub_account && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onCreateAccount();
                  setOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Sub-Account
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Individual account item
interface AccountItemProps {
  account: AccountSwitchOption;
  isCurrent: boolean;
  onClick: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

function AccountItem({
  account,
  isCurrent,
  onClick,
  showBadge,
  badgeText,
}: AccountItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-left",
        isCurrent
          ? "bg-primary/10"
          : "hover:bg-muted"
      )}
    >
      {/* Logo or initial */}
      {account.logo_url ? (
        <img
          src={account.logo_url}
          alt={account.name}
          className="h-8 w-8 rounded-lg object-contain border"
        />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{account.name}</span>
          {showBadge && badgeText && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {badgeText}
            </Badge>
          )}
        </div>
        {account.type === "sub" && (
          <span className="text-xs text-muted-foreground">Sub-account</span>
        )}
      </div>

      {isCurrent && (
        <Check className="h-4 w-4 text-primary shrink-0" />
      )}
    </button>
  );
}

// Compact header version
interface AccountSwitcherCompactProps {
  accountName: string;
  isSubAccount?: boolean;
  parentName?: string;
  onClick?: () => void;
}

export function AccountSwitcherCompact({
  accountName,
  isSubAccount,
  parentName,
  onClick,
}: AccountSwitcherCompactProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
    >
      <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
        <Building2 className="h-3 w-3 text-primary" />
      </div>
      <span className="text-sm font-medium truncate max-w-[120px]">
        {accountName}
      </span>
      {isSubAccount && (
        <Badge variant="secondary" className="text-xs px-1 py-0">
          Sub
        </Badge>
      )}
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
