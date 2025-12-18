"use client";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/features/contacts/contact-form";

export default function NewContactPage() {
  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title="New Contact"
          description="Create a new contact in your CRM"
          breadcrumbs={[
            { label: "Contacts", href: "/dashboard/contacts" },
            { label: "New Contact" },
          ]}
        />
      </ShellHeader>

      <ShellContent>
        <div className="max-w-3xl">
          <ContactForm mode="create" />
        </div>
      </ShellContent>
    </Shell>
  );
}
