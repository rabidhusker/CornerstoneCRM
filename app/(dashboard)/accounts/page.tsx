"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AccountCard } from "@/components/features/accounts/account-card";
import { CreateAccountDialog } from "@/components/features/accounts/create-account-dialog";
import type { SubAccount, AccountStatus, CreateAccountData } from "@/types/account";
import { accountStatusConfig, subscriptionTierLabels } from "@/types/account";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  Crown,
  AlertTriangle,
} from "lucide-react";

// Fetch sub-accounts
async function fetchAccounts(): Promise<{ accounts: SubAccount[]; canManage: boolean }> {
  const res = await fetch("/api/v1/accounts");
  if (!res.ok) {
    if (res.status === 403) {
      return { accounts: [], canManage: false };
    }
    throw new Error("Failed to fetch accounts");
  }
  return res.json();
}

// Create account
async function createAccount(data: CreateAccountData): Promise<SubAccount> {
  const res = await fetch("/api/v1/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create account");
  }
  return res.json();
}

// Update account status
async function updateAccountStatus(
  accountId: string,
  status: AccountStatus
): Promise<void> {
  const res = await fetch(`/api/v1/accounts/${accountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update account");
  }
}

// Delete account
async function deleteAccount(accountId: string): Promise<void> {
  const res = await fetch(`/api/v1/accounts/${accountId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete account");
  }
}

// Login as account
async function loginAsAccount(accountId: string): Promise<{ redirect_url: string }> {
  const res = await fetch(`/api/v1/accounts/${accountId}/login-as`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to switch to account");
  }
  return res.json();
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowCreateDialog(false);
      toast({ title: "Account created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) =>
      updateAccountStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginAsMutation = useMutation({
    mutationFn: loginAsAccount,
    onSuccess: (data) => {
      toast({ title: "Switching to account..." });
      router.push(data.redirect_url || "/dashboard");
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to switch account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter accounts
  const accounts = data?.accounts || [];
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.admin_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const totalContacts = accounts.reduce((sum, a) => sum + (a.contact_count || 0), 0);
  const totalDeals = accounts.reduce((sum, a) => sum + (a.deal_count || 0), 0);

  if (isLoading) {
    return <AccountsPageSkeleton />;
  }

  // Show upgrade prompt if user doesn't have access
  if (data && !data.canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sub-Accounts</h1>
          <p className="text-muted-foreground">
            Manage your organization's sub-accounts
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Enterprise Feature</h2>
            <p className="text-center text-muted-foreground max-w-md mt-2">
              Sub-account management is available on Enterprise and Custom plans.
              Upgrade your subscription to create and manage multiple accounts
              under your organization.
            </p>
            <Button className="mt-4">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sub-Accounts</h1>
          <p className="text-muted-foreground">
            Manage your organization's sub-accounts
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">Failed to load accounts</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sub-Accounts</h1>
          <p className="text-muted-foreground">
            Manage your organization's sub-accounts
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {activeAccounts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, a) => sum + (a.user_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(accountStatusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accounts grid */}
      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No accounts found</h2>
            <p className="text-center text-muted-foreground max-w-md mt-2">
              {accounts.length === 0
                ? "Create your first sub-account to get started."
                : "No accounts match your search criteria."}
            </p>
            {accounts.length === 0 && (
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onLoginAs={(id) => loginAsMutation.mutate(id)}
              onSuspend={(id) =>
                updateStatusMutation.mutate({ id, status: "suspended" })
              }
              onActivate={(id) =>
                updateStatusMutation.mutate({ id, status: "active" })
              }
              onDelete={(id) => deleteMutation.mutate(id)}
              isLoading={
                updateStatusMutation.isPending ||
                deleteMutation.isPending ||
                loginAsMutation.isPending
              }
            />
          ))}
        </div>
      )}

      {/* Create account dialog */}
      <CreateAccountDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

// Loading skeleton
function AccountsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
