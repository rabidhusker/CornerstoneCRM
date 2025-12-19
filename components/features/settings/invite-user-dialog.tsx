"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Mail, Send } from "lucide-react";
import type { UserRole, UserInvitation } from "@/types/settings";
import { roleLabels } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Invite user API call
async function inviteUser(invitation: UserInvitation): Promise<void> {
  const response = await fetch("/api/v1/settings/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invitation),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send invitation");
  }
}

const availableRoles: { value: UserRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Administrator",
    description: "Full access to all features and settings",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Can manage team members and their work",
  },
  {
    value: "member",
    label: "Member",
    description: "Standard access to create and manage own work",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to view data",
  },
];

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [message, setMessage] = useState("");

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setRole("member");
      setMessage("");
    }
    onOpenChange(open);
  };

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      toast({ title: "Invitation sent", description: `Invitation sent to ${email}` });
      handleOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    inviteMutation.mutate({ email: email.trim(), role, message: message.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    <div>
                      <span className="font-medium">{roleOption.label}</span>
                      <p className="text-xs text-muted-foreground">
                        {roleOption.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You can change the role later from the user settings
            </p>
          </div>

          {/* Personal message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
