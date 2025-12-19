"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Building2, Mail, User, Package } from "lucide-react";
import type { CreateAccountData, SubscriptionTier } from "@/types/account";
import { subscriptionTierLabels, defaultUsageLimits } from "@/types/account";

const createAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Account name must be at least 2 characters")
    .max(100, "Account name must be less than 100 characters"),
  admin_email: z
    .string()
    .email("Please enter a valid email address"),
  admin_first_name: z.string().optional(),
  admin_last_name: z.string().optional(),
  subscription_tier: z.enum(["free", "starter", "professional", "enterprise", "custom"] as const),
  copy_branding: z.boolean(),
});

type FormValues = z.infer<typeof createAccountSchema>;

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateAccountDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      admin_email: "",
      admin_first_name: "",
      admin_last_name: "",
      subscription_tier: "starter",
      copy_branding: true,
    },
  });

  const selectedTier = form.watch("subscription_tier");

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  // Get tier limits for display
  const tierLimits = defaultUsageLimits[selectedTier];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Sub-Account
          </DialogTitle>
          <DialogDescription>
            Create a new sub-account under your organization. The admin will
            receive an invitation email to set up their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Account Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corporation"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Email */}
            <FormField
              control={form.control}
              name="admin_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This person will receive an invitation to become the account owner.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Name (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="admin_first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admin_last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subscription Tier */}
            <FormField
              control={form.control}
              name="subscription_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Tier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(subscriptionTierLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determines feature access and usage limits.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tier Limits Preview */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="text-sm font-medium mb-2">Tier Limits</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  Contacts: {tierLimits.max_contacts === -1 ? "Unlimited" : tierLimits.max_contacts.toLocaleString()}
                </div>
                <div>
                  Users: {tierLimits.max_users === -1 ? "Unlimited" : tierLimits.max_users}
                </div>
                <div>
                  Emails/mo: {tierLimits.max_emails_per_month === -1 ? "Unlimited" : tierLimits.max_emails_per_month.toLocaleString()}
                </div>
                <div>
                  Storage: {tierLimits.max_storage_gb === -1 ? "Unlimited" : `${tierLimits.max_storage_gb}GB`}
                </div>
              </div>
            </div>

            {/* Copy Branding */}
            <FormField
              control={form.control}
              name="copy_branding"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Copy Branding Settings
                    </FormLabel>
                    <FormDescription>
                      Apply your organization's branding to this sub-account
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
