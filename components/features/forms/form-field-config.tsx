"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type {
  FormField,
  FieldOption,
  ValidationRule,
  ConditionalLogic,
} from "@/types/form";

interface FormFieldConfigProps {
  field: FormField;
  onChange: (field: FormField) => void;
  allFields: FormField[];
}

export function FormFieldConfig({
  field,
  onChange,
  allFields,
}: FormFieldConfigProps) {
  const updateField = (updates: Partial<FormField>) => {
    onChange({ ...field, ...updates });
  };

  const addOption = () => {
    const options = field.options || [];
    const newOption: FieldOption = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    updateField({ options: [...options, newOption] });
  };

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], ...updates };
    updateField({ options });
  };

  const removeOption = (index: number) => {
    const options = (field.options || []).filter((_, i) => i !== index);
    updateField({ options });
  };

  const addValidationRule = (type: ValidationRule["type"]) => {
    const rules = field.validation || [];
    const newRule: ValidationRule = { type };
    updateField({ validation: [...rules, newRule] });
  };

  const updateValidationRule = (
    index: number,
    updates: Partial<ValidationRule>
  ) => {
    const rules = [...(field.validation || [])];
    rules[index] = { ...rules[index], ...updates };
    updateField({ validation: rules });
  };

  const removeValidationRule = (index: number) => {
    const rules = (field.validation || []).filter((_, i) => i !== index);
    updateField({ validation: rules });
  };

  const updateConditionalLogic = (updates: Partial<ConditionalLogic>) => {
    const logic: ConditionalLogic = {
      enabled: field.conditionalLogic?.enabled || false,
      action: field.conditionalLogic?.action || "show",
      rules: field.conditionalLogic?.rules || [],
      match: field.conditionalLogic?.match || "all",
      ...updates,
    };
    updateField({ conditionalLogic: logic });
  };

  const otherFields = allFields.filter((f) => f.id !== field.id);
  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Field label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ""}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-description">Help Text</Label>
          <Textarea
            id="field-description"
            value={field.description || ""}
            onChange={(e) => updateField({ description: e.target.value })}
            placeholder="Additional instructions for the user"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="field-required">Required</Label>
          <Switch
            id="field-required"
            checked={field.required}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Field Width</Label>
          <Select
            value={field.width || "full"}
            onValueChange={(value) =>
              updateField({ width: value as "full" | "half" | "third" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Width</SelectItem>
              <SelectItem value="half">Half Width</SelectItem>
              <SelectItem value="third">Third Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Options for select, radio, checkbox */}
      {hasOptions && (
        <>
          <Accordion type="single" collapsible defaultValue="options">
            <AccordionItem value="options" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <span className="font-medium">Options</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {(field.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Input
                        value={option.label}
                        onChange={(e) =>
                          updateOption(index, {
                            label: e.target.value,
                            value: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                          })
                        }
                        placeholder="Option label"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeOption(index)}
                        disabled={(field.options || []).length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator />
        </>
      )}

      {/* Number field specific settings */}
      {field.type === "number" && (
        <>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="field-min">Min</Label>
                <Input
                  id="field-min"
                  type="number"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    updateField({
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-max">Max</Label>
                <Input
                  id="field-max"
                  type="number"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    updateField({
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-step">Step</Label>
                <Input
                  id="field-step"
                  type="number"
                  value={field.step ?? 1}
                  onChange={(e) =>
                    updateField({
                      step: e.target.value ? Number(e.target.value) : 1,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* File field specific settings */}
      {field.type === "file" && (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-accepted-types">Accepted File Types</Label>
              <Input
                id="field-accepted-types"
                value={(field.acceptedFileTypes || []).join(", ")}
                onChange={(e) =>
                  updateField({
                    acceptedFileTypes: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder=".pdf, .doc, .jpg"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated file extensions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-max-size">Max File Size (MB)</Label>
              <Input
                id="field-max-size"
                type="number"
                value={field.maxFileSize ?? 5}
                onChange={(e) =>
                  updateField({
                    maxFileSize: e.target.value ? Number(e.target.value) : 5,
                  })
                }
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Validation Rules */}
      <Accordion type="single" collapsible>
        <AccordionItem value="validation" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline">
            <span className="font-medium">Validation</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {(field.validation || []).map((rule, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {rule.type.replace("_", " ")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeValidationRule(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {["minLength", "maxLength", "min", "max"].includes(rule.type) && (
                      <Input
                        type="number"
                        value={rule.value as number}
                        onChange={(e) =>
                          updateValidationRule(index, {
                            value: Number(e.target.value),
                          })
                        }
                        placeholder="Value"
                      />
                    )}
                    {rule.type === "pattern" && (
                      <Input
                        value={rule.value as string}
                        onChange={(e) =>
                          updateValidationRule(index, { value: e.target.value })
                        }
                        placeholder="Regex pattern"
                      />
                    )}
                    <Input
                      value={rule.message || ""}
                      onChange={(e) =>
                        updateValidationRule(index, { message: e.target.value })
                      }
                      placeholder="Error message"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}

              <Select
                value=""
                onValueChange={(type) =>
                  addValidationRule(type as ValidationRule["type"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add validation rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minLength">Min Length</SelectItem>
                  <SelectItem value="maxLength">Max Length</SelectItem>
                  <SelectItem value="pattern">Pattern (Regex)</SelectItem>
                  {field.type === "number" && (
                    <>
                      <SelectItem value="min">Minimum Value</SelectItem>
                      <SelectItem value="max">Maximum Value</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Conditional Logic */}
      {otherFields.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="conditional" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="font-medium">Conditional Logic</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Enable Conditional Logic</Label>
                  <Switch
                    checked={field.conditionalLogic?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateConditionalLogic({ enabled: checked })
                    }
                  />
                </div>

                {field.conditionalLogic?.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select
                        value={field.conditionalLogic?.action || "show"}
                        onValueChange={(value) =>
                          updateConditionalLogic({
                            action: value as "show" | "hide",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Show this field</SelectItem>
                          <SelectItem value="hide">Hide this field</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Match</Label>
                      <Select
                        value={field.conditionalLogic?.match || "all"}
                        onValueChange={(value) =>
                          updateConditionalLogic({ match: value as "all" | "any" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All conditions</SelectItem>
                          <SelectItem value="any">Any condition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Conditions</Label>
                      {(field.conditionalLogic?.rules || []).map((rule, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Select
                              value={rule.fieldId}
                              onValueChange={(value) => {
                                const rules = [
                                  ...(field.conditionalLogic?.rules || []),
                                ];
                                rules[index] = { ...rules[index], fieldId: value };
                                updateConditionalLogic({ rules });
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {otherFields.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>
                                    {f.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const rules = (
                                  field.conditionalLogic?.rules || []
                                ).filter((_, i) => i !== index);
                                updateConditionalLogic({ rules });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Select
                            value={rule.operator}
                            onValueChange={(value) => {
                              const rules = [
                                ...(field.conditionalLogic?.rules || []),
                              ];
                              rules[index] = {
                                ...rules[index],
                                operator: value as typeof rule.operator,
                              };
                              updateConditionalLogic({ rules });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Operator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">Not Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="not_contains">
                                Not Contains
                              </SelectItem>
                              <SelectItem value="is_empty">Is Empty</SelectItem>
                              <SelectItem value="is_not_empty">
                                Is Not Empty
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {!["is_empty", "is_not_empty"].includes(rule.operator) && (
                            <Input
                              value={rule.value}
                              onChange={(e) => {
                                const rules = [
                                  ...(field.conditionalLogic?.rules || []),
                                ];
                                rules[index] = {
                                  ...rules[index],
                                  value: e.target.value,
                                };
                                updateConditionalLogic({ rules });
                              }}
                              placeholder="Value"
                            />
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const rules = [
                            ...(field.conditionalLogic?.rules || []),
                            {
                              fieldId: otherFields[0]?.id || "",
                              operator: "equals" as const,
                              value: "",
                            },
                          ];
                          updateConditionalLogic({ rules });
                        }}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Condition
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <Separator />

      {/* Default Value */}
      <div className="space-y-2">
        <Label htmlFor="field-default">Default Value</Label>
        <Input
          id="field-default"
          value={field.defaultValue || ""}
          onChange={(e) => updateField({ defaultValue: e.target.value })}
          placeholder="Default value"
        />
      </div>
    </div>
  );
}
