"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  DollarSign,
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreateDeal, useUpdateDeal, useDeal } from "@/lib/hooks/use-deals";
import { usePipelines, usePipeline } from "@/lib/hooks/use-pipelines";
import { useContacts } from "@/lib/hooks/use-contacts";
import type { DealWithRelations } from "@/types/deal";

// Form schema
const dealFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  contactId: z.string().min(1, "Contact is required"),
  value: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  expectedCloseDate: z.string().optional(),
  assignedTo: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  propertyZip: z.string().optional(),
  propertyType: z.string().optional(),
  propertyBedrooms: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  propertyBathrooms: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  propertySqft: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  propertyListPrice: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  tags: z.array(z.string()).optional(),
});

// Explicitly define form values type for better type inference with react-hook-form
interface DealFormValues {
  title: string;
  description?: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  value?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  propertyBedrooms?: number;
  propertyBathrooms?: number;
  propertySqft?: number;
  propertyListPrice?: number;
  tags?: string[];
}

interface DealFormProps {
  deal?: DealWithRelations;
  mode: "create" | "edit";
  defaultPipelineId?: string;
  defaultStageId?: string;
}

export function DealForm({
  deal,
  mode,
  defaultPipelineId,
  defaultStageId,
}: DealFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Contact search state
  const [contactSearch, setContactSearch] = React.useState("");
  const [contactOpen, setContactOpen] = React.useState(false);

  // Queries
  const { data: pipelinesData } = usePipelines();
  const { data: contactsData } = useContacts({
    filters: { search: contactSearch || undefined },
    pageSize: 20,
  });

  // Get current pipeline for stages
  const [selectedPipelineId, setSelectedPipelineId] = React.useState(
    deal?.pipeline_id || defaultPipelineId || ""
  );
  const { data: pipelineData } = usePipeline(selectedPipelineId || undefined);

  // Mutations
  const createDealMutation = useCreateDeal();
  const updateDealMutation = useUpdateDeal();

  // Form
  const form = useForm<DealFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dealFormSchema) as any,
    defaultValues: {
      title: deal?.title || "",
      description: deal?.description || "",
      pipelineId: deal?.pipeline_id || defaultPipelineId || "",
      stageId: deal?.stage_id || defaultStageId || "",
      contactId: deal?.contact_id || "",
      value: deal?.value || undefined,
      expectedCloseDate: deal?.expected_close_date
        ? format(new Date(deal.expected_close_date), "yyyy-MM-dd")
        : "",
      assignedTo: deal?.assigned_to || "",
      propertyAddress: deal?.property_address || "",
      propertyCity: deal?.property_city || "",
      propertyState: deal?.property_state || "",
      propertyZip: deal?.property_zip || "",
      propertyType: deal?.property_type || "",
      propertyBedrooms: deal?.property_bedrooms || undefined,
      propertyBathrooms: deal?.property_bathrooms || undefined,
      propertySqft: deal?.property_sqft || undefined,
      propertyListPrice: deal?.property_list_price || undefined,
      tags: deal?.tags || [],
    },
  });

  // Update stages when pipeline changes
  React.useEffect(() => {
    if (form.watch("pipelineId") !== selectedPipelineId) {
      setSelectedPipelineId(form.watch("pipelineId"));
      // Reset stage when pipeline changes (unless editing)
      if (mode === "create") {
        form.setValue("stageId", "");
      }
    }
  }, [form.watch("pipelineId")]);

  // Set default stage when pipeline loads
  React.useEffect(() => {
    if (pipelineData?.stages && !form.watch("stageId") && mode === "create") {
      const firstStage = pipelineData.stages[0];
      if (firstStage) {
        form.setValue("stageId", firstStage.id);
      }
    }
  }, [pipelineData?.stages]);

  const onSubmit = async (data: DealFormValues) => {
    try {
      if (mode === "create") {
        await createDealMutation.mutateAsync({
          title: data.title,
          description: data.description,
          pipelineId: data.pipelineId,
          stageId: data.stageId,
          contactId: data.contactId,
          value: data.value,
          expectedCloseDate: data.expectedCloseDate,
          assignedTo: data.assignedTo,
          propertyAddress: data.propertyAddress,
          propertyCity: data.propertyCity,
          propertyState: data.propertyState,
          propertyZip: data.propertyZip,
          propertyType: data.propertyType,
          tags: data.tags,
        });
        toast({
          title: "Deal created",
          description: `${data.title} has been created.`,
        });
        router.push("/dashboard/pipelines");
      } else if (deal) {
        await updateDealMutation.mutateAsync({
          id: deal.id,
          data: {
            title: data.title,
            description: data.description,
            pipelineId: data.pipelineId,
            stageId: data.stageId,
            contactId: data.contactId,
            value: data.value,
            expectedCloseDate: data.expectedCloseDate,
            assignedTo: data.assignedTo,
            propertyAddress: data.propertyAddress,
            propertyCity: data.propertyCity,
            propertyState: data.propertyState,
            propertyZip: data.propertyZip,
            propertyType: data.propertyType,
            tags: data.tags,
          },
        });
        toast({
          title: "Deal updated",
          description: `${data.title} has been updated.`,
        });
        router.push("/dashboard/pipelines");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} deal. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createDealMutation.isPending || updateDealMutation.isPending;
  const contacts = contactsData?.contacts || [];
  const pipelines = pipelinesData || [];
  const stages = pipelineData?.stages || [];

  // Find selected contact for display
  const selectedContact = contacts.find((c) => c.id === form.watch("contactId"));
  const selectedContactDisplay = selectedContact
    ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim()
    : deal?.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}`.trim()
    : "";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deal title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pipelineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pipeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
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
                name="stageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedPipelineId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Selector */}
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contact *</FormLabel>
                  <Popover open={contactOpen} onOpenChange={setContactOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={contactOpen}
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedContactDisplay || "Select contact"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search contacts..."
                          value={contactSearch}
                          onValueChange={setContactSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <p className="py-2 text-center text-sm">
                              No contacts found
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                router.push("/dashboard/contacts/new")
                              }
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Create new contact
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {contacts.map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={`${contact.first_name} ${contact.last_name} ${contact.email}`}
                                onSelect={() => {
                                  form.setValue("contactId", contact.id);
                                  setContactOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === contact.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                  </span>
                                  {contact.email && (
                                    <span className="text-xs text-muted-foreground">
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                router.push("/dashboard/contacts/new");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create new contact
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          className="pl-9"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deal description..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Property Information (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="propertyCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input placeholder="ZIP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
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
                        <SelectItem value="single_family">Single Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="multi_family">Multi-Family</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyListPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          className="pl-9"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
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
            {mode === "create" ? "Create Deal" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
