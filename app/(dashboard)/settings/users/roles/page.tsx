"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Crown,
  Lock,
} from "lucide-react";
import type { Role, RolePermissions } from "@/types/settings";
import { defaultRolePermissions, getRoleLabel } from "@/types/settings";
import { RolePermissionsEditor } from "@/components/features/settings/role-permissions";
import { useToast } from "@/hooks/use-toast";

// Fetch roles
async function fetchRoles(): Promise<Role[]> {
  const response = await fetch("/api/v1/settings/roles");
  if (!response.ok) {
    throw new Error("Failed to fetch roles");
  }
  const data = await response.json();
  return data.roles || [];
}

// Create role
async function createRole(data: {
  name: string;
  description?: string;
  permissions: RolePermissions;
}): Promise<Role> {
  const response = await fetch("/api/v1/settings/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create role");
  }
  const result = await response.json();
  return result.role;
}

// Update role
async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissions?: RolePermissions }
): Promise<void> {
  const response = await fetch(`/api/v1/settings/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update role");
  }
}

// Delete role
async function deleteRole(id: string): Promise<void> {
  const response = await fetch(`/api/v1/settings/roles/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete role");
  }
}

// Role card component
function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {role.is_system ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Shield className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{getRoleLabel(role.name)}</h3>
                {role.is_system && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {role.description || "No description"}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{role.user_count || 0} users</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            {!role.is_system && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create/Edit role dialog
function RoleEditor({
  role,
  open,
  onOpenChange,
  onSave,
}: {
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; permissions: RolePermissions }) => void;
}) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [permissions, setPermissions] = useState<RolePermissions>(
    role?.permissions || defaultRolePermissions.member
  );

  const isEditing = !!role;
  const isSystemRole = role?.is_system;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), permissions });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${getRoleLabel(role.name)}` : "Create Custom Role"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? isSystemRole
                ? "System roles cannot be renamed but permissions can be customized"
                : "Update role name, description, and permissions"
              : "Create a new role with custom permissions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role info */}
          {!isSystemRole && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this role"
                />
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <RolePermissionsEditor
              permissions={permissions}
              onChange={setPermissions}
              disabled={isSystemRole && role?.name === "owner"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Fetch roles
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 60 * 1000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role created successfully" });
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role updated successfully" });
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Role deleted successfully" });
      setDeleteRoleId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Separate system and custom roles
  const systemRoles = roles?.filter((r) => r.is_system) || [];
  const customRoles = roles?.filter((r) => !r.is_system) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and their access levels
            </p>
          </div>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive mb-4">Failed to load roles</p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["roles"] })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* System roles */}
      {systemRoles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            System Roles
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {systemRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => setEditingRole(role)}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom roles */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Custom Roles
        </h2>
        {customRoles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No custom roles</h3>
              <p className="text-muted-foreground mb-4">
                Create custom roles to define specific permission sets
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {customRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => setEditingRole(role)}
                onDelete={() => setDeleteRoleId(role.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <RoleEditor
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={(data) => createMutation.mutate(data)}
      />

      {/* Edit dialog */}
      {editingRole && (
        <RoleEditor
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onSave={(data) =>
            updateMutation.mutate({ id: editingRole.id, data })
          }
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Users with this role will
              be changed to the default Member role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteMutation.mutate(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
