"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Building2,
  MapPin,
  Settings2,
  Tags,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useCreateContact, useUpdateContact } from "@/lib/hooks/use-contacts";
import {
  contactFormSchema,
  transformDbToContactForm,
  type ContactFormSchemaType,
} from "@/lib/validations/contact";
import type { Contact } from "@/types/contact";
import { contactTypeConfig, contactStatusConfig } from "@/types/contact";
import { TagSelector } from "./tag-selector";
import { CustomFieldsEditor } from "./custom-fields-editor";

interface ContactFormProps {
  contact?: Contact;
  mode: "create" | "edit";
}

// Lead source options
const leadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "cold_call", label: "Cold Call" },
  { value: "trade_show", label: "Trade Show" },
  { value: "advertisement", label: "Advertisement" },
  { value: "other", label: "Other" },
];

export function ContactForm({ contact, mode }: ContactFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [openSections, setOpenSections] = React.useState({
    basic: true,
    company: true,
    address: false,
    crm: true,
    tags: false,
    custom: false,
  });

  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();

  const defaultValues: ContactFormSchemaType = React.useMemo(() => {
    if (contact) {
      return transformDbToContactForm(contact as unknown as Record<string, unknown>);
    }
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      jobTitle: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
      type: "buyer",
      status: "active",
      source: "",
      sourceDetail: "",
      tags: [],
      assignedTo: "",
      customFields: {},
    };
  }, [contact]);

  const form = useForm<ContactFormSchemaType>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = async (data: ContactFormSchemaType) => {
    try {
      if (mode === "create") {
        await createContactMutation.mutateAsync({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          type: data.type,
          status: data.status,
          source: data.source,
          sourceDetail: data.sourceDetail,
          tags: data.tags,
          assignedTo: data.assignedTo,
          customFields: data.customFields,
        });
        toast({
          title: "Contact created",
          description: `${data.firstName} ${data.lastName} has been created.`,
        });
        router.push("/dashboard/contacts");
      } else if (contact) {
        await updateContactMutation.mutateAsync({
          id: contact.id,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            companyName: data.companyName,
            jobTitle: data.jobTitle,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
            type: data.type,
            status: data.status,
            source: data.source,
            sourceDetail: data.sourceDetail,
            tags: data.tags,
            assignedTo: data.assignedTo,
            customFields: data.customFields,
          },
        });
        toast({
          title: "Contact updated",
          description: `${data.firstName} ${data.lastName} has been updated.`,
        });
        router.push(`/dashboard/contacts/${contact.id}`);
      }
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${mode} contact. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const isSubmitting =
    createContactMutation.isPending || updateContactMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <CollapsibleSection
          title="Basic Information"
          description="Name and contact details"
          icon={User}
          open={openSections.basic}
          onToggle={() => toggleSection("basic")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>

        {/* Company Information */}
        <CollapsibleSection
          title="Company"
          description="Work and organization details"
          icon={Building2}
          open={openSections.company}
          onToggle={() => toggleSection("company")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Marketing Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>

        {/* Address */}
        <CollapsibleSection
          title="Address"
          description="Physical address information"
          icon={MapPin}
          open={openSections.address}
          onToggle={() => toggleSection("address")}
        >
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apt, Suite, etc.</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP / Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* CRM Details */}
        <CollapsibleSection
          title="CRM Details"
          description="Type, status, and lead source"
          icon={Settings2}
          open={openSections.crm}
          onToggle={() => toggleSection("crm")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(contactTypeConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(contactStatusConfig).map(
                        ([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leadSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sourceDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Detail</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional details" {...field} />
                  </FormControl>
                  <FormDescription>
                    E.g., referrer name, campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          description="Categorize and organize contacts"
          icon={Tags}
          open={openSections.tags}
          onToggle={() => toggleSection("tags")}
        >
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Add tags to organize and filter contacts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Custom Fields */}
        <CollapsibleSection
          title="Custom Fields"
          description="Additional information"
          icon={Settings2}
          open={openSections.custom}
          onToggle={() => toggleSection("custom")}
        >
          <FormField
            control={form.control}
            name="customFields"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CustomFieldsEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Contact" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  description,
  icon: Icon,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
