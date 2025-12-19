"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { FormSettings as FormSettingsType } from "@/types/form";

interface FormSettingsProps {
  settings: FormSettingsType;
  onChange: (settings: Partial<FormSettingsType>) => void;
}

export function FormSettings({ settings, onChange }: FormSettingsProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
          <CardDescription>
            Configure the basic settings for your form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={settings.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Contact Form"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description">Description</Label>
            <Textarea
              id="form-description"
              value={settings.description || ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="A brief description of your form"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Button</CardTitle>
          <CardDescription>
            Customize the submit button appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="submit-text">Button Text</Label>
            <Input
              id="submit-text"
              value={settings.submitButtonText}
              onChange={(e) => onChange({ submitButtonText: e.target.value })}
              placeholder="Submit"
            />
          </div>

          <div className="space-y-2">
            <Label>Button Alignment</Label>
            <Select
              value={settings.submitButtonAlign}
              onValueChange={(value) =>
                onChange({
                  submitButtonAlign: value as "left" | "center" | "right",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* After Submission */}
      <Card>
        <CardHeader>
          <CardTitle>After Submission</CardTitle>
          <CardDescription>
            Configure what happens after a user submits the form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="success-message">Success Message</Label>
            <Textarea
              id="success-message"
              value={settings.successMessage || ""}
              onChange={(e) => onChange({ successMessage: e.target.value })}
              placeholder="Thank you for your submission!"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Displayed after successful submission (if no redirect URL is set)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect-url">Redirect URL</Label>
            <Input
              id="redirect-url"
              value={settings.redirectUrl || ""}
              onChange={(e) => onChange({ redirectUrl: e.target.value })}
              placeholder="https://example.com/thank-you"
            />
            <p className="text-xs text-muted-foreground">
              Redirect users to this URL after submission (overrides success
              message)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure email notifications for form submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-email">Notification Email</Label>
            <Input
              id="notification-email"
              type="email"
              value={settings.notificationEmail || ""}
              onChange={(e) => onChange({ notificationEmail: e.target.value })}
              placeholder="notifications@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Receive an email notification for each submission
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-subject">Email Subject</Label>
            <Input
              id="notification-subject"
              value={settings.notificationSubject || ""}
              onChange={(e) => onChange({ notificationSubject: e.target.value })}
              placeholder="New form submission: {{form_name}}"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-response">Auto-Response Email</Label>
              <p className="text-xs text-muted-foreground">
                Send an automatic confirmation email to submitters
              </p>
            </div>
            <Switch
              id="auto-response"
              checked={settings.autoResponseEnabled}
              onCheckedChange={(checked) =>
                onChange({ autoResponseEnabled: checked })
              }
            />
          </div>

          {settings.autoResponseEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="auto-response-subject">Subject</Label>
                <Input
                  id="auto-response-subject"
                  value={settings.autoResponseSubject || ""}
                  onChange={(e) =>
                    onChange({ autoResponseSubject: e.target.value })
                  }
                  placeholder="Thanks for contacting us!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-response-message">Message</Label>
                <Textarea
                  id="auto-response-message"
                  value={settings.autoResponseMessage || ""}
                  onChange={(e) =>
                    onChange({ autoResponseMessage: e.target.value })
                  }
                  placeholder="Thank you for reaching out. We'll get back to you shortly."
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Spam Protection */}
      <Card>
        <CardHeader>
          <CardTitle>Spam Protection</CardTitle>
          <CardDescription>
            Protect your form from spam submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="honeypot">Honeypot Field</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        A hidden field that catches bots. If filled, the
                        submission is rejected.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">
                Basic spam protection using a hidden field
              </p>
            </div>
            <Switch
              id="honeypot"
              checked={settings.honeypotEnabled}
              onCheckedChange={(checked) =>
                onChange({ honeypotEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recaptcha">reCAPTCHA</Label>
              <p className="text-xs text-muted-foreground">
                Add Google reCAPTCHA verification
              </p>
            </div>
            <Switch
              id="recaptcha"
              checked={settings.recaptchaEnabled}
              onCheckedChange={(checked) =>
                onChange({ recaptchaEnabled: checked })
              }
            />
          </div>

          {settings.recaptchaEnabled && (
            <div className="space-y-2">
              <Label htmlFor="recaptcha-key">reCAPTCHA Site Key</Label>
              <Input
                id="recaptcha-key"
                value={settings.recaptchaSiteKey || ""}
                onChange={(e) => onChange({ recaptchaSiteKey: e.target.value })}
                placeholder="Your reCAPTCHA site key"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Creation</CardTitle>
          <CardDescription>
            Configure how form submissions create or update contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="create-contact">Create Contact</Label>
              <p className="text-xs text-muted-foreground">
                Automatically create a contact from form submissions
              </p>
            </div>
            <Switch
              id="create-contact"
              checked={settings.createContact}
              onCheckedChange={(checked) =>
                onChange({ createContact: checked })
              }
            />
          </div>

          {settings.createContact && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="update-contact">Update Existing</Label>
                  <p className="text-xs text-muted-foreground">
                    Update contact if email already exists
                  </p>
                </div>
                <Switch
                  id="update-contact"
                  checked={settings.updateExistingContact}
                  onCheckedChange={(checked) =>
                    onChange({ updateExistingContact: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-tags">Tags</Label>
                <Input
                  id="contact-tags"
                  value={(settings.contactTags || []).join(", ")}
                  onChange={(e) =>
                    onChange({
                      contactTags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="lead, form-submission, newsletter"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated tags to apply to new contacts
                </p>
              </div>

              <div className="space-y-2">
                <Label>Lifecycle Stage</Label>
                <Select
                  value={settings.contactLifecycleStage || ""}
                  onValueChange={(value) =>
                    onChange({ contactLifecycleStage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lifecycle stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="marketing_qualified">
                      Marketing Qualified Lead
                    </SelectItem>
                    <SelectItem value="sales_qualified">
                      Sales Qualified Lead
                    </SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Workflow Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Trigger</CardTitle>
          <CardDescription>
            Trigger a workflow when the form is submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-id">Workflow ID</Label>
            <Input
              id="workflow-id"
              value={settings.triggerWorkflowId || ""}
              onChange={(e) => onChange({ triggerWorkflowId: e.target.value })}
              placeholder="Enter workflow ID to trigger"
            />
            <p className="text-xs text-muted-foreground">
              The workflow will be triggered with the submission data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
