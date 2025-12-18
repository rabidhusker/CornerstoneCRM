"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ContactHeader } from "@/components/features/contacts/contact-header";
import { ContactInfoCard } from "@/components/features/contacts/contact-info-card";
import { ContactActivityTimeline } from "@/components/features/contacts/contact-activity-timeline";
import { ContactDeals } from "@/components/features/contacts/contact-deals";
import { ContactTasks } from "@/components/features/contacts/contact-tasks";
import { AddActivityDialog } from "@/components/features/contacts/add-activity-dialog";
import { useContact } from "@/lib/hooks/use-contacts";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const [showAddActivity, setShowAddActivity] = React.useState(false);

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
              view it.
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
          title=""
          breadcrumbs={[
            { label: "Contacts", href: "/dashboard/contacts" },
            { label: displayName },
          ]}
        />
      </ShellHeader>

      <ShellContent className="space-y-6">
        {/* Contact Header */}
        <ContactHeader contact={contact} />

        {/* Two-column layout on desktop */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Contact info */}
          <div className="lg:col-span-1 space-y-6">
            <ContactInfoCard contact={contact} />
            <ContactTasks contactId={contact.id} />
          </div>

          {/* Right column - Activity and deals */}
          <div className="lg:col-span-2 space-y-6">
            <ContactActivityTimeline
              contactId={contact.id}
              onAddActivity={() => setShowAddActivity(true)}
            />
            <ContactDeals contactId={contact.id} />
          </div>
        </div>
      </ShellContent>

      {/* Add Activity Dialog */}
      <AddActivityDialog
        contactId={contact.id}
        open={showAddActivity}
        onOpenChange={setShowAddActivity}
      />
    </Shell>
  );
}
