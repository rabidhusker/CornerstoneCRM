"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/features/contacts/contact-form";
import { useContact } from "@/lib/hooks/use-contacts";

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const { data: contact, isLoading, isError } = useContact(contactId);

  if (isLoading) {
    return (
      <Shell>
        <ShellContent className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading contact...</p>
          </div>
        </ShellContent>
      </Shell>
    );
  }

  if (isError || !contact) {
    return (
      <Shell>
        <ShellHeader>
          <PageHeader
            title="Contact Not Found"
            description="The contact you're looking for doesn't exist or has been deleted."
            breadcrumbs={[
              { label: "Contacts", href: "/dashboard/contacts" },
              { label: "Not Found" },
            ]}
          />
        </ShellHeader>
        <ShellContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              This contact may have been deleted or you don&apos;t have permission to
              edit it.
            </p>
            <Button onClick={() => router.push("/dashboard/contacts")}>
              Back to Contacts
            </Button>
          </div>
        </ShellContent>
      </Shell>
    );
  }

  const displayName =
    `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
    contact.email ||
    "Unknown";

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title={`Edit ${displayName}`}
          description="Update contact information"
          breadcrumbs={[
            { label: "Contacts", href: "/dashboard/contacts" },
            { label: displayName, href: `/dashboard/contacts/${contact.id}` },
            { label: "Edit" },
          ]}
        />
      </ShellHeader>

      <ShellContent>
        <div className="max-w-3xl">
          <ContactForm mode="edit" contact={contact} />
        </div>
      </ShellContent>
    </Shell>
  );
}
