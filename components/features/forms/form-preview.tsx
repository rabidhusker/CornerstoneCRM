"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import { Monitor, Tablet, Smartphone, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type {
  FormField,
  FormSettings,
  FormStyles,
  ConditionalLogic,
} from "@/types/form";

type DevicePreview = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<DevicePreview, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

interface FormPreviewProps {
  fields: FormField[];
  settings: FormSettings;
  styles: FormStyles;
}

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  styles: FormStyles;
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  styles,
}: FormFieldRendererProps) {
  const commonInputStyle = {
    backgroundColor: styles.fieldBackgroundColor,
    borderColor: styles.fieldBorderColor,
    borderRadius: styles.fieldBorderRadius,
    padding: styles.fieldPadding,
    color: styles.textColor,
  };

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "url":
    case "number":
      return (
        <Input
          type={field.type === "phone" ? "tel" : field.type}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={commonInputStyle}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      );

    case "textarea":
      return (
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={commonInputStyle}
          rows={4}
        />
      );

    case "select":
      return (
        <Select value={(value as string) || ""} onValueChange={onChange}>
          <SelectTrigger style={commonInputStyle}>
            <SelectValue placeholder={field.placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return (
        <RadioGroup value={(value as string) || ""} onValueChange={onChange}>
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  style={{ color: styles.textColor }}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );

    case "checkbox":
      if (field.options && field.options.length > 1) {
        const checkedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={checkedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkedValues, option.value]);
                    } else {
                      onChange(checkedValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  style={{ color: styles.textColor }}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={(value as boolean) || false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.id} style={{ color: styles.textColor }}>
            {field.options?.[0]?.label || field.label}
          </Label>
        </div>
      );

    case "date":
      const dateValue = value ? new Date(value as string) : undefined;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
              style={commonInputStyle}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP") : field.placeholder || "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => onChange(date?.toISOString())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case "file":
      return (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center"
          style={{
            borderColor: styles.fieldBorderColor,
            backgroundColor: styles.fieldBackgroundColor,
          }}
        >
          <Input
            type="file"
            className="hidden"
            id={`file-${field.id}`}
            accept={(field.acceptedFileTypes || []).join(",")}
          />
          <Label
            htmlFor={`file-${field.id}`}
            className="cursor-pointer"
            style={{ color: styles.textColor }}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {(field.acceptedFileTypes || []).join(", ")} up to{" "}
                {field.maxFileSize || 5}MB
              </p>
            </div>
          </Label>
        </div>
      );

    case "hidden":
      return null;

    default:
      return null;
  }
}

function shouldShowField(
  field: FormField,
  formData: Record<string, unknown>,
  allFields: FormField[]
): boolean {
  if (!field.conditionalLogic?.enabled) return true;

  const { action, rules, match } = field.conditionalLogic;

  const checkRule = (rule: ConditionalLogic["rules"][0]) => {
    const sourceField = allFields.find((f) => f.id === rule.fieldId);
    if (!sourceField) return false;

    const sourceValue = formData[rule.fieldId];
    const stringValue = String(sourceValue || "");

    switch (rule.operator) {
      case "equals":
        return stringValue === rule.value;
      case "not_equals":
        return stringValue !== rule.value;
      case "contains":
        return stringValue.includes(rule.value);
      case "not_contains":
        return !stringValue.includes(rule.value);
      case "is_empty":
        return !sourceValue || stringValue === "";
      case "is_not_empty":
        return !!sourceValue && stringValue !== "";
      default:
        return false;
    }
  };

  const ruleResults = rules.map(checkRule);
  const conditionMet =
    match === "all"
      ? ruleResults.every(Boolean)
      : ruleResults.some(Boolean);

  return action === "show" ? conditionMet : !conditionMet;
}

export function FormPreview({ fields, settings, styles }: FormPreviewProps) {
  const [device, setDevice] = React.useState<DevicePreview>("desktop");
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({});
    setSubmitted(false);
  };

  const visibleFields = fields.filter((field) =>
    shouldShowField(field, formData, fields)
  );

  const buttonAlignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[settings.submitButtonAlign];

  return (
    <div className="flex flex-col h-full">
      {/* Preview Controls */}
      <div className="flex items-center justify-between border-b px-6 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={device === "tablet" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="h-4 w-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-muted/50 p-6">
        <div
          className="mx-auto transition-all duration-300"
          style={{ maxWidth: deviceWidths[device] }}
        >
          <div
            style={{
              backgroundColor: styles.backgroundColor,
              padding: styles.padding,
              borderRadius: styles.borderRadius,
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              color: styles.textColor,
              border: `1px solid ${styles.borderColor}`,
            }}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Form Submitted Successfully
                </h3>
                <p style={{ color: styles.textColor }}>
                  {settings.successMessage || "Thank you for your submission!"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {visibleFields.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Add fields to your form to see the preview
                    </p>
                  ) : (
                    visibleFields.map((field) => (
                      <div
                        key={field.id}
                        className={cn(
                          field.width === "half" && "w-1/2 inline-block pr-2",
                          field.width === "third" && "w-1/3 inline-block pr-2"
                        )}
                      >
                        {field.type !== "checkbox" && field.type !== "hidden" && (
                          <Label
                            htmlFor={field.id}
                            className="mb-2 block"
                            style={{
                              color: styles.labelColor,
                              fontSize: styles.labelFontSize,
                              fontWeight: styles.labelFontWeight,
                            }}
                          >
                            {field.label}
                            {field.required && (
                              <span style={{ color: styles.errorColor }}> *</span>
                            )}
                          </Label>
                        )}
                        <FormFieldRenderer
                          field={field}
                          value={formData[field.id]}
                          onChange={(value) => handleFieldChange(field.id, value)}
                          styles={styles}
                        />
                        {field.description && (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: styles.labelColor }}
                          >
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {visibleFields.length > 0 && (
                  <div className={cn("flex mt-6", buttonAlignClass)}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: styles.buttonBackgroundColor,
                        color: styles.buttonTextColor,
                        borderRadius: styles.buttonBorderRadius,
                        padding: styles.buttonPadding,
                        fontWeight: styles.buttonFontWeight,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {settings.submitButtonText}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Custom CSS - sanitized to prevent XSS */}
          {styles.customCss && (
            <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(styles.customCss, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) }} />
          )}
        </div>
      </div>
    </div>
  );
}
