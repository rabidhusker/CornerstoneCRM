"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import { RotateCcw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FormStyles, FormField } from "@/types/form";
import { defaultFormStyles } from "@/types/form";

interface FormStyleEditorProps {
  styles: FormStyles;
  onChange: (styles: Partial<FormStyles>) => void;
  fields: FormField[];
}

interface ColorInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ id, label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(id)?.click()}
        />
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="hidden"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function FormStyleEditor({
  styles,
  onChange,
  fields,
}: FormStyleEditorProps) {
  const resetStyles = () => {
    onChange(defaultFormStyles);
  };

  return (
    <div className="flex h-full">
      {/* Style Editor */}
      <div className="w-96 border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Style Editor</h3>
          <Button variant="outline" size="sm" onClick={resetStyles}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <Accordion
              type="multiple"
              defaultValue={["layout", "colors", "typography"]}
            >
              {/* Layout */}
              <AccordionItem value="layout">
                <AccordionTrigger>Layout</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="max-width">Max Width</Label>
                      <Input
                        id="max-width"
                        value={styles.maxWidth}
                        onChange={(e) => onChange({ maxWidth: e.target.value })}
                        placeholder="600px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="padding">Padding</Label>
                      <Input
                        id="padding"
                        value={styles.padding}
                        onChange={(e) => onChange({ padding: e.target.value })}
                        placeholder="24px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="border-radius">Border Radius</Label>
                      <Input
                        id="border-radius"
                        value={styles.borderRadius}
                        onChange={(e) => onChange({ borderRadius: e.target.value })}
                        placeholder="8px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Alignment</Label>
                      <Select
                        value={styles.alignment}
                        onValueChange={(value) =>
                          onChange({ alignment: value as "left" | "center" | "right" })
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
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Colors */}
              <AccordionItem value="colors">
                <AccordionTrigger>Colors</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <ColorInput
                      id="bg-color"
                      label="Background Color"
                      value={styles.backgroundColor}
                      onChange={(value) => onChange({ backgroundColor: value })}
                    />

                    <ColorInput
                      id="text-color"
                      label="Text Color"
                      value={styles.textColor}
                      onChange={(value) => onChange({ textColor: value })}
                    />

                    <ColorInput
                      id="label-color"
                      label="Label Color"
                      value={styles.labelColor}
                      onChange={(value) => onChange({ labelColor: value })}
                    />

                    <ColorInput
                      id="border-color"
                      label="Border Color"
                      value={styles.borderColor}
                      onChange={(value) => onChange({ borderColor: value })}
                    />

                    <ColorInput
                      id="primary-color"
                      label="Primary Color"
                      value={styles.primaryColor}
                      onChange={(value) => onChange({ primaryColor: value })}
                    />

                    <ColorInput
                      id="error-color"
                      label="Error Color"
                      value={styles.errorColor}
                      onChange={(value) => onChange({ errorColor: value })}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Typography */}
              <AccordionItem value="typography">
                <AccordionTrigger>Typography</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={styles.fontFamily}
                        onValueChange={(value) => onChange({ fontFamily: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system-ui, -apple-system, sans-serif">
                            System Default
                          </SelectItem>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="'Times New Roman', serif">
                            Times New Roman
                          </SelectItem>
                          <SelectItem value="'Courier New', monospace">
                            Courier New
                          </SelectItem>
                          <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                          <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="font-size">Font Size</Label>
                      <Input
                        id="font-size"
                        value={styles.fontSize}
                        onChange={(e) => onChange({ fontSize: e.target.value })}
                        placeholder="16px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="label-font-size">Label Font Size</Label>
                      <Input
                        id="label-font-size"
                        value={styles.labelFontSize}
                        onChange={(e) => onChange({ labelFontSize: e.target.value })}
                        placeholder="14px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Label Font Weight</Label>
                      <Select
                        value={styles.labelFontWeight}
                        onValueChange={(value) =>
                          onChange({ labelFontWeight: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi-Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Form Fields */}
              <AccordionItem value="fields">
                <AccordionTrigger>Form Fields</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <ColorInput
                      id="field-bg-color"
                      label="Field Background"
                      value={styles.fieldBackgroundColor}
                      onChange={(value) =>
                        onChange({ fieldBackgroundColor: value })
                      }
                    />

                    <ColorInput
                      id="field-border-color"
                      label="Field Border Color"
                      value={styles.fieldBorderColor}
                      onChange={(value) => onChange({ fieldBorderColor: value })}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="field-border-radius">
                        Field Border Radius
                      </Label>
                      <Input
                        id="field-border-radius"
                        value={styles.fieldBorderRadius}
                        onChange={(e) =>
                          onChange({ fieldBorderRadius: e.target.value })
                        }
                        placeholder="6px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-padding">Field Padding</Label>
                      <Input
                        id="field-padding"
                        value={styles.fieldPadding}
                        onChange={(e) => onChange({ fieldPadding: e.target.value })}
                        placeholder="10px 12px"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Button */}
              <AccordionItem value="button">
                <AccordionTrigger>Submit Button</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <ColorInput
                      id="button-bg-color"
                      label="Background Color"
                      value={styles.buttonBackgroundColor}
                      onChange={(value) =>
                        onChange({ buttonBackgroundColor: value })
                      }
                    />

                    <ColorInput
                      id="button-text-color"
                      label="Text Color"
                      value={styles.buttonTextColor}
                      onChange={(value) => onChange({ buttonTextColor: value })}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="button-border-radius">Border Radius</Label>
                      <Input
                        id="button-border-radius"
                        value={styles.buttonBorderRadius}
                        onChange={(e) =>
                          onChange({ buttonBorderRadius: e.target.value })
                        }
                        placeholder="6px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="button-padding">Padding</Label>
                      <Input
                        id="button-padding"
                        value={styles.buttonPadding}
                        onChange={(e) => onChange({ buttonPadding: e.target.value })}
                        placeholder="10px 20px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <Select
                        value={styles.buttonFontWeight}
                        onValueChange={(value) =>
                          onChange({ buttonFontWeight: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi-Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Custom CSS */}
              <AccordionItem value="custom-css">
                <AccordionTrigger>Custom CSS</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="custom-css">Custom Styles</Label>
                    <Textarea
                      id="custom-css"
                      value={styles.customCss || ""}
                      onChange={(e) => onChange({ customCss: e.target.value })}
                      placeholder={`.form-container {
  /* Your custom styles */
}`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add custom CSS to further customize your form
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* Live Preview */}
      <div className="flex-1 overflow-auto bg-muted/50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Live Preview</CardTitle>
              <CardDescription>
                See your style changes in real-time
              </CardDescription>
            </CardHeader>
          </Card>

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
            {fields.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Add fields to see the style preview
              </p>
            ) : (
              <div className="space-y-6">
                {fields.slice(0, 3).map((field) => (
                  <div key={field.id}>
                    <label
                      className="block mb-2"
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
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      disabled
                      className="w-full border"
                      style={{
                        backgroundColor: styles.fieldBackgroundColor,
                        borderColor: styles.fieldBorderColor,
                        borderRadius: styles.fieldBorderRadius,
                        padding: styles.fieldPadding,
                        color: styles.textColor,
                      }}
                    />
                  </div>
                ))}

                <button
                  disabled
                  style={{
                    backgroundColor: styles.buttonBackgroundColor,
                    color: styles.buttonTextColor,
                    borderRadius: styles.buttonBorderRadius,
                    padding: styles.buttonPadding,
                    fontWeight: styles.buttonFontWeight,
                    border: "none",
                    cursor: "not-allowed",
                  }}
                >
                  Submit
                </button>
              </div>
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
