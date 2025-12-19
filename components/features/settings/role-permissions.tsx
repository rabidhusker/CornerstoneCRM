"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  RolePermissions,
  PermissionResource,
  ResourcePermission,
  PermissionLevel,
} from "@/types/settings";
import { resourceLabels, permissionLevelLabels } from "@/types/settings";

interface RolePermissionsEditorProps {
  permissions: RolePermissions;
  onChange: (permissions: RolePermissions) => void;
  disabled?: boolean;
}

// All permission resources in order
const allResources: PermissionResource[] = [
  "contacts",
  "deals",
  "pipelines",
  "campaigns",
  "templates",
  "workflows",
  "forms",
  "pages",
  "conversations",
  "appointments",
  "reports",
  "settings",
  "users",
  "roles",
  "integrations",
  "billing",
];

// Default empty permission
const emptyPermission: ResourcePermission = {
  view: "none",
  create: false,
  edit: "none",
  delete: "none",
};

// Permission level options
const permissionLevels: PermissionLevel[] = ["none", "own", "team", "all"];

export function RolePermissionsEditor({
  permissions,
  onChange,
  disabled = false,
}: RolePermissionsEditorProps) {
  // Get permission for a resource
  const getPermission = (resource: PermissionResource): ResourcePermission => {
    return permissions[resource] || emptyPermission;
  };

  // Update a specific permission
  const updatePermission = (
    resource: PermissionResource,
    field: keyof ResourcePermission,
    value: PermissionLevel | boolean
  ) => {
    const current = getPermission(resource);
    const updated = { ...current, [field]: value };

    onChange({
      ...permissions,
      [resource]: updated,
    });
  };

  // Set all permissions for a resource to a level
  const setAllForResource = (resource: PermissionResource, level: PermissionLevel) => {
    onChange({
      ...permissions,
      [resource]: {
        view: level,
        create: level !== "none",
        edit: level,
        delete: level,
      },
    });
  };

  // Group resources by category
  const resourceGroups = [
    {
      label: "Core CRM",
      resources: ["contacts", "deals", "pipelines", "conversations", "appointments"] as PermissionResource[],
    },
    {
      label: "Marketing",
      resources: ["campaigns", "templates", "forms", "pages"] as PermissionResource[],
    },
    {
      label: "Automation & Reports",
      resources: ["workflows", "reports"] as PermissionResource[],
    },
    {
      label: "Administration",
      resources: ["settings", "users", "roles", "integrations", "billing"] as PermissionResource[],
    },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Resource</TableHead>
            <TableHead className="w-[120px]">View</TableHead>
            <TableHead className="w-[80px]">Create</TableHead>
            <TableHead className="w-[120px]">Edit</TableHead>
            <TableHead className="w-[120px]">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resourceGroups.map((group, groupIndex) => (
            <>
              {/* Group header */}
              <TableRow key={`group-${groupIndex}`} className="bg-muted/30">
                <TableCell colSpan={5} className="py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {group.label}
                  </span>
                </TableCell>
              </TableRow>

              {/* Resources in group */}
              {group.resources.map((resource) => {
                const perm = getPermission(resource);
                const isAdminResource = ["settings", "users", "roles", "billing"].includes(resource);

                return (
                  <TableRow key={resource}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {resourceLabels[resource]}
                        {isAdminResource && (
                          <Badge variant="outline" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* View */}
                    <TableCell>
                      <Select
                        value={perm.view}
                        onValueChange={(v) =>
                          updatePermission(resource, "view", v as PermissionLevel)
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {permissionLevelLabels[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Create */}
                    <TableCell>
                      <Checkbox
                        checked={perm.create}
                        onCheckedChange={(checked) =>
                          updatePermission(resource, "create", !!checked)
                        }
                        disabled={disabled || perm.view === "none"}
                      />
                    </TableCell>

                    {/* Edit */}
                    <TableCell>
                      <Select
                        value={perm.edit}
                        onValueChange={(v) =>
                          updatePermission(resource, "edit", v as PermissionLevel)
                        }
                        disabled={disabled || perm.view === "none"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {permissionLevelLabels[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Delete */}
                    <TableCell>
                      <Select
                        value={perm.delete}
                        onValueChange={(v) =>
                          updatePermission(resource, "delete", v as PermissionLevel)
                        }
                        disabled={disabled || perm.view === "none"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {permissionLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {permissionLevelLabels[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </>
          ))}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">None:</span>
            <span>No access</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Own:</span>
            <span>Only their own records</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Team:</span>
            <span>Their team's records</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">All:</span>
            <span>All records in organization</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact permission summary
export function PermissionSummary({
  permissions,
}: {
  permissions: RolePermissions;
}) {
  const getAccessLevel = (resource: PermissionResource): string => {
    const perm = permissions[resource];
    if (!perm || perm.view === "none") return "None";
    if (perm.view === "all" && perm.edit === "all" && perm.delete === "all") {
      return "Full";
    }
    if (perm.view === "all") {
      if (perm.edit !== "none") return "Edit";
      return "View";
    }
    return permissionLevelLabels[perm.view];
  };

  const coreResources: PermissionResource[] = [
    "contacts",
    "deals",
    "campaigns",
    "reports",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {coreResources.map((resource) => (
        <Badge key={resource} variant="outline" className="text-xs">
          {resourceLabels[resource]}: {getAccessLevel(resource)}
        </Badge>
      ))}
    </div>
  );
}
