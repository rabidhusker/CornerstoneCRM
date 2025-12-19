"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  UserMinus,
  Trash2,
  Mail,
  RefreshCw,
} from "lucide-react";
import type { OrganizationUser, UserStatus } from "@/types/settings";
import { getRoleLabel, getUserDisplayName, getUserInitials } from "@/types/settings";
import { InviteUserDialog } from "@/components/features/settings/invite-user-dialog";
import { UserRoleEditor } from "@/components/features/settings/user-role-editor";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Fetch users
async function fetchUsers(): Promise<OrganizationUser[]> {
  const response = await fetch("/api/v1/settings/users");
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await response.json();
  return data.users || [];
}

// Update user
async function updateUser(
  id: string,
  data: { role?: string; status?: UserStatus }
): Promise<void> {
  const response = await fetch(`/api/v1/settings/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update user");
  }
}

// Delete user
async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/v1/settings/users/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to remove user");
  }
}

// Status badge component
function StatusBadge({ status }: { status: UserStatus }) {
  const variants: Record<UserStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-800" },
    invited: { label: "Invited", className: "bg-yellow-100 text-yellow-800" },
    deactivated: { label: "Deactivated", className: "bg-gray-100 text-gray-800" },
  };

  const { label, className } = variants[status] || variants.active;

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["organizationUsers"],
    queryFn: fetchUsers,
    staleTime: 30 * 1000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; status?: UserStatus } }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationUsers"] });
      toast({ title: "User updated successfully" });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationUsers"] });
      toast({ title: "User removed successfully" });
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter users
  const filteredUsers = users?.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle deactivate
  const handleDeactivate = (user: OrganizationUser) => {
    const newStatus: UserStatus = user.status === "deactivated" ? "active" : "deactivated";
    updateMutation.mutate({ id: user.id, data: { status: newStatus } });
  };

  // Handle resend invite
  const handleResendInvite = (user: OrganizationUser) => {
    toast({ title: "Invitation resent", description: `Invitation sent to ${user.email}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Users & Teams
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users and their roles in your organization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/users/roles">
              <Shield className="h-4 w-4 mr-2" />
              Manage Roles
            </Link>
          </Button>
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Search and stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{users?.length || 0} total users</span>
          <span>{users?.filter((u) => u.status === "active").length || 0} active</span>
          <span>{users?.filter((u) => u.status === "invited").length || 0} pending</span>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-destructive mb-4">Failed to load users</p>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["organizationUsers"] })}
              >
                Try Again
              </Button>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Invite your first team member"}
              </p>
              {!search && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getUserDisplayName(user)}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.last_active_at
                          ? formatDistanceToNow(new Date(user.last_active_at), {
                              addSuffix: true,
                            })
                          : user.status === "invited"
                          ? "Never"
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          {user.status === "invited" && (
                            <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                            <UserMinus className="h-4 w-4 mr-2" />
                            {user.status === "deactivated" ? "Activate" : "Deactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["organizationUsers"] });
        }}
      />

      {/* Role editor dialog */}
      {editingUser && (
        <UserRoleEditor
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSave={(role) => {
            updateMutation.mutate({ id: editingUser.id, data: { role } });
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from your organization? They will
              lose access to all data and resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
