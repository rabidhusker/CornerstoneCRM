"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";
import { useDeleteContact, useUpdateContact } from "@/lib/hooks/use-contacts";
import type { Contact, ContactType } from "@/types/contact";
import { contactTypeConfig } from "@/types/contact";

interface ContactHeaderProps {
  contact: Contact;
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const deleteContactMutation = useDeleteContact();
  const updateContactMutation = useUpdateContact();

  const displayName =
    `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
    contact.email ||
    "Unknown";

  const initials = React.useMemo(() => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
    }
    if (contact.first_name) {
      return contact.first_name.slice(0, 2).toUpperCase();
    }
    if (contact.email) {
      return contact.email[0].toUpperCase();
    }
    return "?";
  }, [contact.first_name, contact.last_name, contact.email]);

  const handleTypeChange = async (newType: ContactType) => {
    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: { type: newType },
      });
      toast({
        title: "Contact updated",
        description: `Type changed to ${contactTypeConfig[newType].label}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contact type.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContactMutation.mutateAsync(contact.id);
      toast({
        title: "Contact deleted",
        description: `${displayName} has been deleted.`,
      });
      router.push("/dashboard/contacts");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete contact.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    } else {
      toast({
        title: "No email",
        description: "This contact doesn't have an email address.",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    } else {
      toast({
        title: "No phone",
        description: "This contact doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side - Contact info */}
        <div className="flex items-start gap-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-2"
            asChild
          >
            <Link href="/dashboard/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* Avatar */}
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name and details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <Select
                value={contact.type}
                onValueChange={(value) => handleTypeChange(value as ContactType)}
              >
                <SelectTrigger className="h-7 w-auto border-dashed gap-1 [&>svg]:hidden">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-normal",
                      contactTypeConfig[contact.type]?.color,
                      "text-white"
                    )}
                  >
                    {contactTypeConfig[contact.type]?.label}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contactTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <Badge
                        variant="secondary"
                        className={cn("font-normal", config.color, "text-white")}
                      >
                        {config.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {contact.company_name && (
              <p className="text-muted-foreground">
                {contact.job_title
                  ? `${contact.job_title} at ${contact.company_name}`
                  : contact.company_name}
              </p>
            )}

            {/* Lead score */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Lead Score:</span>
              <div className="flex items-center gap-2 w-32">
                <Progress value={contact.lead_score} className="h-2" />
                <span className="text-sm font-medium">{contact.lead_score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleCall}>
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/contacts/${contact.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/contacts/${contact.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Contact
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{displayName}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
