"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  Mail,
  Phone,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Circle,
  Calendar,
  Upload,
  Hash,
  Link,
  EyeOff,
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FormFieldConfig } from "./form-field-config";
import type { FormField, FormFieldType } from "@/types/form";
import { createFormField, fieldTypeConfig } from "@/types/form";

const fieldIcons: Record<FormFieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  radio: <Circle className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  hidden: <EyeOff className="h-4 w-4" />,
};

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

interface SortableFieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border rounded-lg p-4 bg-background transition-colors",
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0" onClick={onSelect}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground">
              {fieldIcons[field.type]}
            </span>
            <span className="font-medium truncate">{field.label}</span>
            {field.required && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {fieldTypeConfig[field.type].description}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldTypeButton({
  type,
  onClick,
}: {
  type: FormFieldType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors text-left w-full"
    >
      <span className="text-muted-foreground">{fieldIcons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{fieldTypeConfig[type].label}</p>
      </div>
    </button>
  );
}

export function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const selectedField = selectedFieldId
    ? fields.find((f) => f.id === selectedFieldId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleAddField = (type: FormFieldType) => {
    const newField = createFormField(type, fields.length);
    onChange([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleDeleteField = (fieldId: string) => {
    onChange(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleDuplicateField = (fieldId: string) => {
    const fieldToDuplicate = fields.find((f) => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField: FormField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: `${fieldToDuplicate.label} (Copy)`,
    };

    const index = fields.findIndex((f) => f.id === fieldId);
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    onChange(newFields);
    setSelectedFieldId(newField.id);
  };

  const handleFieldChange = (updatedField: FormField) => {
    onChange(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
  };

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;

  return (
    <div className="flex h-full">
      {/* Field Types Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Add Fields</h3>
          <p className="text-sm text-muted-foreground">
            Click to add a field to your form
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              BASIC FIELDS
            </p>
            <FieldTypeButton type="text" onClick={() => handleAddField("text")} />
            <FieldTypeButton type="email" onClick={() => handleAddField("email")} />
            <FieldTypeButton type="phone" onClick={() => handleAddField("phone")} />
            <FieldTypeButton type="textarea" onClick={() => handleAddField("textarea")} />
            <FieldTypeButton type="number" onClick={() => handleAddField("number")} />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              CHOICE FIELDS
            </p>
            <FieldTypeButton type="select" onClick={() => handleAddField("select")} />
            <FieldTypeButton type="radio" onClick={() => handleAddField("radio")} />
            <FieldTypeButton type="checkbox" onClick={() => handleAddField("checkbox")} />

            <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
              ADVANCED FIELDS
            </p>
            <FieldTypeButton type="date" onClick={() => handleAddField("date")} />
            <FieldTypeButton type="file" onClick={() => handleAddField("file")} />
            <FieldTypeButton type="url" onClick={() => handleAddField("url")} />
            <FieldTypeButton type="hidden" onClick={() => handleAddField("hidden")} />
          </div>
        </ScrollArea>
      </div>

      {/* Form Builder Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {fields.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No fields yet</p>
                  <p className="text-muted-foreground text-center mb-4">
                    Click on a field type in the sidebar to add your first field
                  </p>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onDelete={() => handleDeleteField(field.id)}
                        onDuplicate={() => handleDuplicateField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeField && (
                    <div className="border rounded-lg p-4 bg-background shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {fieldIcons[activeField.type]}
                        </span>
                        <span className="font-medium">{activeField.label}</span>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Field Configuration Panel */}
      {selectedField && (
        <div className="w-80 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Field Settings</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedFieldId(null)}
            >
              &times;
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <FormFieldConfig
                field={selectedField}
                onChange={handleFieldChange}
                allFields={fields}
              />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
