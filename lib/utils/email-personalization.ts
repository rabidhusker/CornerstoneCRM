/**
 * Email Personalization Utilities
 *
 * Parse and replace personalization tokens in email content
 */

import type { Contact } from "@/types/contact";

// Token definition
export interface PersonalizationToken {
  token: string;
  label: string;
  description: string;
  field: string;
  fallback?: string;
}

// Available personalization tokens
export const availableTokens: PersonalizationToken[] = [
  {
    token: "{{first_name}}",
    label: "First Name",
    description: "Contact's first name",
    field: "first_name",
    fallback: "there",
  },
  {
    token: "{{last_name}}",
    label: "Last Name",
    description: "Contact's last name",
    field: "last_name",
    fallback: "",
  },
  {
    token: "{{full_name}}",
    label: "Full Name",
    description: "Contact's full name",
    field: "full_name",
    fallback: "Valued Customer",
  },
  {
    token: "{{email}}",
    label: "Email",
    description: "Contact's email address",
    field: "email",
    fallback: "",
  },
  {
    token: "{{phone}}",
    label: "Phone",
    description: "Contact's phone number",
    field: "phone",
    fallback: "",
  },
  {
    token: "{{company}}",
    label: "Company",
    description: "Contact's company name",
    field: "company_name",
    fallback: "your company",
  },
  {
    token: "{{job_title}}",
    label: "Job Title",
    description: "Contact's job title",
    field: "job_title",
    fallback: "",
  },
  {
    token: "{{address}}",
    label: "Address",
    description: "Contact's street address",
    field: "address_line1",
    fallback: "",
  },
  {
    token: "{{city}}",
    label: "City",
    description: "Contact's city",
    field: "city",
    fallback: "",
  },
  {
    token: "{{state}}",
    label: "State",
    description: "Contact's state/province",
    field: "state",
    fallback: "",
  },
  {
    token: "{{zip_code}}",
    label: "Zip Code",
    description: "Contact's postal code",
    field: "zip_code",
    fallback: "",
  },
  {
    token: "{{country}}",
    label: "Country",
    description: "Contact's country",
    field: "country",
    fallback: "USA",
  },
];

// Sample contact for preview
export const sampleContact: Partial<Contact> & { full_name: string } = {
  first_name: "John",
  last_name: "Smith",
  full_name: "John Smith",
  email: "john.smith@example.com",
  phone: "(555) 123-4567",
  company_name: "ABC Realty",
  job_title: "Real Estate Agent",
  address_line1: "123 Main Street",
  city: "Austin",
  state: "TX",
  zip_code: "78701",
  country: "USA",
};

/**
 * Get the value from a contact for a specific field
 */
function getContactValue(
  contact: Partial<Contact> & { full_name?: string },
  field: string,
  fallback: string = ""
): string {
  // Handle full_name specially
  if (field === "full_name") {
    if (contact.full_name) {
      return contact.full_name;
    }
    const firstName = contact.first_name || "";
    const lastName = contact.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || fallback;
  }

  // Get value from contact object
  const value = contact[field as keyof typeof contact];

  if (value !== undefined && value !== null && value !== "") {
    return String(value);
  }

  return fallback;
}

/**
 * Parse and replace personalization tokens in template content
 *
 * @param template - The email template content (HTML or plain text)
 * @param contact - The contact data to use for personalization
 * @param options - Additional options for parsing
 * @returns The personalized content
 */
export function parsePersonalizationTokens(
  template: string,
  contact: Partial<Contact> & { full_name?: string },
  options: {
    useFallbacks?: boolean;
    customFields?: Record<string, string>;
  } = {}
): string {
  const { useFallbacks = true, customFields = {} } = options;

  let result = template;

  // Replace standard tokens
  for (const tokenDef of availableTokens) {
    const value = getContactValue(
      contact,
      tokenDef.field,
      useFallbacks ? tokenDef.fallback : ""
    );

    // Replace all occurrences of the token
    result = result.replace(new RegExp(escapeRegExp(tokenDef.token), "g"), value);
  }

  // Replace custom field tokens
  // Format: {{custom:field_name}}
  const customFieldRegex = /\{\{custom:([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  result = result.replace(customFieldRegex, (match, fieldName) => {
    // Check custom fields passed in options
    if (customFields[fieldName]) {
      return customFields[fieldName];
    }

    // Check contact's custom_fields
    if (
      contact.custom_fields &&
      typeof contact.custom_fields === "object" &&
      fieldName in (contact.custom_fields as Record<string, unknown>)
    ) {
      const value = (contact.custom_fields as Record<string, unknown>)[fieldName];
      return value !== undefined && value !== null ? String(value) : "";
    }

    return useFallbacks ? "" : match;
  });

  return result;
}

/**
 * Generate preview content using sample contact data
 */
export function generatePreview(template: string): string {
  return parsePersonalizationTokens(template, sampleContact);
}

/**
 * Extract all tokens used in a template
 */
export function extractUsedTokens(template: string): string[] {
  const tokenRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_:]*)\}\}/g;
  const tokens: string[] = [];
  let match;

  while ((match = tokenRegex.exec(template)) !== null) {
    const fullToken = `{{${match[1]}}}`;
    if (!tokens.includes(fullToken)) {
      tokens.push(fullToken);
    }
  }

  return tokens;
}

/**
 * Validate that all tokens in a template are valid
 */
export function validateTokens(template: string): {
  valid: boolean;
  invalidTokens: string[];
} {
  const usedTokens = extractUsedTokens(template);
  const validTokenStrings = availableTokens.map((t) => t.token);
  const invalidTokens: string[] = [];

  for (const token of usedTokens) {
    // Check if it's a standard token
    if (validTokenStrings.includes(token)) {
      continue;
    }

    // Check if it's a custom field token
    if (token.startsWith("{{custom:") && token.endsWith("}}")) {
      continue;
    }

    invalidTokens.push(token);
  }

  return {
    valid: invalidTokens.length === 0,
    invalidTokens,
  };
}

/**
 * Convert plain text to basic HTML
 */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get token suggestions based on partial input
 */
export function getTokenSuggestions(partialToken: string): PersonalizationToken[] {
  const searchTerm = partialToken.toLowerCase().replace(/[{}]/g, "");

  if (!searchTerm) {
    return availableTokens;
  }

  return availableTokens.filter(
    (token) =>
      token.label.toLowerCase().includes(searchTerm) ||
      token.field.toLowerCase().includes(searchTerm) ||
      token.token.toLowerCase().includes(searchTerm)
  );
}
