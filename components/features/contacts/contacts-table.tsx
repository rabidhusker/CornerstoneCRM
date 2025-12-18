"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { Contact, ContactSort } from "@/types/contact";
import { contactTypeConfig, contactStatusConfig } from "@/types/contact";

interface ContactsTableProps {
  contacts: Contact[];
  isLoading?: boolean;
  pageSize?: number;
  onSort?: (sort: ContactSort) => void;
  onRowSelectionChange?: (selectedContacts: Contact[]) => void;
  onDelete?: (contact: Contact) => void;
}

export function ContactsTable({
  contacts,
  isLoading = false,
  pageSize = 10,
  onRowSelectionChange,
  onDelete,
}: ContactsTableProps) {
  const columns: ColumnDef<Contact>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "first_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const contact = row.original;
          const displayName =
            `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
            contact.email ||
            "Unknown";
          const initials = getInitials(contact);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="font-medium hover:underline"
                >
                  {displayName}
                </Link>
                {contact.job_title && (
                  <span className="text-xs text-muted-foreground">
                    {contact.job_title}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => {
          const email = row.getValue("email") as string | null;
          if (!email) return <span className="text-muted-foreground">—</span>;

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-1 text-sm hover:underline"
                  >
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[180px] truncate">{email}</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>{email}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: "company_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Company" />
        ),
        cell: ({ row }) => {
          const company = row.getValue("company_name") as string | null;
          if (!company) return <span className="text-muted-foreground">—</span>;

          return (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[150px] truncate">{company}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Phone" />
        ),
        cell: ({ row }) => {
          const phone = row.getValue("phone") as string | null;
          if (!phone) return <span className="text-muted-foreground">—</span>;

          return (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-sm hover:underline"
            >
              <Phone className="h-3 w-3 text-muted-foreground" />
              {phone}
            </a>
          );
        },
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as keyof typeof contactTypeConfig;
          const config = contactTypeConfig[type] || contactTypeConfig.other;

          return (
            <Badge
              variant="secondary"
              className={cn("font-normal", config.color, "text-white")}
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as keyof typeof contactStatusConfig;
          const config = contactStatusConfig[status] || contactStatusConfig.active;

          return (
            <Badge
              variant="outline"
              className={cn("font-normal")}
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lead_score",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Score" />
        ),
        cell: ({ row }) => {
          const score = row.getValue("lead_score") as number;

          return (
            <div className="flex items-center gap-2 w-[100px]">
              <Progress value={score} className="h-2" />
              <span className="text-xs text-muted-foreground w-8">{score}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "last_contacted_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Contact" />
        ),
        cell: ({ row }) => {
          const lastContact = row.getValue("last_contacted_at") as string | null;
          if (!lastContact) {
            return <span className="text-muted-foreground text-sm">Never</span>;
          }

          return (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(lastContact), { addSuffix: true })}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const contact = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/contacts/${contact.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/contacts/${contact.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(contact)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={contacts}
      isLoading={isLoading}
      pageSize={pageSize}
      showPagination={true}
      showRowSelection={false} // We handle selection manually in columns
      onRowSelectionChange={onRowSelectionChange}
      emptyMessage="No contacts found"
      emptyDescription="Get started by adding your first contact"
    />
  );
}

// Helper function to get initials from contact
function getInitials(contact: Contact): string {
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
}

// Bulk actions bar component
interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onChangeStage: () => void;
  onAddTags: () => void;
  onAssign: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onChangeStage,
  onAddTags,
  onAssign,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={onChangeStage}>
          Change Type
        </Button>
        <Button variant="ghost" size="sm" onClick={onAddTags}>
          Add Tags
        </Button>
        <Button variant="ghost" size="sm" onClick={onAssign}>
          Assign
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          Delete
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  );
}
