"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Crown, UserCog, User, Eye } from "lucide-react";
import type { OrganizationUser, UserRole } from "@/types/settings";
import { getUserDisplayName, getUserInitials, getRoleLabel } from "@/types/settings";

interface UserRoleEditorProps {
  user: OrganizationUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (role: UserRole) => void;
}

const roleOptions: {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof Shield;
}[] = [
  {
    value: "owner",
    label: "Owner",
    description: "Full control over organization, billing, and all data",
    icon: Crown,
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Full access to all features and user management",
    icon: Shield,
  },
  {
    value: "manager",
    label: "Manager",
    description: "Can manage team members and view team data",
    icon: UserCog,
  },
  {
    value: "member",
    label: "Member",
    description: "Standard access to create and manage own work",
    icon: User,
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to view data",
    icon: Eye,
  },
];

export function UserRoleEditor({
  user,
  open,
  onOpenChange,
  onSave,
}: UserRoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  // Handle save
  const handleSave = () => {
    if (selectedRole !== user.role) {
      onSave(selectedRole);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Update the role and permissions for this user
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{getUserDisplayName(user)}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-3">
            <Label>Select Role</Label>
            <div className="space-y-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.value;
                const isOwner = option.value === "owner";
                const isCurrentOwner = user.role === "owner";

                // Don't allow changing away from owner unless you're the owner
                // For simplicity, we'll disable owner option for non-owners
                const isDisabled = isOwner && !isCurrentOwner;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && setSelectedRole(option.value)}
                    disabled={isDisabled}
                    className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isSelected ? "text-primary" : ""
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={selectedRole === user.role}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
