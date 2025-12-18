"use client";

import * as React from "react";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FieldType = "text" | "number" | "date" | "select" | "checkbox";

interface CustomField {
  key: string;
  type: FieldType;
  label: string;
  options?: string[]; // For select type
}

interface CustomFieldsEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

// Predefined custom field definitions (in a real app, these would come from settings/API)
const predefinedFields: CustomField[] = [
  { key: "preferred_contact_method", type: "select", label: "Preferred Contact Method", options: ["Email", "Phone", "Text"] },
  { key: "budget_min", type: "number", label: "Budget Min ($)" },
  { key: "budget_max", type: "number", label: "Budget Max ($)" },
  { key: "property_preference", type: "text", label: "Property Preferences" },
  { key: "move_in_date", type: "date", label: "Target Move-in Date" },
  { key: "pre_approved", type: "checkbox", label: "Pre-approved for Financing" },
  { key: "newsletter", type: "checkbox", label: "Newsletter Subscription" },
];

export function CustomFieldsEditor({ value, onChange }: CustomFieldsEditorProps) {
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newFieldKey, setNewFieldKey] = React.useState("");
  const [newFieldLabel, setNewFieldLabel] = React.useState("");
  const [newFieldType, setNewFieldType] = React.useState<FieldType>("text");

  // Get all fields (predefined + custom) that have values or are predefined
  const activeFields = React.useMemo(() => {
    const fields: CustomField[] = [];

    // Add predefined fields
    predefinedFields.forEach((field) => {
      fields.push(field);
    });

    // Add any custom fields from value that aren't predefined
    Object.keys(value).forEach((key) => {
      if (!predefinedFields.find((f) => f.key === key)) {
        fields.push({
          key,
          type: typeof value[key] === "boolean" ? "checkbox" : "text",
          label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        });
      }
    });

    return fields;
  }, [value]);

  const handleFieldChange = (key: string, fieldValue: unknown) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  const handleRemoveField = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };

  const handleAddField = () => {
    if (!newFieldKey.trim()) return;

    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");
    const defaultValue = newFieldType === "checkbox" ? false : newFieldType === "number" ? 0 : "";

    onChange({
      ...value,
      [key]: defaultValue,
    });

    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Existing fields */}
      {activeFields.length > 0 ? (
        <div className="space-y-3">
          {activeFields.map((field) => (
            <CustomFieldInput
              key={field.key}
              field={field}
              value={value[field.key]}
              onChange={(v) => handleFieldChange(field.key, v)}
              onRemove={
                !predefinedFields.find((f) => f.key === field.key)
                  ? () => handleRemoveField(field.key)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No custom fields configured. Add fields to store additional information.
        </p>
      )}

      {/* Add new field button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a new custom field to store additional information about this contact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label</Label>
              <Input
                id="fieldLabel"
                placeholder="e.g., Referral Source"
                value={newFieldLabel}
                onChange={(e) => {
                  setNewFieldLabel(e.target.value);
                  setNewFieldKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldKey">Field Key</Label>
              <Input
                id="fieldKey"
                placeholder="e.g., referral_source"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used internally to identify this field
              </p>
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddField} disabled={!newFieldKey.trim()}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CustomFieldInputProps {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
  onRemove?: () => void;
}

function CustomFieldInput({ field, value, onChange, onRemove }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : "")}
            placeholder="0"
          />
        );

      case "date":
        const dateValue = value ? new Date(value as string) : undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "select":
        return (
          <Select value={(value as string) || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={(value as boolean) || false}
              onCheckedChange={onChange}
            />
            <label
              htmlFor={field.key}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 space-y-1">
        {field.type !== "checkbox" && (
          <Label className="text-sm">{field.label}</Label>
        )}
        {renderInput()}
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
