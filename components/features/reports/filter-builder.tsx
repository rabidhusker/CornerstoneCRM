"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type {
  FilterCondition,
  FilterGroup,
  FilterOperator,
  ReportField,
  FieldType,
} from "@/types/report";
import { getOperatorLabel, getOperatorsForType } from "@/types/report";

interface FilterBuilderProps {
  fields: ReportField[];
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
}

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create empty condition
function createEmptyCondition(field: ReportField): FilterCondition {
  return {
    id: generateId(),
    field: field.name,
    operator: "equals",
    value: "",
  };
}

// Create empty group
function createEmptyGroup(): FilterGroup {
  return {
    id: generateId(),
    logic: "and",
    conditions: [],
  };
}

// Condition editor component
function ConditionEditor({
  condition,
  fields,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  fields: ReportField[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}) {
  const selectedField = fields.find((f) => f.name === condition.field);
  const fieldType = selectedField?.type || "string";
  const operators = getOperatorsForType(fieldType);

  const handleFieldChange = (fieldName: string) => {
    const newField = fields.find((f) => f.name === fieldName);
    const newType = newField?.type || "string";
    const newOperators = getOperatorsForType(newType);
    const newOperator = newOperators.includes(condition.operator)
      ? condition.operator
      : newOperators[0];

    onChange({
      ...condition,
      field: fieldName,
      operator: newOperator,
      value: "",
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({
      ...condition,
      operator,
      value: operator === "is_empty" || operator === "is_not_empty" ? null : condition.value,
    });
  };

  const showValueInput = !["is_empty", "is_not_empty"].includes(condition.operator);
  const showSecondValue = condition.operator === "between";

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

      {/* Field selector */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onValueChange={(v) => handleOperatorChange(v as FilterOperator)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op}>
              {getOperatorLabel(op)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {showValueInput && (
        <>
          {fieldType === "boolean" ? (
            <Select
              value={String(condition.value)}
              onValueChange={(v) =>
                onChange({ ...condition, value: v === "true" })
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : fieldType === "date" ? (
            <Input
              type="date"
              value={String(condition.value || "")}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              className="w-[160px]"
            />
          ) : fieldType === "number" || fieldType === "currency" ? (
            <Input
              type="number"
              value={String(condition.value || "")}
              onChange={(e) =>
                onChange({ ...condition, value: parseFloat(e.target.value) || 0 })
              }
              placeholder="Enter value"
              className="w-[120px]"
            />
          ) : (
            <Input
              type="text"
              value={String(condition.value || "")}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder="Enter value"
              className="w-[160px]"
            />
          )}

          {showSecondValue && (
            <>
              <span className="text-muted-foreground">and</span>
              {fieldType === "date" ? (
                <Input
                  type="date"
                  value={String(condition.secondValue || "")}
                  onChange={(e) =>
                    onChange({ ...condition, secondValue: e.target.value })
                  }
                  className="w-[160px]"
                />
              ) : (
                <Input
                  type="number"
                  value={String(condition.secondValue || "")}
                  onChange={(e) =>
                    onChange({
                      ...condition,
                      secondValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="End value"
                  className="w-[120px]"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Group editor component
function GroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  depth = 0,
}: {
  group: FilterGroup;
  fields: ReportField[];
  onChange: (group: FilterGroup) => void;
  onRemove?: () => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addCondition = () => {
    const firstField = fields[0];
    if (!firstField) return;

    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyCondition(firstField)],
    });
  };

  const addGroup = () => {
    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyGroup()],
    });
  };

  const updateCondition = (index: number, condition: FilterCondition | FilterGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onChange({ ...group, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({ ...group, conditions: newConditions });
  };

  const toggleLogic = () => {
    onChange({ ...group, logic: group.logic === "and" ? "or" : "and" });
  };

  const isCondition = (item: FilterCondition | FilterGroup): item is FilterCondition => {
    return "field" in item && "operator" in item;
  };

  return (
    <div
      className={`border rounded-lg ${depth > 0 ? "border-dashed ml-6" : ""}`}
    >
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <span className="text-sm text-muted-foreground">Match</span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLogic}
            className="h-7 px-2 font-medium"
          >
            {group.logic.toUpperCase()}
          </Button>
          <span className="text-sm text-muted-foreground">of the following</span>

          <Badge variant="secondary" className="ml-2">
            {group.conditions.length} condition
            {group.conditions.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-1" />
            Condition
          </Button>
          {depth < 2 && (
            <Button variant="ghost" size="sm" onClick={addGroup}>
              <Plus className="h-4 w-4 mr-1" />
              Group
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2">
          {group.conditions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No conditions added yet</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Add condition
              </Button>
            </div>
          ) : (
            group.conditions.map((item, index) => (
              <div key={isCondition(item) ? item.id : item.id}>
                {index > 0 && (
                  <div className="flex items-center justify-center py-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {group.logic.toUpperCase()}
                    </Badge>
                  </div>
                )}
                {isCondition(item) ? (
                  <ConditionEditor
                    condition={item}
                    fields={fields}
                    onChange={(c) => updateCondition(index, c)}
                    onRemove={() => removeCondition(index)}
                  />
                ) : (
                  <GroupEditor
                    group={item}
                    fields={fields}
                    onChange={(g) => updateCondition(index, g)}
                    onRemove={() => removeCondition(index)}
                    depth={depth + 1}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FilterBuilder({ fields, value, onChange }: FilterBuilderProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <GroupEditor group={value} fields={fields} onChange={onChange} />
      </CardContent>
    </Card>
  );
}

// Compact filter summary for display
export function FilterSummary({
  filters,
  fields,
}: {
  filters: FilterGroup;
  fields: ReportField[];
}) {
  const getFieldLabel = (fieldName: string) => {
    return fields.find((f) => f.name === fieldName)?.label || fieldName;
  };

  const renderCondition = (condition: FilterCondition) => {
    const fieldLabel = getFieldLabel(condition.field);
    const operatorLabel = getOperatorLabel(condition.operator);

    if (condition.operator === "is_empty" || condition.operator === "is_not_empty") {
      return `${fieldLabel} ${operatorLabel}`;
    }

    if (condition.operator === "between") {
      return `${fieldLabel} ${operatorLabel} ${condition.value} and ${condition.secondValue}`;
    }

    return `${fieldLabel} ${operatorLabel} "${condition.value}"`;
  };

  const isCondition = (item: FilterCondition | FilterGroup): item is FilterCondition => {
    return "field" in item && "operator" in item;
  };

  if (filters.conditions.length === 0) {
    return <span className="text-muted-foreground">No filters</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {filters.conditions.map((item, index) => (
        <span key={isCondition(item) ? item.id : item.id}>
          {index > 0 && (
            <Badge variant="outline" className="mx-1 text-xs">
              {filters.logic.toUpperCase()}
            </Badge>
          )}
          {isCondition(item) ? (
            <Badge variant="secondary" className="font-normal">
              {renderCondition(item)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-normal">
              ({item.conditions.length} nested conditions)
            </Badge>
          )}
        </span>
      ))}
    </div>
  );
}
