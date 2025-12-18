"use client";

import * as React from "react";
import { Pencil, X, Check, Mail, Phone, MapPin, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpdateContact } from "@/lib/hooks/use-contacts";
import type { Contact, ContactFormData } from "@/types/contact";
import { contactStatusConfig } from "@/types/contact";

interface ContactInfoCardProps {
  contact: Contact;
}

export function ContactInfoCard({ contact }: ContactInfoCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<ContactFormData>>({});

  const updateContactMutation = useUpdateContact();

  const resetForm = React.useCallback(() => {
    setFormData({
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      companyName: contact.company_name || "",
      jobTitle: contact.job_title || "",
      addressLine1: contact.address_line1 || "",
      addressLine2: contact.address_line2 || "",
      city: contact.city || "",
      state: contact.state || "",
      zipCode: contact.zip_code || "",
      country: contact.country || "",
      source: contact.source || "",
      sourceDetail: contact.source_detail || "",
    });
  }, [contact]);

  React.useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: formData,
      });
      toast({
        title: "Contact updated",
        description: "Contact information has been saved.",
      });
      setIsEditing(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contact.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatAddress = () => {
    const parts = [
      contact.address_line1,
      contact.address_line2,
      contact.city,
      contact.state,
      contact.zip_code,
      contact.country,
    ].filter(Boolean);
    return parts.join(", ") || null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <CardDescription>Personal and contact details</CardDescription>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateContactMutation.isPending}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateContactMutation.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant="outline">
            {contactStatusConfig[contact.status]?.label || contact.status}
          </Badge>
        </div>

        <Separator />

        {/* Basic Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Basic Information</h4>

          {isEditing ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="companyName">Company</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ""}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle || ""}
                    onChange={(e) => handleChange("jobTitle", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.company_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.company_name}</span>
                  {contact.job_title && (
                    <span className="text-muted-foreground">
                      ({contact.job_title})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Contact Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Contact Details</h4>

          {isEditing ? (
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contact.email}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  No email
                </div>
              )}
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.phone}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  No phone
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Address</h4>

          {isEditing ? (
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="addressLine1">Street Address</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1 || ""}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addressLine2">Apt, Suite, etc.</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2 || ""}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ""}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ""}
                    onChange={(e) => handleChange("country", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {formatAddress() ? (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{formatAddress()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  No address
                </div>
              )}
            </div>
          )}
        </div>

        {/* Source */}
        {(contact.source || isEditing) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Source</h4>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source || ""}
                      onChange={(e) => handleChange("source", e.target.value)}
                      placeholder="e.g., Website, Referral"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sourceDetail">Source Detail</Label>
                    <Input
                      id="sourceDetail"
                      value={formData.sourceDetail || ""}
                      onChange={(e) =>
                        handleChange("sourceDetail", e.target.value)
                      }
                      placeholder="Additional details"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <span>{contact.source}</span>
                  {contact.source_detail && (
                    <span className="text-muted-foreground">
                      {" "}
                      - {contact.source_detail}
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
