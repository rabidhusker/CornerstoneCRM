import type { Database } from "./database";

// Re-export base types from database
export type Form = Database["public"]["Tables"]["crm_forms"]["Row"];
export type FormInsert = Database["public"]["Tables"]["crm_forms"]["Insert"];
export type FormUpdate = Database["public"]["Tables"]["crm_forms"]["Update"];

export type FormSubmission = Database["public"]["Tables"]["crm_form_submissions"]["Row"];
export type FormSubmissionInsert = Database["public"]["Tables"]["crm_form_submissions"]["Insert"];

// Form status
export type FormStatus = "draft" | "active" | "inactive";

// Field types
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "number"
  | "url"
  | "hidden";

// Validation rules
export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "pattern" | "min" | "max" | "email" | "phone" | "url";
  value?: string | number | boolean;
  message?: string;
}

// Conditional logic
export interface ConditionalLogic {
  enabled: boolean;
  action: "show" | "hide";
  rules: {
    fieldId: string;
    operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_empty" | "is_not_empty";
    value: string;
  }[];
  match: "all" | "any";
}

// Select/Radio options
export interface FieldOption {
  label: string;
  value: string;
}

// Form field definition
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  validation: ValidationRule[];
  options?: FieldOption[];
  conditionalLogic?: ConditionalLogic;
  defaultValue?: string;
  // File upload specific
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  // Number specific
  min?: number;
  max?: number;
  step?: number;
  // Layout
  width?: "full" | "half" | "third";
}

// Form configuration
export interface FormConfig {
  fields: FormField[];
}

// Form settings
export interface FormSettings {
  // Basic
  name: string;
  description?: string;

  // Submit button
  submitButtonText: string;
  submitButtonAlign: "left" | "center" | "right";

  // After submission
  successMessage?: string;
  redirectUrl?: string;

  // Notifications
  notificationEmail?: string;
  notificationSubject?: string;
  autoResponseEnabled: boolean;
  autoResponseSubject?: string;
  autoResponseMessage?: string;

  // Spam protection
  honeypotEnabled: boolean;
  recaptchaEnabled: boolean;
  recaptchaSiteKey?: string;

  // Contact creation
  createContact: boolean;
  updateExistingContact: boolean;
  contactTags?: string[];
  contactLifecycleStage?: string;

  // Workflow trigger
  triggerWorkflowId?: string;
}

// Form styling
export interface FormStyles {
  // Layout
  maxWidth: string;
  padding: string;
  borderRadius: string;
  alignment: "left" | "center" | "right";

  // Colors
  backgroundColor: string;
  textColor: string;
  labelColor: string;
  borderColor: string;
  primaryColor: string;
  errorColor: string;

  // Typography
  fontFamily: string;
  fontSize: string;
  labelFontSize: string;
  labelFontWeight: string;

  // Fields
  fieldBackgroundColor: string;
  fieldBorderColor: string;
  fieldBorderRadius: string;
  fieldPadding: string;

  // Button
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBorderRadius: string;
  buttonPadding: string;
  buttonFontWeight: string;

  // Custom CSS
  customCss?: string;
}

// Default styles
export const defaultFormStyles: FormStyles = {
  maxWidth: "600px",
  padding: "24px",
  borderRadius: "8px",
  alignment: "center",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  labelColor: "#374151",
  borderColor: "#e5e7eb",
  primaryColor: "#3b82f6",
  errorColor: "#ef4444",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "16px",
  labelFontSize: "14px",
  labelFontWeight: "500",
  fieldBackgroundColor: "#ffffff",
  fieldBorderColor: "#d1d5db",
  fieldBorderRadius: "6px",
  fieldPadding: "10px 12px",
  buttonBackgroundColor: "#3b82f6",
  buttonTextColor: "#ffffff",
  buttonBorderRadius: "6px",
  buttonPadding: "10px 20px",
  buttonFontWeight: "500",
};

// Default settings
export const defaultFormSettings: FormSettings = {
  name: "",
  submitButtonText: "Submit",
  submitButtonAlign: "left",
  successMessage: "Thank you for your submission!",
  autoResponseEnabled: false,
  honeypotEnabled: true,
  recaptchaEnabled: false,
  createContact: true,
  updateExistingContact: true,
};

// Form with creator info
export interface FormWithCreator extends Form {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Form stats
export interface FormStats {
  totalSubmissions: number;
  uniqueSubmissions: number;
  conversionRate: number;
  lastSubmissionAt?: string;
}

// Field type configuration
export const fieldTypeConfig: Record<
  FormFieldType,
  { label: string; description: string; icon: string }
> = {
  text: {
    label: "Text",
    description: "Single line text input",
    icon: "type",
  },
  email: {
    label: "Email",
    description: "Email address input",
    icon: "mail",
  },
  phone: {
    label: "Phone",
    description: "Phone number input",
    icon: "phone",
  },
  textarea: {
    label: "Text Area",
    description: "Multi-line text input",
    icon: "align-left",
  },
  select: {
    label: "Dropdown",
    description: "Select from options",
    icon: "chevron-down",
  },
  checkbox: {
    label: "Checkbox",
    description: "Single or multiple checkboxes",
    icon: "check-square",
  },
  radio: {
    label: "Radio",
    description: "Single choice from options",
    icon: "circle-dot",
  },
  date: {
    label: "Date",
    description: "Date picker",
    icon: "calendar",
  },
  file: {
    label: "File Upload",
    description: "Upload files",
    icon: "upload",
  },
  number: {
    label: "Number",
    description: "Numeric input",
    icon: "hash",
  },
  url: {
    label: "URL",
    description: "Website URL input",
    icon: "link",
  },
  hidden: {
    label: "Hidden",
    description: "Hidden field",
    icon: "eye-off",
  },
};

// Form status configuration
export const formStatusConfig: Record<
  FormStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  active: {
    label: "Active",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  inactive: {
    label: "Inactive",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
};

// Form data for creating/updating forms
export interface FormFormData {
  name: string;
  description?: string;
  status?: FormStatus;
  config?: FormConfig;
  settings?: FormSettings;
  styles?: FormStyles;
}

// Filters for forms
export interface FormFilters {
  status?: FormStatus[];
  search?: string;
}

// Form submission data
export interface FormSubmissionData {
  formId: string;
  data: Record<string, unknown>;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
  };
}

// Create a new field with defaults
export function createFormField(type: FormFieldType, position: number): FormField {
  const baseField: FormField = {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: `${fieldTypeConfig[type].label} Field`,
    placeholder: "",
    required: false,
    validation: [],
    width: "full",
  };

  // Add type-specific defaults
  switch (type) {
    case "email":
      baseField.placeholder = "Enter your email";
      baseField.validation = [{ type: "email", message: "Please enter a valid email address" }];
      break;
    case "phone":
      baseField.placeholder = "Enter your phone number";
      baseField.validation = [{ type: "phone", message: "Please enter a valid phone number" }];
      break;
    case "url":
      baseField.placeholder = "https://example.com";
      baseField.validation = [{ type: "url", message: "Please enter a valid URL" }];
      break;
    case "select":
    case "radio":
      baseField.options = [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ];
      break;
    case "checkbox":
      baseField.options = [{ label: "I agree", value: "agree" }];
      break;
    case "file":
      baseField.acceptedFileTypes = [".pdf", ".doc", ".docx", ".jpg", ".png"];
      baseField.maxFileSize = 5;
      break;
    case "number":
      baseField.min = 0;
      baseField.step = 1;
      break;
    case "textarea":
      baseField.placeholder = "Enter your message";
      break;
  }

  return baseField;
}
