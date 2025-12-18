"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Loader2, Upload, Download } from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast";
import { ContactFilters } from "@/components/features/contacts/contact-filters";
import { ContactsTable, BulkActionsBar } from "@/components/features/contacts/contacts-table";
import { ImportContactsDialog } from "@/components/features/contacts/import-contacts-dialog";
import {
  useContacts,
  useDeleteContact,
  useBulkDeleteContacts,
} from "@/lib/hooks/use-contacts";
import type { Contact, ContactFilters as ContactFiltersType } from "@/types/contact";

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [filters, setFilters] = React.useState<ContactFiltersType>({});
  const [selectedContacts, setSelectedContacts] = React.useState<Contact[]>([]);
  const [contactToDelete, setContactToDelete] = React.useState<Contact | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch contacts
  const { data, isLoading, isError } = useContacts({
    filters: {
      ...filters,
      search: debouncedSearch || undefined,
    },
    page,
    pageSize,
  });

  // Mutations
  const deleteContactMutation = useDeleteContact();
  const bulkDeleteMutation = useBulkDeleteContacts();

  // Handle single delete
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContactMutation.mutateAsync(contactToDelete.id);
      const contactName = `${contactToDelete.first_name || ""} ${contactToDelete.last_name || ""}`.trim();
      toast({
        title: "Contact deleted",
        description: `${contactName || contactToDelete.email || "Contact"} has been deleted.`,
      });
      setContactToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(selectedContacts.map((c) => c.id));
      toast({
        title: "Contacts deleted",
        description: `${selectedContacts.length} contacts have been deleted.`,
      });
      setSelectedContacts([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contacts. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ContactFiltersType) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  // Placeholder handlers for bulk actions (to be implemented)
  const handleChangeStage = () => {
    toast({
      title: "Coming soon",
      description: "Bulk stage change will be available soon.",
    });
  };

  const handleAddTags = () => {
    toast({
      title: "Coming soon",
      description: "Bulk tag addition will be available soon.",
    });
  };

  const handleAssign = () => {
    toast({
      title: "Coming soon",
      description: "Bulk assignment will be available soon.",
    });
  };

  // Export contacts to CSV
  const handleExport = () => {
    if (!data?.contacts || data.contacts.length === 0) {
      toast({
        title: "No contacts to export",
        description: "There are no contacts matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    const contacts = data.contacts;
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Job Title",
      "Address",
      "City",
      "State",
      "ZIP",
      "Country",
      "Type",
      "Status",
      "Source",
      "Tags",
      "Created At",
    ];

    const rows = contacts.map((contact) => [
      contact.first_name || "",
      contact.last_name || "",
      contact.email || "",
      contact.phone || "",
      contact.company_name || "",
      contact.job_title || "",
      contact.address_line1 || "",
      contact.city || "",
      contact.state || "",
      contact.zip_code || "",
      contact.country || "",
      contact.type || "",
      contact.status || "",
      contact.source || "",
      (contact.tags || []).join(", "),
      contact.created_at ? new Date(contact.created_at).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Export complete",
      description: `${contacts.length} contacts exported to CSV.`,
    });
  };

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title="Contacts"
          description="Manage your contacts and leads"
          breadcrumbs={[{ label: "Contacts" }]}
          actions={
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import from CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button asChild>
                <Link href="/dashboard/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Link>
              </Button>
            </div>
          }
        />
      </ShellHeader>

      <ShellContent>
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ContactFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">
              Failed to load contacts. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Contacts Table */}
        <ContactsTable
          contacts={data?.contacts || []}
          isLoading={isLoading}
          pageSize={pageSize}
          onRowSelectionChange={setSelectedContacts}
          onDelete={setContactToDelete}
        />

        {/* Pagination info */}
        {data?.pagination && data.pagination.total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {((page - 1) * pageSize) + 1} to{" "}
              {Math.min(page * pageSize, data.pagination.total)} of{" "}
              {data.pagination.total} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </ShellContent>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedContacts.length}
        onDelete={() => setShowBulkDeleteDialog(true)}
        onChangeStage={handleChangeStage}
        onAddTags={handleAddTags}
        onAssign={handleAssign}
        onClearSelection={() => setSelectedContacts([])}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {contactToDelete
                  ? `${contactToDelete.first_name || ""} ${contactToDelete.last_name || ""}`.trim() ||
                    contactToDelete.email ||
                    "this contact"
                  : "this contact"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContactMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedContacts.length} contacts?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContacts.length} contacts?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Contacts Dialog */}
      <ImportContactsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </Shell>
  );
}
